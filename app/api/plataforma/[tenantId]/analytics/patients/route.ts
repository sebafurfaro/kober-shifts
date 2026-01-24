import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import mysql from "@/lib/mysql";
import { Role, AppointmentStatus } from "@/lib/types";

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
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const sortBy = url.searchParams.get("sortBy") || "totalAppointments"; // "totalAppointments" or "cancelledAppointments"
    const offset = (page - 1) * limit;

    // Build the query to get patients with appointment counts
    const baseQuery = `
      FROM users u
      LEFT JOIN (
        SELECT 
          patientId,
          COUNT(*) as totalAppointments,
          SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledAppointments
        FROM appointments
        WHERE tenantId = ?
        GROUP BY patientId
      ) a ON u.id = a.patientId
      WHERE u.role = ? AND u.tenantId = ?
    `;

    // Get total count
    const [countRows] = await mysql.execute(
      `SELECT COUNT(*) as total ${baseQuery}`,
      [tenantId, Role.PATIENT, tenantId]
    );
    const total = (countRows as any[])[0]?.total || 0;

    // Determine sort order
    const orderBy = sortBy === "cancelledAppointments" 
      ? "cancelledAppointments DESC, totalAppointments DESC"
      : "totalAppointments DESC, cancelledAppointments DESC";

    // Get paginated patients
    const [patientRows] = await mysql.execute(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.firstName,
        u.lastName,
        COALESCE(a.totalAppointments, 0) as totalAppointments,
        COALESCE(a.cancelledAppointments, 0) as cancelledAppointments
      ${baseQuery}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
      [tenantId, Role.PATIENT, tenantId, limit, offset]
    );

    const patients = (patientRows as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      totalAppointments: Number(row.totalAppointments),
      cancelledAppointments: Number(row.cancelledAppointments),
    }));

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics patients:", error);
    return NextResponse.json(
      { error: "Error al obtener pacientes" },
      { status: 500 }
    );
  }
}
