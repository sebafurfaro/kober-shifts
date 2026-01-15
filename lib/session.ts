import type { Role } from "./types";
import { createSessionToken, verifySessionToken } from "./auth";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ks_session";

export async function getSession(): Promise<{ userId: string; role: Role } | null> {
  // Next.js 16: cookies() can be async depending on runtime.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function createSessionCookieValue(input: { userId: string; role: Role }) {
  return createSessionToken({ userId: input.userId, role: input.role });
}


