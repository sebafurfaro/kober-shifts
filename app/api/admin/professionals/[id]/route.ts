import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  findUserById,
  findProfessionalProfileByUserId,
  updateUser,
  updateProfessionalProfile,
  findUserByEmail,
} from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import mysql from "@/lib/mysql";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await findUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const profile = await findProfessionalProfileByUserId(id);
  if (!profile) return NextResponse.json({ error: "Professional profile not found" }, { status: 404 });

  // Get all specialties for this professional
  const [specialtyRows] = await mysql.execute(
    'SELECT specialtyId FROM professional_specialties WHERE userId = ?',
    [id]
  );
  const specialtyIds = (specialtyRows as any[]).map(row => row.specialtyId);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    specialtyId: profile.specialtyId,
    specialtyIds: specialtyIds.length > 0 ? specialtyIds : [profile.specialtyId],
    color: profile.color,
    availableDays: profile.availableDays,
    availableHours: profile.availableHours,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  
  const user = await findUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const specialtyId = typeof body.specialtyId === "string" ? body.specialtyId : "";
  const specialtyIds = Array.isArray(body.specialtyIds) ? body.specialtyIds.filter((id): id is string => typeof id === "string") : (specialtyId ? [specialtyId] : []);
  const color = typeof body.color === "string" ? body.color.trim() : "#2196f3";
  const tempPassword = typeof body.tempPassword === "string" ? body.tempPassword : "";
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
  const updatedUser = await updateUser(id, updateData);

  // Update professional profile
  const profile = await findProfessionalProfileByUserId(id);
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
    
    await updateProfessionalProfile(id, profileUpdateData);
  }

  const updatedProfile = await findProfessionalProfileByUserId(id);
  return NextResponse.json({
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    specialtyId: specialtyIds[0] || "",
    specialtyIds,
    color: updatedProfile?.color || color,
    availableDays: updatedProfile?.availableDays,
    availableHours: updatedProfile?.availableHours,
  });
}

