import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAppointmentsByDateRange } from "@/lib/db";
import { Role } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.PATIENT && session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientId") || (session.role === Role.PATIENT ? session.userId : null);

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  // Get all appointments for the patient (past and future, excluding cancelled)
  // Use a date far in the past to get all appointments
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1); // Get appointments from the past year
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // Get appointments for the next year

  const appointments = await findAppointmentsByDateRange(tenantId, pastDate, futureDate, {
    patientId,
  });

  // Format response
  const formatted = appointments.map((apt) => ({
    id: apt.id,
    professionalName: apt.professional.name,
    locationName: apt.location.name,
    specialtyName: apt.specialty.name,
    startAt: apt.startAt,
    endAt: apt.endAt,
    status: apt.status,
    cancellationReason: apt.cancellationReason,
    cancelledBy: apt.cancelledBy,
    notes: apt.notes,
  }));

  return NextResponse.json(formatted);
}

