import { NextResponse } from "next/server";
import { getSessionCookieOptions, PWA_SESSION_COOKIE, SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...getSessionCookieOptions(), maxAge: 0 });
  res.cookies.set(PWA_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}


