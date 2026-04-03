import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import { deleteTenantExpense, updateTenantExpense } from "@/lib/tenant-expenses";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>, tenantId: string) {
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tenantId: string; id: string }> }
) {
  const { tenantId, id } = await params;
  const session = await getSession();
  const gate = requireAdmin(session, tenantId);
  if (gate) return gate;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() || null : null;
  const amount =
    typeof body.amount === "number" ? body.amount : Number(body.amount);
  const expenseDate =
    typeof body.expenseDate === "string" ? body.expenseDate.trim().slice(0, 10) : "";
  const isRecurring = Boolean(body.isRecurring);

  if (!title) return NextResponse.json({ error: "Título es requerido" }, { status: 400 });
  if (!category) return NextResponse.json({ error: "Categoría es requerida" }, { status: 400 });
  if (!expenseDate || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  try {
    const updated = await updateTenantExpense(tenantId, id, {
      title,
      category,
      description,
      amount,
      expenseDate,
      isRecurring,
    });
    if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating egreso:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tenantId: string; id: string }> }
) {
  const { tenantId, id } = await params;
  const session = await getSession();
  const gate = requireAdmin(session, tenantId);
  if (gate) return gate;

  try {
    const ok = await deleteTenantExpense(tenantId, id);
    if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting egreso:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
