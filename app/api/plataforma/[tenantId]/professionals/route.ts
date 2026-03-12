import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUsersWithProfessionalProfile } from "@/lib/db";

/**
 * GET /api/plataforma/[tenantId]/professionals
 * Lista de profesionales disponibles para que los pacientes saquen turno.
 * Solo se consideran usuarios con registro en professional_profiles activo (no el rol).
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

  const professionals = await findUsersWithProfessionalProfile(tenantId);
  const availableProfessionals = professionals
    .filter((p) => p.professional && p.professional.isActive)
    .map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      color: p.professional?.color,
    }));

  return NextResponse.json(availableProfessionals);
}
