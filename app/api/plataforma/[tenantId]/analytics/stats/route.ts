import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import mysql from "@/lib/mysql";
import { Role } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Only ADMIN and PROFESSIONAL can access analytics
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get total patients count
    const [patientCountRows] = await mysql.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = ? AND tenantId = ?',
      [Role.PATIENT, tenantId]
    );
    const totalPatients = (patientCountRows as any[])[0]?.count || 0;

    // Get appointments by day (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const [dailyAppointments] = await mysql.execute(
      `SELECT 
        DATE(startAt) as date,
        COUNT(*) as count
      FROM appointments
      WHERE tenantId = ? AND startAt >= ? AND startAt <= ?
      GROUP BY DATE(startAt)
      ORDER BY date ASC`,
      [tenantId, thirtyDaysAgo, todayEnd]
    );

    // Get appointments by week (last 12 weeks)
    const twelveWeeksAgo = new Date(today);
    twelveWeeksAgo.setDate(today.getDate() - (12 * 7));
    twelveWeeksAgo.setHours(0, 0, 0, 0);
    
    const [weeklyAppointments] = await mysql.execute(
      `SELECT 
        YEAR(startAt) as year,
        WEEK(startAt, 1) as week,
        COUNT(*) as count
      FROM appointments
      WHERE tenantId = ? AND startAt >= ? AND startAt <= ?
      GROUP BY YEAR(startAt), WEEK(startAt, 1)
      ORDER BY year ASC, week ASC`,
      [tenantId, twelveWeeksAgo, todayEnd]
    );

    // Get appointments by month (last 12 months)
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    
    const [monthlyAppointments] = await mysql.execute(
      `SELECT 
        YEAR(startAt) as year,
        MONTH(startAt) as month,
        COUNT(*) as count
      FROM appointments
      WHERE tenantId = ? AND startAt >= ? AND startAt <= ?
      GROUP BY YEAR(startAt), MONTH(startAt)
      ORDER BY year ASC, month ASC`,
      [tenantId, twelveMonthsAgo, todayEnd]
    );

    return NextResponse.json({
      totalPatients,
      daily: (dailyAppointments as any[]).map((row: any) => ({
        date: row.date,
        count: Number(row.count),
      })),
      weekly: (weeklyAppointments as any[]).map((row: any) => ({
        year: Number(row.year),
        week: Number(row.week),
        count: Number(row.count),
      })),
      monthly: (monthlyAppointments as any[]).map((row: any) => ({
        year: Number(row.year),
        month: Number(row.month),
        count: Number(row.count),
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
