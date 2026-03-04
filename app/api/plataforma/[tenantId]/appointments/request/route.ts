import { NextResponse } from "next/server";
import { findUserById, findLocationById, findProfessionalProfileByUserId, findGoogleOAuthTokenByUserId, createAppointment, findServiceById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createAppointmentEvent } from "@/lib/googleCalendar";
import { renderBasicTemplate, sendMail } from "@/lib/email";
import { AppointmentStatus, Role } from "@/lib/types";
import { randomUUID } from "crypto";
import { realUTCToMySQLDate, mysqlDateToUTC, formatInBuenosAires } from "@/lib/timezone";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    console.error("Appointment request - Unauthorized:", { 
      hasSession: !!session, 
      sessionTenantId: session?.tenantId, 
      requestedTenantId: tenantId 
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.PATIENT) {
    console.error("Appointment request - Forbidden:", { 
      sessionRole: session.role, 
      expectedRole: Role.PATIENT,
      roleType: typeof session.role 
    });
    return NextResponse.json({ 
      error: "Forbidden", 
      details: `Role ${session.role} is not allowed. Only PATIENT role can request appointments.` 
    }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const professionalId = typeof body.professionalId === "string" ? body.professionalId : "";
  const locationId = typeof body.locationId === "string" ? body.locationId : "";
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : null;

  // Parse dates: patient sends real UTC (e.g. 17:00 UTC = 14:00 Argentina). Store BA time in MySQL.
  const startAt = typeof body.startAt === "string" ? realUTCToMySQLDate(new Date(body.startAt)) : null;
  const endAt = typeof body.endAt === "string" ? realUTCToMySQLDate(new Date(body.endAt)) : null;

  if (!professionalId || !locationId || !startAt || !endAt) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const patient = await findUserById(session.userId, tenantId);
  if (!patient) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const professional = await findUserById(professionalId, tenantId);
  const professionalProfile = await findProfessionalProfileByUserId(professionalId, tenantId);
  if (!professional || !professionalProfile) {
    return NextResponse.json({ error: "Invalid professional" }, { status: 400 });
  }

  const [googleOAuth, location] = await Promise.all([
    findGoogleOAuthTokenByUserId(professionalId, tenantId),
    findLocationById(locationId, tenantId),
  ]);

  if (!location) return NextResponse.json({ error: "Invalid location" }, { status: 400 });

  // Si el servicio tiene costo, el turno queda pendiente de seña hasta que pague
  let initialStatus = AppointmentStatus.REQUESTED;
  if (serviceId) {
    const service = await findServiceById(serviceId, tenantId);
    if (service && service.price > 0) {
      initialStatus = AppointmentStatus.PENDING_DEPOSIT;
    }
  }

  // Try to create Google Calendar event if OAuth token exists (optional)
  let googleEventId: string | null = null;
  if (googleOAuth && professionalProfile) {
    try {
      const calendarId = professionalProfile.googleCalendarId ?? "primary";
      const event = await createAppointmentEvent({
        accessToken: googleOAuth.accessToken,
        refreshToken: googleOAuth.refreshToken,
        calendarId,
        summary: "Turno",
        description: `Sede: ${location.name}\nPaciente: ${patient.name} (${patient.email})`,
        startAt,
        endAt,
        attendeeEmails: [patient.email, professional.email],
      });
      googleEventId = event.id ?? null;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      // Continue without Google Calendar event - it's optional
    }
  }

  const appointment = await createAppointment({
    id: randomUUID(),
    tenantId,
    patientId: patient.id,
    professionalId: professional.id,
    locationId: location.id,
    serviceId: serviceId ?? null,
    startAt,
    endAt,
    status: initialStatus,
    googleEventId,
    patientFirstName: patient.firstName ?? null,
    patientLastName: patient.lastName ?? null,
  });

  const startFormatted = formatInBuenosAires(mysqlDateToUTC(startAt), "dd/MM/yyyy HH:mm");
  await sendMail({
    to: patient.email,
    subject: "Turno solicitado",
    text: `Tu turno fue solicitado.\n\nSede: ${location.name}\nInicio: ${startFormatted}`,
    html: renderBasicTemplate({
      title: "Turno solicitado",
      preview: "Tu turno fue solicitado.",
      body: `<p>Tu turno fue solicitado.</p>
             <p><strong>Sede:</strong> ${location.name}<br/>
             <strong>Inicio:</strong> ${startFormatted}</p>`,
    }),
  });
  await sendMail({
    to: professional.email,
    subject: "Nuevo turno solicitado",
    text: `Tenés un turno solicitado.\n\nPaciente: ${patient.name} (${patient.email})\nSede: ${location.name}\nInicio: ${startFormatted}`,
    html: renderBasicTemplate({
      title: "Nuevo turno solicitado",
      preview: "Tenes un turno solicitado.",
      body: `<p>Tenes un turno solicitado.</p>
             <p><strong>Paciente:</strong> ${patient.name} (${patient.email})<br/>
             <strong>Sede:</strong> ${location.name}<br/>
             <strong>Inicio:</strong> ${startFormatted}</p>`,
    }),
  });

  return NextResponse.json({ appointmentId: appointment.id, googleEventId: appointment.googleEventId });
}


