import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUsersWithProfessionalProfile } from "@/lib/db";

/**
 * GET /api/plataforma/[tenantId]/professionals
 * Get list of active professionals available for patients to book appointments
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all professionals with their profiles
  const professionals = await findUsersWithProfessionalProfile(tenantId);

  // Filter only active professionals with profiles
  const availableProfessionals = professionals
    .filter((p) => p.professional && p.professional.isActive)
    .map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      specialty: p.professional?.specialty,
      specialties: p.professional?.specialties || [],
      color: p.professional?.color,
    }));

  return NextResponse.json(availableProfessionals);
}
