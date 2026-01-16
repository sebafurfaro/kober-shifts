import { NextResponse } from "next/server";
import { createUser, findUserByEmail, updateUser } from "@/lib/db";
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
  let user;

  if (exists) {
    if (exists.passwordHash.startsWith("PENDING_GOOGLE_")) {
      // Update existing pending user
      user = await updateUser(exists.id, {
        name,
        // We don't update email as it matches
        passwordHash: hashPassword(password),
        // Role remains PATIENT or whatever was set
      });
    } else {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  } else {
    // Create new user
    user = await createUser({
      id: randomUUID(),
      email,
      name,
      passwordHash: hashPassword(password),
      role: Role.PATIENT,
    });
  }

  const res = NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  res.cookies.set(SESSION_COOKIE, createSessionCookieValue({ userId: user.id, role: user.role }), {
    ...getSessionCookieOptions(),
  });
  return res;
}


