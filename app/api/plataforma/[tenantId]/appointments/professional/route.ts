import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAppointmentsByDateRange } from "@/lib/db";
import { mysqlDateToUTC } from "@/lib/timezone";
import { Role } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.PROFESSIONAL && session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const professionalId = url.searchParams.get("professionalId") || (session.role === Role.PROFESSIONAL ? session.userId : null);

  if (!professionalId) {
    return NextResponse.json({ error: "professionalId is required" }, { status: 400 });
  }

  // Get today's date and future appointments
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  // Get today's appointments
  const todayAppointments = await findAppointmentsByDateRange(tenantId, todayStart, todayEnd, {
    professionalId,
  });

  // Get future appointments (excluding today)
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const futureAppointments = await findAppointmentsByDateRange(tenantId, tomorrowStart, futureDate, {
    professionalId,
  });

  // Format response: convert MySQL BA time to real UTC ISO so client displays correctly
  const formatAppointment = (apt: any) => {
    const startDate = apt.startAt instanceof Date ? apt.startAt : new Date(apt.startAt);
    const endDate = apt.endAt instanceof Date ? apt.endAt : new Date(apt.endAt);
    return {
      id: apt.id,
      patientName: apt.patient.name,
      patientEmail: apt.patient.email,
      locationName: apt.location.name,
      startAt: mysqlDateToUTC(startDate).toISOString(),
      endAt: mysqlDateToUTC(endDate).toISOString(),
      status: apt.status,
      cancellationReason: apt.cancellationReason,
      cancelledBy: apt.cancelledBy,
      notes: apt.notes,
    };
  };

  return NextResponse.json({
    today: todayAppointments.map(formatAppointment),
    upcoming: futureAppointments.map(formatAppointment),
  });
}

