import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/googleOAuth";
import { findGoogleOAuthTokenByUserId, upsertGoogleOAuthToken } from "@/lib/db";
import { getSession } from "@/lib/session";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId we sent

  if (!code || !state || state !== session.userId) {
    return NextResponse.redirect(new URL("/panel", req.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const existing = await findGoogleOAuthTokenByUserId(session.userId);

    await upsertGoogleOAuthToken({
      id: existing?.id || randomUUID(),
      userId: session.userId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      scope: tokens.scope ?? null,
      tokenType: tokens.token_type ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });
  } catch {
    // keep it simple for v1
  }

  return NextResponse.redirect(new URL("/panel/professional", req.url));
}


