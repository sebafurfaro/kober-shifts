import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import { createTenantExpense, listTenantExpenses } from "@/lib/tenant-expenses";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>, tenantId: string) {
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  const gate = requireAdmin(session, tenantId);
  if (gate) return gate;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const date = url.searchParams.get("date") || undefined;
  const category = url.searchParams.get("category") || undefined;

  try {
    const items = await listTenantExpenses(tenantId, { search, date, category });
    return NextResponse.json({ expenses: items });
  } catch (error: unknown) {
    console.error("Error listing egresos:", error);
    return NextResponse.json({ error: "Failed to load egresos" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
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
    return NextResponse.json({ error: "Fecha inválida (usar YYYY-MM-DD)" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  try {
    const created = await createTenantExpense({
      tenantId,
      title,
      category,
      description,
      amount,
      expenseDate,
      isRecurring,
    });
    return NextResponse.json(created);
  } catch (error: unknown) {
    console.error("Error creating egreso:", error);
    return NextResponse.json({ error: "Error al guardar egreso" }, { status: 500 });
  }
}
