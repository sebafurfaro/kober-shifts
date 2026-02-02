import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAppointmentById, updateAppointment, findAppointmentWithRelations, deleteAppointment } from "@/lib/db";
import { AppointmentStatus, Role } from "@/lib/types";
import { utcToMySQLDate } from "@/lib/timezone";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const appointment = await findAppointmentById(id, tenantId);
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check permissions
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && appointment.patientId !== session.userId && appointment.professionalId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse dates from ISO string and convert to MySQL format
  let startAt: Date | undefined = undefined;
  let endAt: Date | undefined = undefined;

  if (typeof body.startAt === "string") {
    const utcDate = new Date(body.startAt);
    startAt = utcToMySQLDate(utcDate);
  }

  if (typeof body.endAt === "string") {
    const utcDate = new Date(body.endAt);
    endAt = utcToMySQLDate(utcDate);
  }
  const status = typeof body.status === "string" ? (body.status as AppointmentStatus) : undefined;
  const notes = typeof body.notes === "string" ? body.notes : body.notes === null ? null : undefined;
  const patientId = typeof body.patientId === "string" ? body.patientId : undefined;
  const professionalId = typeof body.professionalId === "string" ? body.professionalId : undefined;
  const locationId = typeof body.locationId === "string" ? body.locationId : undefined;
  const specialtyId = typeof body.specialtyId === "string" ? body.specialtyId : undefined;

  const updated = await updateAppointment({
    id,
    tenantId,
    ...(startAt && { startAt }),
    ...(endAt && { endAt }),
    ...(status && { status }),
    ...(notes !== undefined && { notes }),
    ...(patientId && { patientId }),
    ...(professionalId && { professionalId }),
    ...(locationId && { locationId }),
    ...(specialtyId && { specialtyId }),
  });

  return NextResponse.json(updated);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await findAppointmentWithRelations(id, tenantId);

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check permissions
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && data.appointment.patientId !== session.userId && data.appointment.professionalId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const appointment = await findAppointmentById(id, tenantId);
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteAppointment(id, tenantId);
  return NextResponse.json({ success: true });
}

