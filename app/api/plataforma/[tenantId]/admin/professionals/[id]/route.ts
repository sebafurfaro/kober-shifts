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
import mysql from "@/lib/mysql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await findUserById(id, tenantId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const profile = await findProfessionalProfileByUserId(id, tenantId);
  if (!profile) return NextResponse.json({ error: "Professional profile not found" }, { status: 404 });

  // Get all specialties for this professional
  // Note: professional_specialties table doesn't have tenantId column
  // We filter by joining with specialties table which has tenantId
  const [specialtyRows] = await mysql.execute(
    `SELECT ps.specialtyId 
     FROM professional_specialties ps
     INNER JOIN specialties s ON ps.specialtyId = s.id
     WHERE ps.userId = ? AND s.tenantId = ?`,
    [id, tenantId]
  );
  const specialtyIds = (specialtyRows as any[]).map(row => row.specialtyId);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    dni: user.dni ?? undefined,
    specialtyId: profile.specialtyId,
    specialtyIds: specialtyIds.length > 0 ? specialtyIds : [profile.specialtyId],
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
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    const specialtyId = typeof body.specialtyId === "string" ? body.specialtyId : "";
    const specialtyIds = Array.isArray(body.specialtyIds) ? body.specialtyIds.filter((id): id is string => typeof id === "string") : (specialtyId ? [specialtyId] : []);
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
      availabilityConfig.holidays = body.holidays;
    }

    const availableDays = Array.isArray(body.availableDays) ? body.availableDays.filter((d): d is number => typeof d === "number") : undefined;
    const availableHours = body.availableHours && typeof body.availableHours === "object" && "start" in body.availableHours && "end" in body.availableHours
      ? { start: String(body.availableHours.start), end: String(body.availableHours.end) }
      : undefined;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (specialtyIds.length === 0) return NextResponse.json({ error: "At least one specialty is required" }, { status: 400 });

    const updateData: { name: string; passwordHash?: string } = { name };

    // Only update password if provided
    if (tempPassword) {
      if (tempPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      updateData.passwordHash = hashPassword(tempPassword);
    }

    // Update user
    const updatedUser = await updateUser(id, tenantId, updateData);

    // Update professional profile
    const profile = await findProfessionalProfileByUserId(id, tenantId);
    const profileUpdateData: { specialtyId?: string; specialtyIds?: string[]; color?: string; availableDays?: number[] | null; availableHours?: { start: string; end: string } | null } = {};

    if (profile) {
      if (specialtyIds.length > 0) {
        profileUpdateData.specialtyIds = specialtyIds;
        profileUpdateData.specialtyId = specialtyIds[0];
      }
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
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      specialtyId: specialtyIds[0] || "",
      specialtyIds,
      color: updatedProfile?.color || color,
      licenseNumber: updatedProfile?.licenseNumber,
      medicalCoverages: updatedProfile?.medicalCoverages,
      availabilityConfig: updatedProfile?.availabilityConfig,
      holidays: updatedProfile?.availabilityConfig?.holidays || [],
      availableDays: updatedProfile?.availableDays,
      availableHours: updatedProfile?.availableHours,
    });
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
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await findUserById(id, tenantId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Delete appointments first (FK professionalId REFERENCES users ON DELETE RESTRICT)
  await deleteAppointmentsByProfessional(id, tenantId);
  await deleteUser(id, tenantId);
  return NextResponse.json({ success: true });
}

