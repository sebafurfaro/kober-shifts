import { NextResponse } from "next/server";
import { STORE_SESSION_COOKIE, getStoreSessionCookieOptions } from "@/lib/store-session";

export async function POST(req: Request) {
  const res = NextResponse.json({ success: true });
  res.cookies.set(STORE_SESSION_COOKIE, "", {
    ...getStoreSessionCookieOptions(),
    maxAge: 0,
  });
  return res;
}
