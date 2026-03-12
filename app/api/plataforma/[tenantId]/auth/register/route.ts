import { NextResponse } from "next/server";
import { createUser, findUserByEmail, updateUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createSessionCookieValue, getSessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import { Role } from "@/lib/types";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = `${firstName} ${lastName}`.trim();

  if (!email || !firstName || !lastName || password.length < 6) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const exists = await findUserByEmail(email, tenantId);
  let user;

  if (exists) {
    if (exists.passwordHash.startsWith("PENDING_GOOGLE_")) {
      // Update existing pending user
      user = await updateUser(exists.id, tenantId, {
        name,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash: hashPassword(password),
        role: Role.PATIENT,
      });
    } else {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  } else {
    // Create new user as PATIENT
    const role = Role.PATIENT;
    user = await createUser({
      id: randomUUID(),
      tenantId,
      email,
      name,
      firstName: firstName || null,
      lastName: lastName || null,
      passwordHash: hashPassword(password),
      role,
    });
  }

  const res = NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });
  res.cookies.set(SESSION_COOKIE, createSessionCookieValue({
    userId: user.id,
    role: user.role,
    tenantId
  }), {
    ...getSessionCookieOptions(),
  });
  return res;
}


