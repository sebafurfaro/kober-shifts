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
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const offset = (safePage - 1) * safeLimit;

    const [countRows] = await mysql.execute(
      "SELECT COUNT(*) as total FROM appointment_payments WHERE tenantId = ?",
      [tenantId]
    );
    const total = Number((countRows as { total: number }[])[0]?.total ?? 0);

    const [rows] = await mysql.execute(
      `SELECT id, tenantId, appointmentId, provider, purpose, amount, status, preferenceId, paymentId, createdAt, updatedAt
       FROM appointment_payments
       WHERE tenantId = ?
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [tenantId, safeLimit, offset]
    );

    const payments = (rows as Record<string, unknown>[]).map((row) => ({
      ...row,
      mercadoPago: row.preferenceId
        ? { preferenceId: row.preferenceId, paymentId: row.paymentId }
        : undefined,
    }));

    return NextResponse.json({
      payments,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching payments records:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments records" },
      { status: 500 }
    );
  }
}
