import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  findUserById,
  findProfessionalProfileByUserId,
  updateUser,
  updateProfessionalProfile,
  findUserByEmail,
  deleteUser,
  deleteAppointmentsByProfessional,
} from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "SUPERVISOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await findUserById(id, tenantId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const profile = await findProfessionalProfileByUserId(id, tenantId);
  const basePayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    dni: user.dni ?? undefined,
    role: user.role,
  };
  if (!profile) return NextResponse.json(basePayload);

  return NextResponse.json({
    ...basePayload,
    color: profile.color,
    licenseNumber: profile.licenseNumber,
    medicalCoverages: profile.medicalCoverages,
    availabilityConfig: profile.availabilityConfig,
    holidays: profile.availabilityConfig?.holidays || [],
    availableDays: profile.availableDays,
    availableHours: profile.availableHours,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "SUPERVISOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Debug: Log availabilityConfig
    console.log("PUT /admin/professionals/[id] - availabilityConfig received:", {
      hasAvailabilityConfig: body.hasOwnProperty('availabilityConfig'),
      availabilityConfig: body.availabilityConfig,
      availabilityConfigType: typeof body.availabilityConfig,
    });

    try {
    const user = await findUserById(id, tenantId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const dni = body.hasOwnProperty("dni") ? (typeof body.dni === "string" ? body.dni.trim() || null : null) : undefined;
    const role = body.role === "ADMIN" || body.role === "PROFESSIONAL" || body.role === "SUPERVISOR" ? body.role : undefined;
    const color = typeof body.color === "string" ? body.color.trim() : "#2196f3";
    const tempPassword = typeof body.tempPassword === "string" ? body.tempPassword : "";
    const licenseNumber = typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : null;
    const medicalCoverages = Array.isArray(body.medicalCoverages) ? body.medicalCoverages : null;
    
    // Handle availabilityConfig - always include it if present in body, even if empty/null
    // This ensures we can clear availability by sending null
    // Also merge holidays if provided separately
    let availabilityConfig = body.hasOwnProperty('availabilityConfig')
      ? (body.availabilityConfig && typeof body.availabilityConfig === "object" ? body.availabilityConfig : null)
      : undefined;
    
    // If holidays are provided separately, merge them into availabilityConfig
    if (body.hasOwnProperty('holidays') && Array.isArray(body.holidays)) {
      if (!availabilityConfig || typeof availabilityConfig !== 'object') {
        availabilityConfig = { days: {}, holidays: [] };
      }
      // Ensure holidays property exists
      if (!('holidays' in availabilityConfig)) {
        (availabilityConfig as any).holidays = [];
      }
      (availabilityConfig as any).holidays = body.holidays;
    }

    const availableDays = Array.isArray(body.availableDays) ? body.availableDays.filter((d): d is number => typeof d === "number") : undefined;
    const availableHours = body.availableHours && typeof body.availableHours === "object" && "start" in body.availableHours && "end" in body.availableHours
      ? { start: String(body.availableHours.start), end: String(body.availableHours.end) }
      : undefined;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const profile = await findProfessionalProfileByUserId(id, tenantId);

    const updateData: { name: string; email?: string; dni?: string | null; role?: string; passwordHash?: string } = { name };
    if (email !== undefined) updateData.email = email;
    if (dni !== undefined) updateData.dni = dni;
    if (role !== undefined) updateData.role = role;
    if (tempPassword) {
      if (tempPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      updateData.passwordHash = hashPassword(tempPassword);
    }
    if (email !== undefined) {
      const existing = await findUserByEmail(email, tenantId);
      if (existing && existing.id !== id) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const updatedUser = await updateUser(id, tenantId, updateData);
    const profileUpdateData: { color?: string; availableDays?: number[] | null; availableHours?: { start: string; end: string } | null } = {};

    if (profile) {
      if (profile.color !== color) {
        profileUpdateData.color = color;
      }
      if (availableDays !== undefined) {
        profileUpdateData.availableDays = availableDays.length > 0 ? availableDays : null;
      }
      if (availableHours !== undefined) {
        profileUpdateData.availableHours = availableHours;
      }

      // Additional fields
      if (licenseNumber !== undefined) (profileUpdateData as any).licenseNumber = licenseNumber;
      if (medicalCoverages !== undefined) (profileUpdateData as any).medicalCoverages = medicalCoverages;
      // Always update availabilityConfig if it's provided in the request (even if null/empty)
      // Use hasOwnProperty check to distinguish between undefined (not sent) and null (explicitly cleared)
      if (body.hasOwnProperty('availabilityConfig')) {
        (profileUpdateData as any).availabilityConfig = availabilityConfig;
        console.log("Including availabilityConfig in update:", availabilityConfig);
      } else {
        console.log("availabilityConfig not provided in request body");
      }

      console.log("Profile update data:", profileUpdateData);
      await updateProfessionalProfile(id, tenantId, profileUpdateData);
    }

    const updatedProfile = await findProfessionalProfileByUserId(id, tenantId);
    const responsePayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      dni: updatedUser.dni ?? undefined,
      role: updatedUser.role,
      color: updatedProfile?.color || color,
      licenseNumber: updatedProfile?.licenseNumber,
      medicalCoverages: updatedProfile?.medicalCoverages,
      availabilityConfig: updatedProfile?.availabilityConfig,
      holidays: updatedProfile?.availabilityConfig?.holidays || [],
      availableDays: updatedProfile?.availableDays,
      availableHours: updatedProfile?.availableHours,
    };
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("Error updating professional:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "SUPERVISOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await findUserById(id, tenantId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Delete appointments first (FK professionalId REFERENCES users ON DELETE RESTRICT)
  await deleteAppointmentsByProfessional(id, tenantId);
  await deleteUser(id, tenantId);
  return NextResponse.json({ success: true });
}

