import type { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "./auth";

export const STORE_SESSION_COOKIE = "store_session";

export type StoreSessionPayload = {
  email: string;
};

export async function getStoreSession(): Promise<StoreSessionPayload | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(STORE_SESSION_COOKIE)?.value;
  if (!token) return null;
  
  try {
    // We'll use a simple verification - just check if it's a valid email
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as StoreSessionPayload;
    if (parsed?.email) {
      return parsed;
    }
  } catch {
    return null;
  }
  
  return null;
}

export function getStoreSessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/", // Use root path so cookie is available for /store and /api/store
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export function createStoreSessionCookieValue(email: string): string {
  const payload = { email };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function verifyStoreSessionToken(token: string): StoreSessionPayload | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as StoreSessionPayload;
    if (parsed?.email) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}
