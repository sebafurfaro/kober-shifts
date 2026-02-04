import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUsersWithProfessionalProfile, findUsersWithRoleIn } from "@/lib/db";

/**
 * GET /api/plataforma/[tenantId]/professionals
 * Get list of active professionals available for patients to book appointments.
 * If there are no professionals with profile, and there is exactly one user with role ADMIN or PROFESSIONAL, that user is returned as the professional.
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
  let availableProfessionals = professionals
    .filter((p) => p.professional && p.professional.isActive)
    .map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      specialty: p.professional?.specialty,
      specialties: p.professional?.specialties || [],
      color: p.professional?.color,
    }));

  // Fallback: si hay un solo usuario creado como profesional o admin, tomarlo como profesional
  if (availableProfessionals.length === 0) {
    const adminOrProfessional = await findUsersWithRoleIn(["ADMIN", "PROFESSIONAL"], tenantId);
    if (adminOrProfessional.length === 1) {
      const u = adminOrProfessional[0];
      availableProfessionals = [
        {
          id: u.id,
          name: u.name,
          email: u.email,
          specialty: null,
          specialties: [],
          color: null,
        },
      ];
    }
  }

  return NextResponse.json(availableProfessionals);
}
