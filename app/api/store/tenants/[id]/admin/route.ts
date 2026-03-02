import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/store-session";
import { findUsersByRole, updateUser, createUser, findUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/lib/types";
import { randomUUID } from "crypto";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateStoreAccess();
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { id: tenantId } = await params;
  const admins = await findUsersByRole(Role.ADMIN, tenantId);
  const admin = admins[0];
  return NextResponse.json({
    email: admin?.email ?? "",
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateStoreAccess();
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { id: tenantId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const admins = await findUsersByRole(Role.ADMIN, tenantId);
  const admin = admins[0];
  const existingByEmail = await findUserByEmail(email, tenantId);
  if (existingByEmail && admin && existingByEmail.id !== admin.id) {
    return NextResponse.json({ error: "Email ya existe en este tenant" }, { status: 409 });
  }

  if (admin) {
    await updateUser(admin.id, tenantId, {
      email,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
      role: Role.ADMIN,
    });
  } else {
    await createUser({
      id: randomUUID(),
      tenantId,
      email,
      name: email.split("@")[0] || "Admin",
      passwordHash: hashPassword(password || randomUUID()),
      role: Role.ADMIN,
    });
  }

  return NextResponse.json({ success: true });
}

