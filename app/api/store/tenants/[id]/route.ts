import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/store-session";
import { deleteTenant, findTenantById } from "@/lib/db";

const ALLOWED_EMAILS = ["seba.furfaro@gmail.com", "caourisaldana@gmail.com"].map((e) => e.toLowerCase());

async function validateStoreAccess() {
  const session = await getStoreSession();
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!ALLOWED_EMAILS.includes(session.email.toLowerCase())) {
    return { error: "Forbidden", status: 403 };
  }

  return { session };
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateStoreAccess();
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { id } = await params;

  // Check if tenant exists
  const tenant = await findTenantById(id);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  try {
    await deleteTenant(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
  }
}
