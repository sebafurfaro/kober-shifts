import { NextResponse } from "next/server";
import { findUserByEmailAnyTenant } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createStoreSessionCookieValue, getStoreSessionCookieOptions, STORE_SESSION_COOKIE } from "@/lib/store-session";

const ALLOWED_EMAILS = ["seba.furfaro@gmail.com", "caourisaldana@gmail.com", "sfurfaro.dev@gmail.com"].map((e) => e.toLowerCase());

function isEmailAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
  }

  if (!isEmailAllowed(email)) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  // Find user in any tenant
  const user = await findUserByEmailAnyTenant(email);
  if (!user) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  // If user is pending registration (placeholder password), deny login
  if (user.passwordHash.startsWith("PENDING_GOOGLE_")) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  // Create store session (only stores email, no tenant info)
  const res = NextResponse.json({ success: true, email: user.email });
  res.cookies.set(
    STORE_SESSION_COOKIE,
    createStoreSessionCookieValue(user.email),
    getStoreSessionCookieOptions()
  );
  return res;
}
