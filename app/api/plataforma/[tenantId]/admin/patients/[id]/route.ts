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

  // Actualización parcial: solo se sobrescribe un campo si viene en el body.
  // Así los guardados desde la ficha (notas, archivos, etc.) no borran teléfono, dirección, etc.
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : (user.firstName ?? "");
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : (user.lastName ?? "");
  const phone =
    "phone" in body
      ? typeof body.phone === "string"
        ? body.phone.trim() || null
        : null
      : user.phone ?? null;
  const address =
    "address" in body
      ? typeof body.address === "string"
        ? body.address.trim() || null
        : null
      : user.address ?? null;
  const dni =
    "dni" in body
      ? typeof body.dni === "string"
        ? body.dni.trim() || null
        : null
      : user.dni ?? null;
  const coverage =
    "coverage" in body
      ? typeof body.coverage === "string"
        ? body.coverage.trim() || null
        : null
      : user.coverage ?? null;
  const plan =
    "plan" in body
      ? typeof body.plan === "string"
        ? body.plan.trim() || null
        : null
      : user.plan ?? null;
  const dateOfBirth =
    "dateOfBirth" in body
      ? typeof body.dateOfBirth === "string" && body.dateOfBirth
        ? new Date(body.dateOfBirth)
        : null
      : user.dateOfBirth ?? null;
  const admissionDate =
    "admissionDate" in body
      ? typeof body.admissionDate === "string" && body.admissionDate
        ? new Date(body.admissionDate)
        : null
      : user.admissionDate ?? null;
  const genderString = "gender" in body ? (typeof body.gender === "string" ? body.gender : null) : user.gender;
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
  const nationality =
    "nationality" in body
      ? typeof body.nationality === "string"
        ? body.nationality.trim() || null
        : null
      : user.nationality ?? null;
  const tempPassword = typeof body.tempPassword === "string" ? body.tempPassword : "";

  const additionalInfo = Array.isArray(body.additionalInfo) ? body.additionalInfo as User['additionalInfo'] : undefined;
  const archives = Array.isArray(body.archives) ? body.archives as User['archives'] : undefined;
  const notes = Array.isArray(body.notes) ? body.notes as User['notes'] : undefined;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Nombre y apellido son requeridos" }, { status: 400 });
  }

  const name = `${firstName} ${lastName}`.trim();
  const updateData: Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'phone' | 'address' | 'dni' | 'coverage' | 'plan' | 'dateOfBirth' | 'admissionDate' | 'gender' | 'nationality' | 'passwordHash' | 'additionalInfo' | 'archives' | 'notes'>> = {
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
  if (additionalInfo !== undefined) updateData.additionalInfo = additionalInfo;
  if (archives !== undefined) updateData.archives = archives;
  if (notes !== undefined) updateData.notes = notes;

  // Only update password if provided
  if (tempPassword) {
    if (tempPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    updateData.passwordHash = hashPassword(tempPassword);
  }

  const updatedUser = await updateUser(id, tenantId, updateData);
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
    additionalInfo: updatedUser.additionalInfo ?? [],
    archives: updatedUser.archives ?? [],
    notes: updatedUser.notes ?? [],
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

