import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUsersWithProfessionalProfile, findUserByEmail, createUser, createProfessionalProfile } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/lib/types";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await findUsersWithProfessionalProfile();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const specialtyId = typeof body.specialtyId === "string" ? body.specialtyId : "";
  const specialtyIds = Array.isArray(body.specialtyIds) ? body.specialtyIds.filter((id): id is string => typeof id === "string") : (specialtyId ? [specialtyId] : []);
  const color = typeof body.color === "string" ? body.color.trim() : "#2196f3";
  const tempPassword = typeof body.tempPassword === "string" ? body.tempPassword : "changeme123";
  const licenseNumber = typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : null;
  const medicalCoverages = Array.isArray(body.medicalCoverages) ? body.medicalCoverages : null;
  const availabilityConfig = body.availabilityConfig && typeof body.availabilityConfig === "object" ? (body.availabilityConfig as any) : null;

  const availableDays = Array.isArray(body.availableDays) ? body.availableDays.filter((d): d is number => typeof d === "number") : undefined;
  const availableHours = body.availableHours && typeof body.availableHours === "object" && "start" in body.availableHours && "end" in body.availableHours
    ? { start: String(body.availableHours.start), end: String(body.availableHours.end) }
    : undefined;

  if (!name || !email || specialtyIds.length === 0) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const exists = await findUserByEmail(email);
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const userId = randomUUID();
  const user = await createUser({
    id: userId,
    name,
    email,
    role: Role.PROFESSIONAL,
    passwordHash: hashPassword(tempPassword),
  });

  await createProfessionalProfile({
    userId,
    specialtyId: specialtyIds[0] || "",
    specialtyIds,
    color: color || "#2196f3",
    licenseNumber,
    medicalCoverages,
    availabilityConfig,
    availableDays,
    availableHours,
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}


