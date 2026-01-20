import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUsersWithProfessionalProfile, findUserByEmail, createUser, createProfessionalProfile } from "@/lib/db";
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
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await findUsersWithProfessionalProfile(tenantId);
  return NextResponse.json(items);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  // Handle availabilityConfig - include it if present, even if empty/null
  const availabilityConfig = body.hasOwnProperty('availabilityConfig')
    ? (body.availabilityConfig && typeof body.availabilityConfig === "object" ? (body.availabilityConfig as any) : null)
    : null;
  
  console.log("POST /admin/professionals - availabilityConfig received:", {
    hasAvailabilityConfig: body.hasOwnProperty('availabilityConfig'),
    availabilityConfig,
  });

  const availableDays = Array.isArray(body.availableDays) ? body.availableDays.filter((d): d is number => typeof d === "number") : undefined;
  const availableHours = body.availableHours && typeof body.availableHours === "object" && "start" in body.availableHours && "end" in body.availableHours
    ? { start: String(body.availableHours.start), end: String(body.availableHours.end) }
    : undefined;

  if (!name || !email || specialtyIds.length === 0) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const exists = await findUserByEmail(email, tenantId);
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const userId = randomUUID();
  const user = await createUser({
    id: userId,
    tenantId,
    name,
    email,
    role: Role.PROFESSIONAL,
    passwordHash: hashPassword(tempPassword),
  });

  await createProfessionalProfile({
    userId,
    tenantId,
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


