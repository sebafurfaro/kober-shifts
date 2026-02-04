import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserById, updateUser, deleteUser, deleteAppointmentsByPatient } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { Role, Gender } from "@/lib/types";
import type { User } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const canAccess =
    session.role === Role.ADMIN ||
    session.role === Role.PROFESSIONAL ||
    (session.role === Role.PATIENT && session.userId === id);
  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await findUserById(id, tenantId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (session.role === Role.PATIENT && user.role !== Role.PATIENT)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(user);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const canEdit =
    session.role === Role.ADMIN ||
    session.role === Role.PROFESSIONAL ||
    (session.role === Role.PATIENT && session.userId === id);
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const user = await findUserById(id, tenantId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "El usuario no es un paciente" }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const address = typeof body.address === "string" ? body.address.trim() : null;
  const dni = typeof body.dni === "string" ? body.dni.trim() : null;
  const coverage = typeof body.coverage === "string" ? body.coverage.trim() : null;
  const plan = typeof body.plan === "string" ? body.plan.trim() : null;
  const dateOfBirth = typeof body.dateOfBirth === "string" && body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  const admissionDate = typeof body.admissionDate === "string" && body.admissionDate ? new Date(body.admissionDate) : null;
  const genderString = typeof body.gender === "string" ? body.gender : null;
  let gender: Gender | null = null;
  if (genderString) {
    if (genderString === Gender.MASCULINO) {
      gender = Gender.MASCULINO;
    } else if (genderString === Gender.FEMENINO) {
      gender = Gender.FEMENINO;
    } else if (genderString === Gender.NO_BINARIO) {
      gender = Gender.NO_BINARIO;
    }
  }
  const nationality = typeof body.nationality === "string" ? body.nationality.trim() : null;
  const tempPassword = typeof body.tempPassword === "string" ? body.tempPassword : "";

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Nombre y apellido son requeridos" }, { status: 400 });
  }

  const name = `${firstName} ${lastName}`.trim();
  const updateData: Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'phone' | 'address' | 'dni' | 'coverage' | 'plan' | 'dateOfBirth' | 'admissionDate' | 'gender' | 'nationality' | 'passwordHash'>> = {
    name,
    firstName,
    lastName,
    phone,
    address,
    dni,
    coverage,
    plan,
    dateOfBirth,
    admissionDate,
    gender,
    nationality,
  };

  // Only update password if provided
  if (tempPassword) {
    if (tempPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    updateData.passwordHash = hashPassword(tempPassword);
  }

  const updatedUser = await updateUser(id, tenantId, updateData as Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'phone' | 'address' | 'dni' | 'coverage' | 'plan' | 'dateOfBirth' | 'admissionDate' | 'gender' | 'nationality' | 'passwordHash'>>);
  return NextResponse.json({
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    phone: updatedUser.phone,
    address: updatedUser.address,
    dni: updatedUser.dni,
    coverage: updatedUser.coverage,
    plan: updatedUser.plan,
    dateOfBirth: updatedUser.dateOfBirth,
    admissionDate: updatedUser.admissionDate,
    gender: updatedUser.gender,
    nationality: updatedUser.nationality,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await findUserById(id, tenantId);
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (user.role !== Role.PATIENT)
    return NextResponse.json({ error: "El usuario no es un paciente" }, { status: 400 });

  try {
    await deleteAppointmentsByPatient(id, tenantId);
    await deleteUser(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting patient:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

