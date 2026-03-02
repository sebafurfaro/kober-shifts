import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserByEmail, findProfessionalProfileByUserId, createProfessionalProfile, findAllSpecialties } from "@/lib/db";
import { Role } from "@/lib/types";

/**
 * POST: Vincular un colaborador existente (por email) como profesional.
 * Crea el perfil profesional sin cambiar el rol del usuario.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL" && session.role !== "SUPERVISOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "El correo es requerido para vincular" }, { status: 400 });

  const user = await findUserByEmail(email, tenantId);
  if (!user) return NextResponse.json({ error: "No existe un colaborador con ese correo" }, { status: 404 });

  const allowedRoles: Role[] = [Role.ADMIN, Role.PROFESSIONAL, Role.SUPERVISOR];
  if (!allowedRoles.includes(user.role as Role)) return NextResponse.json({ error: "Ese usuario no es un colaborador" }, { status: 400 });

  const existing = await findProfessionalProfileByUserId(user.id, tenantId);
  if (existing) return NextResponse.json({ error: "Ese usuario ya es profesional" }, { status: 409 });

  const specialties = await findAllSpecialties(tenantId);
  const specialtyId = specialties.length > 0 ? specialties[0].id : "";
  if (!specialtyId) return NextResponse.json({ error: "Cree al menos una especialidad antes de vincular" }, { status: 400 });

  await createProfessionalProfile({
    userId: user.id,
    tenantId,
    specialtyId,
    specialtyIds: [specialtyId],
    color: "#2196f3",
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
