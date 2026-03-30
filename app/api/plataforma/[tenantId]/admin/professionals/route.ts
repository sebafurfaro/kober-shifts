import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  findUsersWithProfessionalProfile,
  findUsersWithRoleIn,
  findUserByEmail,
  createUser,
  createProfessionalProfile,
  isStaffEmailConflictError,
  STAFF_EMAIL_ALREADY_EXISTS_MESSAGE,
} from "@/lib/db";
import { getTenantFeatureFlagsAndLimits } from "@/lib/tenant-features";
import { hashPassword, validatePassword } from "@/lib/auth";
import { Role } from "@/lib/types";
import { randomUUID } from "crypto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "SUPERVISOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const withProfile = await findUsersWithProfessionalProfile(tenantId);
  const withProfileIds = new Set(withProfile.map((u) => u.id));
  const allAdminAndPro = await findUsersWithRoleIn([Role.ADMIN, Role.PROFESSIONAL, Role.SUPERVISOR], tenantId);
  const withoutProfile = allAdminAndPro.filter((u) => !withProfileIds.has(u.id));
  const items = [
    ...withProfile,
    ...withoutProfile.map((u) => ({ ...u, professional: null })),
  ];
  items.sort((a, b) => (a.name || "").localeCompare(b.name || "") || a.createdAt.getTime() - b.createdAt.getTime());
  return NextResponse.json(items);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "SUPERVISOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const dni = typeof body.dni === "string" ? body.dni.trim() : null;
  const role: Role =
    body.role === "ADMIN" ? Role.ADMIN
    : body.role === "SUPERVISOR" ? Role.SUPERVISOR
    : Role.PROFESSIONAL;
  const alsoProfessional = body.alsoProfessional === true;
  const color = typeof body.color === "string" ? body.color.trim() : "#2196f3";
  const tempPassword = typeof body.tempPassword === "string" ? body.tempPassword : (dni || "changeme123");
  const licenseNumber = typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : null;
  const medicalCoverages = Array.isArray(body.medicalCoverages) ? body.medicalCoverages : null;
  const availabilityConfig = body.hasOwnProperty('availabilityConfig')
    ? (body.availabilityConfig && typeof body.availabilityConfig === "object" ? (body.availabilityConfig as any) : null)
    : null;
  const availableDays = Array.isArray(body.availableDays) ? body.availableDays.filter((d): d is number => typeof d === "number") : undefined;
  const availableHours = body.availableHours && typeof body.availableHours === "object" && "start" in body.availableHours && "end" in body.availableHours
    ? { start: String(body.availableHours.start), end: String(body.availableHours.end) }
    : undefined;

  if (!name || !email) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Validar contraseña
  const passwordValidation = validatePassword(tempPassword);
  if (!passwordValidation.isValid) {
    return NextResponse.json({ error: `Contraseña inválida: ${passwordValidation.errors.join(", ")}` }, { status: 400 });
  }

  const limits = await getTenantFeatureFlagsAndLimits(tenantId);
  const staffUsers = await findUsersWithRoleIn([Role.ADMIN, Role.PROFESSIONAL, Role.SUPERVISOR], tenantId);
  if (staffUsers.length >= limits.maxUsers) {
    return NextResponse.json(
      { error: `Límite de ${limits.maxUsers} usuario(s) alcanzado. No se pueden agregar más.` },
      { status: 403 }
    );
  }

  const exists = await findUserByEmail(email, tenantId);
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const userId = randomUUID();
  let user;
  try {
    user = await createUser({
      id: userId,
      tenantId,
      name,
      email,
      dni: dni ?? undefined,
      role,
      passwordHash: hashPassword(tempPassword),
    });
  } catch (e) {
    if (isStaffEmailConflictError(e)) {
      return NextResponse.json({ error: STAFF_EMAIL_ALREADY_EXISTS_MESSAGE }, { status: 409 });
    }
    throw e;
  }

  if (role === Role.PROFESSIONAL || (role === Role.ADMIN && alsoProfessional)) {
    await createProfessionalProfile({
      userId,
      tenantId,
      color: color || "#2196f3",
      licenseNumber,
      medicalCoverages,
      availabilityConfig,
      availableDays,
      availableHours,
    });
  }

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}


