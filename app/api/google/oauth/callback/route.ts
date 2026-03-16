import { NextResponse } from "next/server";
import { exchangeCodeForCalendarTokens } from "@/lib/googleOAuth";
import { findGoogleOAuthTokenByUserId, upsertGoogleOAuthToken } from "@/lib/db";
import { getSession } from "@/lib/session";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const session = await getSession();

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  let stateUserId = "";
  let stateTenantId = "";

  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64").toString());
      stateUserId = decodedState.userId || "";
      stateTenantId = decodedState.tenantId || "";
    } catch (e) {
      console.error("Failed to decode state:", e);
    }
  }

  if (!session) {
    const loginUrl = stateTenantId ? `/plataforma/${stateTenantId}/login` : "/login";
    return NextResponse.redirect(new URL(loginUrl, req.url));
  }

  if (!code || !state || stateUserId !== session.userId || stateTenantId !== session.tenantId) {
    return NextResponse.redirect(new URL(`/plataforma/${session.tenantId}/panel`, req.url));
  }

  try {
    const tokens = await exchangeCodeForCalendarTokens(code);
    const existing = await findGoogleOAuthTokenByUserId(session.userId, session.tenantId);

    await upsertGoogleOAuthToken({
      id: existing?.id || randomUUID(),
      tenantId: session.tenantId,
      userId: session.userId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      scope: tokens.scope ?? null,
      tokenType: tokens.token_type ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
  }

  return NextResponse.redirect(new URL(`/plataforma/${session.tenantId}/panel/professional`, req.url));
}


