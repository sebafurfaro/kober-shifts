import { NextResponse } from "next/server";
import { findUserById, findLocationById, findSpecialtyById, findProfessionalProfileByUserId, findGoogleOAuthTokenByUserId, createAppointment } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createAppointmentEvent } from "@/lib/googleCalendar";
import { sendMail } from "@/lib/email";
import { AppointmentStatus, Role } from "@/lib/types";
import { randomUUID } from "crypto";
import { utcToMySQLDate } from "@/lib/timezone";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const professionalId = typeof body.professionalId === "string" ? body.professionalId : "";
  const locationId = typeof body.locationId === "string" ? body.locationId : "";
  const specialtyId = typeof body.specialtyId === "string" ? body.specialtyId : "";
  
  // Parse dates from ISO string and convert to MySQL format
  // Use centralized timezone utilities for consistent conversion
  const startAt = typeof body.startAt === "string" ? utcToMySQLDate(new Date(body.startAt)) : null;
  const endAt = typeof body.endAt === "string" ? utcToMySQLDate(new Date(body.endAt)) : null;

  if (!professionalId || !locationId || !specialtyId || !startAt || !endAt) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const patient = await findUserById(session.userId);
  if (!patient) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const professional = await findUserById(professionalId);
  if (!professional || professional.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Invalid professional" }, { status: 400 });
  }

  const [professionalProfile, googleOAuth, location, specialty] = await Promise.all([
    findProfessionalProfileByUserId(professionalId),
    findGoogleOAuthTokenByUserId(professionalId),
    findLocationById(locationId),
    findSpecialtyById(specialtyId),
  ]);

  if (!googleOAuth) {
    return NextResponse.json(
      { error: "Professional has not linked Google Calendar yet" },
      { status: 409 },
    );
  }
  if (!location || !specialty) return NextResponse.json({ error: "Invalid location/specialty" }, { status: 400 });

  const calendarId = professionalProfile?.googleCalendarId ?? "primary";

  const event = await createAppointmentEvent({
    accessToken: googleOAuth.accessToken,
    refreshToken: googleOAuth.refreshToken,
    calendarId,
    summary: `Turno - ${specialty.name}`,
    description: `Sede: ${location.name}\nPaciente: ${patient.name} (${patient.email})`,
    startAt,
    endAt,
    attendeeEmails: [patient.email, professional.email],
  });

  const appointment = await createAppointment({
    id: randomUUID(),
    patientId: patient.id,
    professionalId: professional.id,
    locationId: location.id,
    specialtyId: specialty.id,
    startAt,
    endAt,
    status: AppointmentStatus.REQUESTED,
    googleEventId: event.id ?? null,
  });

  await sendMail({
    to: patient.email,
    subject: "Turno solicitado",
    text: `Tu turno fue solicitado.\n\nEspecialidad: ${specialty.name}\nSede: ${location.name}\nInicio: ${startAt.toISOString()}`,
  });
  await sendMail({
    to: professional.email,
    subject: "Nuevo turno solicitado",
    text: `Tenés un turno solicitado.\n\nPaciente: ${patient.name} (${patient.email})\nEspecialidad: ${specialty.name}\nSede: ${location.name}\nInicio: ${startAt.toISOString()}`,
  });

  return NextResponse.json({ appointmentId: appointment.id, googleEventId: appointment.googleEventId });
}


