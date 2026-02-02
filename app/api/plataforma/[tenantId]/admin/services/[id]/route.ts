import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findServiceById, updateService, deleteService } from "@/lib/db";
import { Role } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = await findServiceById(id, tenantId);
  if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await findServiceById(id, tenantId);
  if (!existing) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });

  const description = typeof body.description === "string" ? body.description.trim() : null;
  const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : Number(body.durationMinutes) ?? existing.durationMinutes;
  const marginMinutes = typeof body.marginMinutes === "number" ? body.marginMinutes : Number(body.marginMinutes) ?? existing.marginMinutes;
  const price = typeof body.price === "number" ? body.price : Number(body.price) ?? existing.price;
  const seniaPercent = typeof body.seniaPercent === "number" ? body.seniaPercent : Number(body.seniaPercent) ?? existing.seniaPercent;

  try {
    const updated = await updateService(id, tenantId, {
      name,
      description: description ?? existing.description,
      durationMinutes,
      marginMinutes,
      price,
      seniaPercent,
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: "Error al actualizar servicio" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = await findServiceById(id, tenantId);
  if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });

  try {
    await deleteService(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: "Error al eliminar servicio" }, { status: 500 });
  }
}
