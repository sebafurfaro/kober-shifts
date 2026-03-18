import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAppointmentsByDateRange, findUserById, findLocationById, findProfessionalProfileByUserId, findGoogleOAuthTokenByUserId, createAppointment, findServiceById } from "@/lib/db";
import { getTenantSettingsRow } from "@/lib/settings-db";
import { createAppointmentEvent } from "@/lib/googleCalendar";
import { AppointmentStatus, Role } from "@/lib/types";
import { randomUUID } from "crypto";
import { utcToMySQLDate, BUENOS_AIRES_TIMEZONE, mysqlDateToUTC, formatInBuenosAires } from "@/lib/timezone";
import { toZonedTime } from "date-fns-tz";
import { getProfessionalAvailableDayNumbers } from "@/lib/professional-availability";
import { renderBasicTemplate, sendMail, getTurnoConfirmadoPacienteContent } from "@/lib/email";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const startStr = url.searchParams.get("start");
  const endStr = url.searchParams.get("end");
  const professionalId = url.searchParams.get("professionalId");
  const patientId = url.searchParams.get("patientId");

  if (!startStr || !endStr) {
    return NextResponse.json({ error: "start and end dates are required" }, { status: 400 });
  }

  // Parse dates as local time (MySQL DATETIME is stored without timezone)
  // The dates come as YYYY-MM-DD format, so we parse them as local dates
  const startDate = new Date(startStr + 'T00:00:00');
  const endDate = new Date(endStr + 'T23:59:59');

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Build filters based on user role
  // Calendario: solo pacientes ven sus turnos; staff (ADMIN, PROFESSIONAL, SUPERVISOR) ve todos los turnos de todos los profesionales
  const filters: {
    patientId?: string;
    professionalId?: string;
  } = {};

  if (session.role === Role.PATIENT) {
    filters.patientId = session.userId;
  } else if (session.role === Role.ADMIN) {
    if (professionalId) filters.professionalId = professionalId;
    if (patientId) filters.patientId = patientId;
  }
  // PROFESSIONAL y SUPERVISOR: sin filtro por profesional → se muestran todos los turnos en el calendario

  const appointments = await findAppointmentsByDateRange(tenantId, startDate, endDate, filters);

  // Format for FullCalendar
  const events = appointments.map((apt) => {
    // Use professional color if available, otherwise use status-based colors
    const professionalProfile = apt.professional.professional;
    const professionalColor = professionalProfile?.color;
    // Check if professionalColor is a valid non-empty string (not null, undefined, or empty)
    const hasValidColor = professionalColor && typeof professionalColor === 'string' && professionalColor.trim() !== "";
    const statusColor =
      apt.status === "CONFIRMED" ? "#4caf50" :
        apt.status === "CANCELLED" ? "#f44336" :
          apt.status === "ATTENDED" ? "#2196f3" :
            apt.status === "PENDING_DEPOSIT" ? "#e65100" :
              "#ff9800"; // REQUESTED

    // Always prioritize professional color over status color if it exists
    const backgroundColor = hasValidColor ? professionalColor.trim() : statusColor;
    const borderColor = hasValidColor ? professionalColor.trim() : statusColor;

    const startDate = apt.startAt instanceof Date ? apt.startAt : new Date(apt.startAt);
    const endDate = apt.endAt instanceof Date ? apt.endAt : new Date(apt.endAt);

    // FullCalendar con timeZone nombrado SIN plugin usa "UTC-coercion": muestra la hora UTC
    // del ISO. En MySQL guardamos hora BA "naive"; mysql2 la devuelve como UTC (mismo número).
    // Enviamos ese ISO directo para que el calendario muestre 9:45 cuando el turno es 9:45 BA.
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    return {
      id: apt.id,
      title: apt.patient.name,
      start: startISO,
      end: endISO,
      extendedProps: {
        patientId: apt.patientId,
        patientName: apt.patient.name,
        patientEmail: apt.patient.email,
        professionalId: apt.professionalId,
        professionalName: apt.professional.name,
        professionalEmail: apt.professional.email,
        locationId: apt.locationId,
        locationName: apt.location.name,
        locationAddress: apt.location.address,
        status: apt.status,
        notes: apt.notes,
        googleEventId: apt.googleEventId,
        cancellationReason: apt.cancellationReason,
        cancelledBy: apt.cancelledBy,
      },
      backgroundColor,
      borderColor,
    };
  });

  return NextResponse.json(events);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patientId = typeof body.patientId === "string" ? body.patientId : "";
  const professionalId = typeof body.professionalId === "string" ? body.professionalId : "";
  const locationId = typeof body.locationId === "string" ? body.locationId : (body.locationId === null ? null : "");

  const showLocations = true;

  // Parse dates from ISO string and convert to MySQL format
  let startAt: Date | null = null;
  let endAt: Date | null = null;

  if (typeof body.startAt === "string") {
    const utcDate = new Date(body.startAt);
    startAt = utcToMySQLDate(utcDate);
  }

  if (typeof body.endAt === "string") {
    const utcDate = new Date(body.endAt);
    endAt = utcToMySQLDate(utcDate);
  }
  const notes = typeof body.notes === "string" ? body.notes : null;
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : null;

  // Validate required fields based on section visibility
  if (!patientId || !professionalId || !startAt || !endAt) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (showLocations && !locationId) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const [patient, professional, location, professionalProfile, googleOAuth] = await Promise.all([
    findUserById(patientId, tenantId),
    findUserById(professionalId, tenantId),
    showLocations && locationId ? findLocationById(locationId, tenantId) : Promise.resolve(null),
    findProfessionalProfileByUserId(professionalId, tenantId),
    findGoogleOAuthTokenByUserId(professionalId, tenantId),
  ]);

  if (!patient || patient.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Invalid patient" }, { status: 400 });
  }
  // Aceptar cualquier usuario con perfil profesional (incl. ADMIN/SUPERVISOR con perfil), coherente con la lista del calendario
  if (!professional || !professionalProfile) {
    return NextResponse.json({ error: "Invalid professional" }, { status: 400 });
  }
  if (showLocations && (!locationId || !location)) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const allowedDays = getProfessionalAvailableDayNumbers(professionalProfile);
  if (allowedDays.length > 0) {
    const startAtInBA = toZonedTime(startAt, BUENOS_AIRES_TIMEZONE);
    const dayOfWeek = startAtInBA.getDay();
    if (!allowedDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: "La fecha/hora elegida no está dentro de la disponibilidad del profesional." },
        { status: 400 }
      );
    }
  }

  // Check for duplicate appointments (same patient, professional, date and time)
  // Allow a small tolerance (1 minute) to account for potential timezone rounding issues
  const duplicateCheckStart = new Date(startAt.getTime() - 60000); // 1 minute before
  const duplicateCheckEnd = new Date(startAt.getTime() + 60000); // 1 minute after
  
  const existingAppointments = await findAppointmentsByDateRange(
    tenantId,
    duplicateCheckStart,
    duplicateCheckEnd,
    {
      patientId,
      professionalId,
    }
  );

  // Check if there's an overlapping appointment (excluding cancelled ones)
  const overlappingAppointment = existingAppointments.find(apt => {
    if (apt.status === AppointmentStatus.CANCELLED) return false;
    // Check if the new appointment overlaps with existing one
    // Overlap occurs if: newStart < existingEnd && newEnd > existingStart
    const existingStart = apt.startAt instanceof Date ? apt.startAt : new Date(apt.startAt);
    const existingEnd = apt.endAt instanceof Date ? apt.endAt : new Date(apt.endAt);
    return startAt < existingEnd && endAt > existingStart;
  });

  if (overlappingAppointment) {
    return NextResponse.json({ 
      error: "Ya existe un turno para este paciente y profesional en el mismo horario" 
    }, { status: 409 });
  }

  // Misma lógica que appointments/request: seña → PENDING_DEPOSIT; sin seña y manualTurnConfirmation → REQUESTED; sin seña y !manualTurnConfirmation → CONFIRMED
  let manualTurnConfirmation = false;
  let sendEmailConfirmation = false;
  try {
    const row = await getTenantSettingsRow(tenantId);
    const settings = row?.settings && typeof row.settings === "object" ? row.settings as Record<string, unknown> : {};
    manualTurnConfirmation = settings.manualTurnConfirmation === true;
    sendEmailConfirmation = settings.sendEmailConfirmation === true;
  } catch {
    // default: auto-confirm when no seña
  }
  const service = serviceId ? await findServiceById(serviceId, tenantId) : null;
  const hasSenia = !!(service && service.price > 0);
  const initialStatus =
    hasSenia
      ? AppointmentStatus.PENDING_DEPOSIT
      : manualTurnConfirmation
        ? AppointmentStatus.REQUESTED
        : AppointmentStatus.CONFIRMED;

  let googleEventId: string | null = null;

  // Try to create Google Calendar event if OAuth token exists
  if (googleOAuth && professionalProfile) {
    try {
      const calendarId = professionalProfile.googleCalendarId ?? "primary";
      const event = await createAppointmentEvent({
        accessToken: googleOAuth.accessToken,
        refreshToken: googleOAuth.refreshToken,
        calendarId,
        summary: "Turno",
        description: `${location ? `Sede: ${location.name}\n` : ""}Paciente: ${patient.name} (${patient.email})${notes ? `\nNotas: ${notes}` : ""}`,
        startAt,
        endAt,
        attendeeEmails: [patient.email, professional.email],
      });
      googleEventId = event.id ?? null;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
    }
  }

  const appointment = await createAppointment({
    id: randomUUID(),
    tenantId,
    patientId: patient.id,
    professionalId: professional.id,
    locationId: showLocations && location ? location.id : null,
    serviceId: serviceId ?? null,
    startAt,
    endAt,
    status: initialStatus,
    googleEventId,
    notes,
    patientFirstName: patient.firstName ?? null,
    patientLastName: patient.lastName ?? null,
  });

  if (initialStatus === AppointmentStatus.CONFIRMED && sendEmailConfirmation && patient.email) {
    try {
      const startFormatted = formatInBuenosAires(mysqlDateToUTC(startAt!), "dd/MM/yyyy HH:mm");
      const pacienteContent = getTurnoConfirmadoPacienteContent({
        profesional: professional.name,
        fechaHora: startFormatted,
        sede: location?.name ?? "",
      });
      await sendMail({
        to: patient.email,
        subject: "Turno confirmado",
        text: pacienteContent.text,
        html: renderBasicTemplate({
          title: "Turno confirmado",
          preview: pacienteContent.preview,
          body: pacienteContent.bodyHtml,
        }),
      });
    } catch (error) {
      console.error("Error sending confirmation email:", error);
    }
  }

  return NextResponse.json({ appointmentId: appointment.id, googleEventId: appointment.googleEventId });
}

