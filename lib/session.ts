import type { Role } from "./types";
import { createSessionToken, verifySessionToken } from "./auth";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-cookies";

export {
  PWA_SESSION_COOKIE,
  PWA_SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE,
  getSessionCookieOptions,
} from "./session-cookies";

export async function getSession(): Promise<{ userId: string; tenantId: string; role: Role } | null> {
  // Next.js 16: cookies() can be async depending on runtime.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function createSessionCookieValue(input: { userId: string; tenantId: string; role: Role }) {
  return createSessionToken({ userId: input.userId, tenantId: input.tenantId, role: input.role });
}


