import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findSpecialtyById, updateSpecialty, deleteSpecialty } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  const { id, tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "PROFESSIONAL") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const specialty = await findSpecialtyById(id, tenantId);
  if (!specialty) return NextResponse.json({ error: "Specialty not found" }, { status: 404 });

  return NextResponse.json(specialty);
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

  const specialty = await findSpecialtyById(id, tenantId);
  if (!specialty) return NextResponse.json({ error: "Specialty not found" }, { status: 404 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const updatedSpecialty = await updateSpecialty(id, tenantId, { name });
    return NextResponse.json(updatedSpecialty);
  } catch (error: any) {
    if (error.message?.includes("Duplicate") || error.message?.includes("already exists")) {
      return NextResponse.json({ error: "Specialty name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to update specialty" }, { status: 500 });
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

  const specialty = await findSpecialtyById(id, tenantId);
  if (!specialty) return NextResponse.json({ error: "Specialty not found" }, { status: 404 });

  try {
    await deleteSpecialty(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Check if there are foreign key constraints (e.g., professionals using this specialty)
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message?.includes('foreign key')) {
      return NextResponse.json({
        error: "No se puede eliminar la especialidad porque está siendo utilizada por profesionales"
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to delete specialty" }, { status: 500 });
  }
}
