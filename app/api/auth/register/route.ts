import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createSessionCookieValue, getSessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import { Role } from "@/lib/types";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !name || password.length < 6) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const exists = await findUserByEmail(email);
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const user = await createUser({
    id: randomUUID(),
    email,
    name,
    passwordHash: hashPassword(password),
    role: Role.PATIENT,
  });

  const res = NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  res.cookies.set(SESSION_COOKIE, createSessionCookieValue({ userId: user.id, role: user.role }), {
    ...getSessionCookieOptions(),
  });
  return res;
}


