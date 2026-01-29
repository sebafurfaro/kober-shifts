import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUsersByRole, findUserByEmail, createUser, updateUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/lib/types";
import { randomUUID } from "crypto";

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

  const patients = await findUsersByRole(Role.PATIENT, tenantId);
  return NextResponse.json(patients);
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
