import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import mysql from "@/lib/mysql";
import { Role } from "@/lib/types";
import { ensurePaymentsTable } from "@/lib/mercadopago-payments";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    session.role !== Role.ADMIN &&
    session.role !== Role.PROFESSIONAL &&
    session.role !== Role.SUPERVISOR
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await ensurePaymentsTable();
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const offset = (safePage - 1) * safeLimit;

    // Filters
    const search = url.searchParams.get("search") || "";
    const withSenia = url.searchParams.get("withSenia"); // 'true' | 'false' | null
    const order = url.searchParams.get("order") || "date_desc"; // 'price_desc' | 'price_asc' | 'date_desc' | 'date_asc'
    const statusFiltersStr = url.searchParams.get("statusFilters"); // comma separated 'Pendiente,Seña paga,Pagado'
    const dateFilter = url.searchParams.get("date");
    
    // Cobros: servicio con precio > 0; o PENDING_DEPOSIT; o pago MP local aún pendiente (aunque falle join con services).
    // BINARY en joins con mercadopago_payments: evita ER_CANT_AGGREGATE_2COLLATIONS (utf8mb4_0900_ai_ci vs utf8mb4_unicode_ci).
    let baseWhere = `a.tenantId = ? AND (
      (s.id IS NOT NULL AND COALESCE(s.price, 0) > 0)
      OR a.status = 'PENDING_DEPOSIT'
      OR EXISTS (
        SELECT 1 FROM mercadopago_payments mp4
        WHERE BINARY mp4.appointmentId = BINARY a.id AND BINARY mp4.tenantId = BINARY a.tenantId AND mp4.status = 'pending'
      )
    )`;
    const queryParams: unknown[] = [tenantId];

    if (search) {
      baseWhere +=
        " AND (p.name LIKE ? OR a.patientFirstName LIKE ? OR a.patientLastName LIKE ? OR COALESCE(s.name, '') LIKE ?)";
      const searchLike = `%${search}%`;
      queryParams.push(searchLike, searchLike, searchLike, searchLike);
    }

    if (withSenia === "true") {
      baseWhere += " AND COALESCE(s.seniaPercent, 0) > 0";
    } else if (withSenia === "false") {
      baseWhere += " AND COALESCE(s.seniaPercent, 0) = 0";
    }
    
    if (dateFilter) {
      baseWhere += " AND DATE(a.startAt) = ?";
      queryParams.push(dateFilter);
    }

    const computedStatusExpr = `
      CASE 
        WHEN mp.status = 'fully_paid' THEN 'Pagado'
        WHEN mp.status = 'approved' AND COALESCE(s.seniaPercent, 0) > 0 AND COALESCE(s.seniaPercent, 0) < 100 THEN 'Seña paga'
        WHEN mp.status = 'approved' THEN 'Pagado'
        ELSE 'Pendiente'
      END
    `;

    // Wrapping in a subquery to filter by computed status easily, or doing HAVING if it were aggregated.
    // Easier to just repeat the expression in WHERE.
    if (statusFiltersStr) {
      const statuses = statusFiltersStr.split(",").filter(Boolean);
      if (statuses.length > 0) {
        const placeholders = statuses.map(() => "?").join(",");
        baseWhere += ` AND (${computedStatusExpr}) IN (${placeholders})`;
        statuses.forEach((st) => queryParams.push(st));
      }
    }

    let orderClause = "ORDER BY a.startAt DESC";
    if (order === "price_desc") orderClause = "ORDER BY s.price DESC, a.startAt DESC";
    if (order === "price_asc") orderClause = "ORDER BY s.price ASC, a.startAt DESC";
    if (order === "date_asc") orderClause = "ORDER BY a.startAt ASC";

    const countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      LEFT JOIN services s ON a.serviceId = s.id AND a.tenantId = s.tenantId
      LEFT JOIN users p ON a.patientId = p.id AND a.tenantId = p.tenantId
      LEFT JOIN mercadopago_payments mp ON BINARY mp.appointmentId = BINARY a.id AND BINARY mp.tenantId = BINARY a.tenantId
      WHERE ${baseWhere}
    `;

    const [countRows] = await mysql.execute(countQuery, queryParams);
    const total = Number((countRows as { total: number }[])[0]?.total ?? 0);

    const listQuery = `
      SELECT 
          a.id as appointmentId,
          a.startAt as appointmentDate,
          a.status as appointmentStatus,
          COALESCE(s.name, 'Sin servicio') as serviceName,
          COALESCE(s.price, 0) as servicePrice,
          COALESCE(s.seniaPercent, 0) as seniaPercent,
          COALESCE(p.name, CONCAT(a.patientFirstName, ' ', a.patientLastName)) as patientName,
          p.phone as patientPhone,
          p.email as patientEmail,
          mp.id as paymentRecordId,
          mp.amount as mpAmount,
          mp.status as mpStatus,
          mp.updatedAt as mpUpdatedAt,
          (${computedStatusExpr}) as computedPaymentStatus
      FROM appointments a
      LEFT JOIN services s ON a.serviceId = s.id AND a.tenantId = s.tenantId
      LEFT JOIN users p ON a.patientId = p.id AND a.tenantId = p.tenantId
      LEFT JOIN mercadopago_payments mp ON BINARY mp.appointmentId = BINARY a.id AND BINARY mp.tenantId = BINARY a.tenantId
      WHERE ${baseWhere}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await mysql.execute(listQuery, [...queryParams, safeLimit, offset]);

    const payments = (rows as Record<string, unknown>[]).map((row) => ({
      appointmentId: row.appointmentId,
      appointmentDate: row.appointmentDate,
      appointmentStatus: row.appointmentStatus,
      serviceName: row.serviceName,
      servicePrice: Number(row.servicePrice),
      seniaPercent: Number(row.seniaPercent || 0),
      patientName: row.patientName,
      patientPhone: row.patientPhone,
      patientEmail: row.patientEmail,
      paymentRecordId: row.paymentRecordId,
      mpAmount: row.mpAmount ? Number(row.mpAmount) : null,
      mpStatus: row.mpStatus,
      computedPaymentStatus: row.computedPaymentStatus,
      mpUpdatedAt: row.mpUpdatedAt,
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
    const err = error as { message?: string; sqlMessage?: string };
    console.error("Error fetching payments records:", err?.sqlMessage || err?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch payments records" },
      { status: 500 }
    );
  }
}
