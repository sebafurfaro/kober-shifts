import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserById, updateUser, findUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { Role, Gender } from "@/lib/types";
import type { User } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await findUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  
  const user = await findUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "User is not a patient" }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const address = typeof body.address === "string" ? body.address.trim() : null;
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
  const updateData: Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'phone' | 'address' | 'dateOfBirth' | 'admissionDate' | 'gender' | 'nationality' | 'passwordHash'>> = {
    name,
    firstName,
    lastName,
    phone,
    address,
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

  const updatedUser = await updateUser(id, updateData as Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'phone' | 'address' | 'dateOfBirth' | 'admissionDate' | 'gender' | 'nationality' | 'passwordHash'>>);
  return NextResponse.json({
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    phone: updatedUser.phone,
    address: updatedUser.address,
    dateOfBirth: updatedUser.dateOfBirth,
    admissionDate: updatedUser.admissionDate,
    gender: updatedUser.gender,
    nationality: updatedUser.nationality,
  });
}

