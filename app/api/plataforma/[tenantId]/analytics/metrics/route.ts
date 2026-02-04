import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import mysql from "@/lib/mysql";
import { Role } from "@/lib/types";
import { getMongoClientPromise } from "@/lib/mongo";

/**
 * GET /api/plataforma/[tenantId]/analytics/metrics
 * Devuelve métricas del mes actual y del año actual (ingresos, turnos, clientes, cancelaciones)
 * para que cada box pueda mostrar Mes o Año de forma independiente.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();

  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  try {
    // --- Ingresos (mes y año) ---
    let revenueMonth = 0;
    let revenueYear = 0;
    let revenueByMonth: Array<{ year: number; month: number; total: number }> = [];
    try {
      const [sumMonthRows] = await mysql.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM appointment_payments
         WHERE tenantId = ? AND status = 'approved' AND createdAt >= ? AND createdAt <= ?`,
        [tenantId, monthStart, monthEnd]
      );
      revenueMonth = Number((sumMonthRows as any[])[0]?.total ?? 0);
      const [sumYearRows] = await mysql.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM appointment_payments
         WHERE tenantId = ? AND status = 'approved' AND createdAt >= ? AND createdAt <= ?`,
        [tenantId, yearStart, yearEnd]
      );
      revenueYear = Number((sumYearRows as any[])[0]?.total ?? 0);
      const [byMonthRows] = await mysql.execute(
        `SELECT YEAR(createdAt) as y, MONTH(createdAt) as m, COALESCE(SUM(amount), 0) as total
         FROM appointment_payments
         WHERE tenantId = ? AND status = 'approved' AND YEAR(createdAt) = ?
         GROUP BY YEAR(createdAt), MONTH(createdAt) ORDER BY m ASC`,
        [tenantId, year]
      );
      revenueByMonth = (byMonthRows as any[]).map((r: any) => ({
        year: Number(r.y),
        month: Number(r.m),
        total: Number(r.total),
      }));
    } catch {
      // Tabla appointment_payments puede no existir
    }

    // --- Turnos (mes y año) ---
    const [appointmentsMonthRows] = await mysql.execute(
      `SELECT COUNT(*) as total FROM appointments WHERE tenantId = ? AND startAt >= ? AND startAt <= ?`,
      [tenantId, monthStart, monthEnd]
    );
    const appointmentsMonth = Number((appointmentsMonthRows as any[])[0]?.total ?? 0);
    const [appointmentsYearRows] = await mysql.execute(
      `SELECT COUNT(*) as total FROM appointments WHERE tenantId = ? AND startAt >= ? AND startAt <= ?`,
      [tenantId, yearStart, yearEnd]
    );
    const appointmentsYear = Number((appointmentsYearRows as any[])[0]?.total ?? 0);
    const [appointmentsByMonthRows] = await mysql.execute(
      `SELECT YEAR(startAt) as y, MONTH(startAt) as m, COUNT(*) as total
       FROM appointments WHERE tenantId = ? AND YEAR(startAt) = ?
       GROUP BY YEAR(startAt), MONTH(startAt) ORDER BY m ASC`,
      [tenantId, year]
    );
    const appointmentsByMonth = (appointmentsByMonthRows as any[]).map((r: any) => ({
      year: Number(r.y),
      month: Number(r.m),
      count: Number(r.total),
    }));

    // --- Clientes registrados (mes y año) ---
    const [patientsMonthRows] = await mysql.execute(
      `SELECT COUNT(*) as total FROM users WHERE role = ? AND tenantId = ? AND createdAt >= ? AND createdAt <= ?`,
      [Role.PATIENT, tenantId, monthStart, monthEnd]
    );
    const patientsMonth = Number((patientsMonthRows as any[])[0]?.total ?? 0);
    const [patientsYearRows] = await mysql.execute(
      `SELECT COUNT(*) as total FROM users WHERE role = ? AND tenantId = ? AND createdAt >= ? AND createdAt <= ?`,
      [Role.PATIENT, tenantId, yearStart, yearEnd]
    );
    const patientsYear = Number((patientsYearRows as any[])[0]?.total ?? 0);
    const [patientsByMonthRows] = await mysql.execute(
      `SELECT YEAR(createdAt) as y, MONTH(createdAt) as m, COUNT(*) as total
       FROM users WHERE role = ? AND tenantId = ? AND YEAR(createdAt) = ?
       GROUP BY YEAR(createdAt), MONTH(createdAt) ORDER BY m ASC`,
      [Role.PATIENT, tenantId, year]
    );
    const patientsByMonth = (patientsByMonthRows as any[]).map((r: any) => ({
      year: Number(r.y),
      month: Number(r.m),
      count: Number(r.total),
    }));

    // --- Cancelaciones (mes y año) ---
    const [cancellationsMonthRows] = await mysql.execute(
      `SELECT COUNT(*) as total FROM appointments WHERE tenantId = ? AND status = 'CANCELLED' AND startAt >= ? AND startAt <= ?`,
      [tenantId, monthStart, monthEnd]
    );
    const cancellationsMonth = Number((cancellationsMonthRows as any[])[0]?.total ?? 0);
    const [cancellationsYearRows] = await mysql.execute(
      `SELECT COUNT(*) as total FROM appointments WHERE tenantId = ? AND status = 'CANCELLED' AND startAt >= ? AND startAt <= ?`,
      [tenantId, yearStart, yearEnd]
    );
    const cancellationsYear = Number((cancellationsYearRows as any[])[0]?.total ?? 0);
    const [cancellationsByMonthRows] = await mysql.execute(
      `SELECT YEAR(startAt) as y, MONTH(startAt) as m, COUNT(*) as total
       FROM appointments WHERE tenantId = ? AND status = 'CANCELLED' AND YEAR(startAt) = ?
       GROUP BY YEAR(startAt), MONTH(startAt) ORDER BY m ASC`,
      [tenantId, year]
    );
    const cancellationsByMonth = (cancellationsByMonthRows as any[]).map((r: any) => ({
      year: Number(r.y),
      month: Number(r.m),
      count: Number(r.total),
    }));

    // --- Recordatorios WhatsApp (asignados vs usados hasta el momento) ---
    let remindersAssigned = 0;
    let remindersUsed = 0;
    try {
      const client = await getMongoClientPromise();
      const db = client.db("kober_shifts");
      const doc = await db.collection("tenant_features").findOne({ tenantId });
      const limits = doc?.limits && typeof doc.limits === "object" ? doc.limits : {};
      remindersAssigned =
        typeof (limits as { whatsappRemindersLimit?: number }).whatsappRemindersLimit === "number" &&
        (limits as { whatsappRemindersLimit: number }).whatsappRemindersLimit >= 0
          ? (limits as { whatsappRemindersLimit: number }).whatsappRemindersLimit
          : 0;
      const usage = doc?.usage && typeof doc.usage === "object" ? doc.usage : {};
      remindersUsed =
        typeof (usage as { remindersUsed?: number }).remindersUsed === "number" &&
        (usage as { remindersUsed: number }).remindersUsed >= 0
          ? (usage as { remindersUsed: number }).remindersUsed
          : 0;
    } catch {
      // Ignore Mongo errors
    }

    return NextResponse.json({
      year,
      month,
      revenue: {
        totalMonth: revenueMonth,
        totalYear: revenueYear,
        byMonth: revenueByMonth,
      },
      appointments: {
        totalMonth: appointmentsMonth,
        totalYear: appointmentsYear,
        byMonth: appointmentsByMonth,
      },
      patients: {
        totalMonth: patientsMonth,
        totalYear: patientsYear,
        byMonth: patientsByMonth,
      },
      cancellations: {
        totalMonth: cancellationsMonth,
        totalYear: cancellationsYear,
        byMonth: cancellationsByMonth,
      },
      reminders: {
        assigned: remindersAssigned,
        used: remindersUsed,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics metrics:", error);
    return NextResponse.json(
      { error: "Error al obtener métricas" },
      { status: 500 }
    );
  }
}
