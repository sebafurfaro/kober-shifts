import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserByEmail, createUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/lib/types";
import { randomUUID } from "crypto";
import mysql from "@/lib/mysql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const subquery = `
      SELECT patientId,
        COUNT(*) as totalAppointments,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledAppointments
      FROM appointments
      WHERE tenantId = ?
      GROUP BY patientId
    `;
    let rows: any[] = [];
    try {
      const [r] = await mysql.execute(
        `SELECT u.id, u.tenantId, u.email, u.name, u.firstName, u.lastName, u.phone, u.address, u.dni,
          u.coverage, u.plan, u.dateOfBirth, u.admissionDate, u.gender, u.nationality,
          COALESCE(a.totalAppointments, 0) as totalAppointments,
          COALESCE(a.cancelledAppointments, 0) as cancelledAppointments
         FROM users u
         LEFT JOIN (${subquery}) a ON u.id = a.patientId
         WHERE u.role = ? AND u.tenantId = ?`,
        [tenantId, Role.PATIENT, tenantId]
      );
      rows = r as any[];
    } catch (err: any) {
      if (err?.code === "ER_BAD_FIELD_ERROR") {
        const [r] = await mysql.execute(
          `SELECT u.id, u.tenantId, u.email, u.name, u.phone, u.address, u.dni,
            u.coverage, u.plan, u.dateOfBirth, u.admissionDate, u.gender, u.nationality,
            COALESCE(a.totalAppointments, 0) as totalAppointments,
            COALESCE(a.cancelledAppointments, 0) as cancelledAppointments
           FROM users u
           LEFT JOIN (${subquery}) a ON u.id = a.patientId
           WHERE u.role = ? AND u.tenantId = ?`,
          [tenantId, Role.PATIENT, tenantId]
        );
        rows = r as any[];
      } else {
        throw err;
      }
    }

    const patients = rows.map((row: any) => ({
      id: row.id,
      tenantId: row.tenantId,
      email: row.email,
      name: row.name,
      firstName: row.firstName ?? null,
      lastName: row.lastName ?? null,
      phone: row.phone ?? null,
      address: row.address ?? null,
      dni: row.dni ?? null,
      coverage: row.coverage ?? null,
      plan: row.plan ?? null,
      dateOfBirth: row.dateOfBirth ?? null,
      admissionDate: row.admissionDate ?? null,
      gender: row.gender ?? null,
      nationality: row.nationality ?? null,
      totalAppointments: Number(row.totalAppointments ?? 0),
      cancelledAppointments: Number(row.cancelledAppointments ?? 0),
    }));
    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error fetching admin patients:", error);
    return NextResponse.json({ error: "Error al cargar pacientes" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const address = typeof body.address === "string" ? body.address.trim() : null;
  const dni = typeof body.dni === "string" ? body.dni.trim() : null;
  const coverage = typeof body.coverage === "string" ? body.coverage.trim() : null;
  const plan = typeof body.plan === "string" ? body.plan.trim() : null;
  const dateOfBirth = typeof body.dateOfBirth === "string" && body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  const admissionDate = typeof body.admissionDate === "string" && body.admissionDate ? new Date(body.admissionDate) : null;
  const gender = typeof body.gender === "string" ? body.gender : null;
  const nationality = typeof body.nationality === "string" ? body.nationality.trim() : null;
  // La contraseña será el DNI si se proporciona, sino usa el tempPassword o un default
  const tempPassword = typeof body.tempPassword === "string" ? body.tempPassword : (dni || "changeme123");

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Nombre, apellido y email son requeridos" }, { status: 400 });
  }

  const exists = await findUserByEmail(email, tenantId);
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const name = `${firstName} ${lastName}`.trim();
  const userId = randomUUID();
  const user = await createUser({
    id: userId,
    tenantId,
    name,
    firstName,
    lastName,
    email,
    phone,
    address,
    dni,
    coverage,
    plan,
    dateOfBirth,
    admissionDate,
    gender,
    nationality,
    role: Role.PATIENT,
    passwordHash: hashPassword(tempPassword),
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    address: user.address,
    dni: user.dni,
    coverage: user.coverage,
    plan: user.plan,
    dateOfBirth: user.dateOfBirth,
    admissionDate: user.admissionDate,
    gender: user.gender,
    nationality: user.nationality,
  });
}
