import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAppointmentById, updateAppointment } from "@/lib/db";
import { AppointmentStatus, Role } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  const appointment = await findAppointmentById(id, tenantId);
  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  // Check permissions
  if (session.role === Role.PATIENT) {
    if (appointment.patientId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Patient must provide reason with at least 100 characters
    if (!reason || reason.length < 100) {
      return NextResponse.json(
        { error: "El motivo de cancelación debe tener al menos 100 caracteres" },
        { status: 400 }
      );
    }
  } else if (session.role === Role.PROFESSIONAL) {
    if (appointment.professionalId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Professional can cancel without reason, but if provided it's optional
  } else if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update appointment
  await updateAppointment({
    id,
    tenantId,
    status: AppointmentStatus.CANCELLED,
    cancellationReason: reason || null,
    cancelledBy: session.role,
  });

  return NextResponse.json({ success: true });
}

