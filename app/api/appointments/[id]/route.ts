import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAppointmentById, updateAppointment, findAppointmentWithRelations, deleteAppointment } from "@/lib/db";
import { AppointmentStatus, Role } from "@/lib/types";
import { utcToMySQLDate } from "@/lib/timezone";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const appointment = await findAppointmentById(id);
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check permissions
  if (session.role !== "ADMIN" && appointment.patientId !== session.userId && appointment.professionalId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse dates from ISO string and convert to MySQL format
  // Use centralized timezone utilities for consistent conversion
  let startAt: Date | undefined = undefined;
  let endAt: Date | undefined = undefined;
  
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
  const status = typeof body.status === "string" ? (body.status as AppointmentStatus) : undefined;
  const notes = typeof body.notes === "string" ? body.notes : body.notes === null ? null : undefined;
  const patientId = typeof body.patientId === "string" ? body.patientId : undefined;
  const professionalId = typeof body.professionalId === "string" ? body.professionalId : undefined;
  const locationId = typeof body.locationId === "string" ? body.locationId : undefined;
  const specialtyId = typeof body.specialtyId === "string" ? body.specialtyId : undefined;

  const updated = await updateAppointment({
    id,
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

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const data = await findAppointmentWithRelations(id);
  
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check permissions
  if (session.role !== "ADMIN" && data.appointment.patientId !== session.userId && data.appointment.professionalId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const appointment = await findAppointmentById(id);
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteAppointment(id);
  return NextResponse.json({ success: true });
}

