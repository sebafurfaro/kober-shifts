import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllServices, createService } from "@/lib/db";
import { randomUUID } from "crypto";
import { Role } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const items = await findAllServices(tenantId);
    return NextResponse.json(items);
  } catch (error: unknown) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });

  const description = typeof body.description === "string" ? body.description.trim() : null;
  const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : Number(body.durationMinutes) || 60;
  const marginMinutes = typeof body.marginMinutes === "number" ? body.marginMinutes : Number(body.marginMinutes) || 0;
  const price = typeof body.price === "number" ? body.price : Number(body.price) || 0;
  const seniaPercent = typeof body.seniaPercent === "number" ? body.seniaPercent : Number(body.seniaPercent) || 0;

  try {
    const created = await createService({
      id: randomUUID(),
      tenantId,
      name,
      description: description || null,
      durationMinutes,
      marginMinutes,
      price,
      seniaPercent,
    });
    return NextResponse.json(created);
  } catch (error: unknown) {
    console.error("Error creating service:", error);
    const message = error instanceof Error ? error.message : "Error al crear servicio";
    const payload: { error: string; detail?: string } = { error: "Error al crear servicio" };
    if (process.env.NODE_ENV !== "production") payload.detail = message;
    return NextResponse.json(payload, { status: 500 });
  }
}
