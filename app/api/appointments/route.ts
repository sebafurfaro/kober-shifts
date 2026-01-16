import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAppointmentsByDateRange, findUserById, findLocationById, findSpecialtyById, findProfessionalProfileByUserId, findGoogleOAuthTokenByUserId, createAppointment } from "@/lib/db";
import { createAppointmentEvent } from "@/lib/googleCalendar";
import { AppointmentStatus, Role } from "@/lib/types";
import { randomUUID } from "crypto";
import { mysqlDateToUTC, utcToMySQLDate } from "@/lib/timezone";
import { toZonedTime } from "date-fns-tz";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const filters: {
    patientId?: string;
    professionalId?: string;
  } = {};

  if (session.role === Role.PATIENT) {
    filters.patientId = session.userId;
  } else if (session.role === Role.PROFESSIONAL) {
    filters.professionalId = session.userId;
  } else if (session.role === Role.ADMIN) {
    // Admin can filter by professionalId or patientId if provided
    if (professionalId) filters.professionalId = professionalId;
    if (patientId) filters.patientId = patientId;
  }

  const appointments = await findAppointmentsByDateRange(startDate, endDate, filters);

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
            "#ff9800"; // REQUESTED

    // Always prioritize professional color over status color if it exists
    const backgroundColor = hasValidColor ? professionalColor.trim() : statusColor;
    const borderColor = hasValidColor ? professionalColor.trim() : statusColor;

    // MySQL stores dates as naive BA local time (e.g., "10:00:00" means 10:00 BA)
    // mysql2 interprets them as UTC when reading (e.g., "10:00:00" becomes 10:00 UTC)
    // 
    // The user wants the event to display in FullCalendar exactly as stored in MySQL (10:00)
    // Since FullCalendar is showing the converted value (13:00) instead of the MySQL value (10:00),
    // we need to send the MySQL dates directly without conversion.
    // 
    // FullCalendar with timeZone configured will receive 10:00 UTC and should display it.
    // If timeZone is working correctly, it will show 07:00 BA (10:00 UTC = 07:00 BA).
    // But the user wants to see 10:00, so we're assuming timeZone is not working or
    // we need to send it in a way that FullCalendar shows 10:00.
    const startDate = apt.startAt instanceof Date ? apt.startAt : new Date(apt.startAt);
    const endDate = apt.endAt instanceof Date ? apt.endAt : new Date(apt.endAt);

    // We need to convert the naive MySQL date (interpreted as UTC) to the actual UTC timestamp
    // that corresponds to that local time in Buenos Aires.
    // Example: Stored "10:00" (BA) -> Read as "10:00 UTC" -> Convert to "13:00 UTC"
    // FullCalendar (BA) receives "13:00 UTC" -> Displays "10:00"
    const startISO = mysqlDateToUTC(startDate).toISOString();
    const endISO = mysqlDateToUTC(endDate).toISOString();

    return {
      id: apt.id,
      title: `${apt.specialty.name} - ${apt.patient.name}`,
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
        specialtyId: apt.specialtyId,
        specialtyName: apt.specialty.name,
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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patientId = typeof body.patientId === "string" ? body.patientId : "";
  const professionalId = typeof body.professionalId === "string" ? body.professionalId : "";
  const locationId = typeof body.locationId === "string" ? body.locationId : (body.locationId === null ? null : "");
  const specialtyId = typeof body.specialtyId === "string" ? body.specialtyId : (body.specialtyId === null ? null : "");

  // Default section visibility
  const showLocations = true;
  const showSpecialties = true;

  // Parse dates from ISO string and convert to MySQL format
  // Use centralized timezone utilities for consistent conversion
  let startAt: Date | null = null;
  let endAt: Date | null = null;

  if (typeof body.startAt === "string") {
    // Parse the UTC ISO string from the client
    const utcDate = new Date(body.startAt);
    // Convert UTC to MySQL date format (naive BA local time)
    startAt = utcToMySQLDate(utcDate);
  }

  if (typeof body.endAt === "string") {
    const utcDate = new Date(body.endAt);
    endAt = utcToMySQLDate(utcDate);
  }
  const notes = typeof body.notes === "string" ? body.notes : null;

  // Validate required fields based on section visibility
  if (!patientId || !professionalId || !startAt || !endAt) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (showLocations && !locationId) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }

  if (showSpecialties && !specialtyId) {
    return NextResponse.json({ error: "Specialty is required" }, { status: 400 });
  }
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }


  // Only fetch location and specialty if they are required
  const [patient, professional, location, specialty, professionalProfile, googleOAuth] = await Promise.all([
    findUserById(patientId),
    findUserById(professionalId),
    showLocations && locationId ? findLocationById(locationId) : Promise.resolve(null),
    showSpecialties && specialtyId ? findSpecialtyById(specialtyId) : Promise.resolve(null),
    findProfessionalProfileByUserId(professionalId),
    findGoogleOAuthTokenByUserId(professionalId),
  ]);

  if (!patient || patient.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Invalid patient" }, { status: 400 });
  }
  if (!professional || professional.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Invalid professional" }, { status: 400 });
  }
  if (showLocations && (!locationId || !location)) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }
  if (showSpecialties && (!specialtyId || !specialty)) {
    return NextResponse.json({ error: "Invalid specialty" }, { status: 400 });
  }

  let googleEventId: string | null = null;

  // Try to create Google Calendar event if OAuth token exists
  if (googleOAuth && professionalProfile) {
    try {
      const calendarId = professionalProfile.googleCalendarId ?? "primary";
      const event = await createAppointmentEvent({
        accessToken: googleOAuth.accessToken,
        refreshToken: googleOAuth.refreshToken,
        calendarId,
        summary: `Turno${specialty ? ` - ${specialty.name}` : ""}`,
        description: `${location ? `Sede: ${location.name}\n` : ""}Paciente: ${patient.name} (${patient.email})${notes ? `\nNotas: ${notes}` : ""}`,
        startAt,
        endAt,
        attendeeEmails: [patient.email, professional.email],
      });
      googleEventId = event.id ?? null;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      // Continue without Google Calendar event
    }
  }

  const appointment = await createAppointment({
    id: randomUUID(),
    patientId: patient.id,
    professionalId: professional.id,
    locationId: showLocations && location ? location.id : null,
    specialtyId: showSpecialties && specialty ? specialty.id : null,
    startAt,
    endAt,
    status: AppointmentStatus.REQUESTED,
    googleEventId,
    notes,
  });

  return NextResponse.json({ appointmentId: appointment.id, googleEventId: appointment.googleEventId });
}

