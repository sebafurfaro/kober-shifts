import { NextResponse } from "next/server";
import { findAppointmentWithRelations, updateAppointmentStatus } from "@/lib/db";
import { getSession } from "@/lib/session";
import { cancelAppointmentEvent, updateAppointmentEventStatus } from "@/lib/googleCalendar";
import { AppointmentStatus } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const nextStatusStr = typeof body.status === "string" ? body.status : "";

  if (!["CONFIRMED", "CANCELLED", "ATTENDED"].includes(nextStatusStr)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const nextStatus: AppointmentStatus =
    nextStatusStr === "CONFIRMED" ? AppointmentStatus.CONFIRMED
    : nextStatusStr === "CANCELLED" ? AppointmentStatus.CANCELLED
    : AppointmentStatus.ATTENDED;

  const data = await findAppointmentWithRelations(id, tenantId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { appointment, professional } = data;
  if (appointment.professionalId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!professional.googleOAuth) {
    return NextResponse.json({ error: "Professional has not linked Google yet" }, { status: 409 });
  }

  const calendarId = professional.professional?.googleCalendarId ?? "primary";

  if (appointment.googleEventId) {
    if (nextStatus === AppointmentStatus.CANCELLED) {
      await cancelAppointmentEvent({
        accessToken: professional.googleOAuth.accessToken,
        refreshToken: professional.googleOAuth.refreshToken,
        calendarId,
        eventId: appointment.googleEventId,
      });
    } else {
      const suffix = nextStatus === AppointmentStatus.ATTENDED ? " (Atendido)" : " (Confirmado)";
      await updateAppointmentEventStatus({
        accessToken: professional.googleOAuth.accessToken,
        refreshToken: professional.googleOAuth.refreshToken,
        calendarId,
        eventId: appointment.googleEventId,
        summary: `Turno${suffix}`,
        description: `Sede: ${data.location.name}\nPaciente: ${data.patient.name} (${data.patient.email})`,
      });
    }
  }

  const updated = await updateAppointmentStatus(id, tenantId, nextStatus);

  return NextResponse.json({ id: updated.id, status: updated.status });
}


