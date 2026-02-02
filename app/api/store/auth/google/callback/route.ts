import { NextResponse } from "next/server";
import { exchangeCodeForStoreLogin } from "@/lib/googleOAuth";
import {
  createStoreSessionCookieValue,
  getStoreSessionCookieOptions,
  STORE_SESSION_COOKIE,
} from "@/lib/store-session";

const ALLOWED_EMAILS = [
  "seba.furfaro@gmail.com",
  "caourisaldana@gmail.com",
].map((e) => e.toLowerCase());

function isEmailAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

function getStoreRedirectUri(req: Request): string {
  const explicit = process.env.GOOGLE_STORE_REDIRECT_URI?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  return `${base}/api/store/auth/google/callback`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectUri = getStoreRedirectUri(req);

  if (!code) {
    return NextResponse.redirect(
      new URL("/store/login?error=no_code", req.url)
    );
  }

  try {
    const tokens = await exchangeCodeForStoreLogin(code, redirectUri);
    const idToken = tokens.id_token;
    if (!idToken) {
      return NextResponse.redirect(
        new URL("/store/login?error=no_id_token", req.url)
      );
    }

    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString()
    ) as { email?: string };
    const email = payload.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.redirect(
        new URL("/store/login?error=no_email", req.url)
      );
    }

    if (!isEmailAllowed(email)) {
      return NextResponse.redirect(
        new URL("/store/login?error=access_denied", req.url)
      );
    }

    const res = NextResponse.redirect(new URL("/store/tenants", req.url));
    res.cookies.set(
      STORE_SESSION_COOKIE,
      createStoreSessionCookieValue(email),
      getStoreSessionCookieOptions()
    );
    return res;
  } catch (error) {
    console.error("Store Google callback error:", error);
    return NextResponse.redirect(
      new URL("/store/login?error=auth_failed", req.url)
    );
  }
}
