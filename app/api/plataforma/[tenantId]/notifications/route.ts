import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import mysql from "@/lib/mysql";
import { Role } from "@/lib/types";

async function ensurePaymentsTable() {
  await mysql.execute(`
    CREATE TABLE IF NOT EXISTS appointment_payments (
      id VARCHAR(36) PRIMARY KEY,
      tenantId VARCHAR(255) NOT NULL,
      appointmentId VARCHAR(255) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      purpose VARCHAR(20) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      status VARCHAR(30) NOT NULL,
      preferenceId VARCHAR(255),
      paymentId VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_appt_payments_tenant (tenantId),
      INDEX idx_appt_payments_appointment (appointmentId),
      INDEX idx_appt_payments_preference (preferenceId)
    )
  `);
}

function safeDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

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

  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const sinceDate = safeDate(sinceParam) ?? new Date(Date.now() - 5 * 60 * 1000);
  const nowIso = new Date().toISOString();

  try {
    const [appointmentRows] = await mysql.execute(
      `SELECT a.id, a.startAt, a.updatedAt, u.name as patientName
       FROM appointments a
       LEFT JOIN users u ON a.patientId = u.id AND a.tenantId = u.tenantId
       WHERE a.tenantId = ? AND a.status = 'CONFIRMED' AND a.updatedAt >= ?
       ORDER BY a.updatedAt DESC
       LIMIT 10`,
      [tenantId, sinceDate]
    );

    await ensurePaymentsTable();
    const [paymentRows] = await mysql.execute(
      `SELECT id, appointmentId, amount, updatedAt
       FROM appointment_payments
       WHERE tenantId = ? AND status = 'approved' AND updatedAt >= ?
       ORDER BY updatedAt DESC
       LIMIT 10`,
      [tenantId, sinceDate]
    );

    const appointmentItems = (appointmentRows as any[]).map((row) => ({
      id: `apt_${row.id}`,
      message: `Turno confirmado: ${row.patientName || "Paciente"} (${new Date(row.startAt).toLocaleString("es-AR")})`,
      createdAt: row.updatedAt,
    }));
    const paymentItems = (paymentRows as any[]).map((row) => ({
      id: `pay_${row.id}`,
      message: `Pago ingresado: $${Number(row.amount).toFixed(2)}`,
      createdAt: row.updatedAt,
    }));

    const items = [...appointmentItems, ...paymentItems].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return db - da;
    });

    return NextResponse.json({ items, now: nowIso });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ items: [], now: nowIso });
  }
}

