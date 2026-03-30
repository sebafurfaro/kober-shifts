import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import { getPublicBaseUrl, isSafeMercadoPagoReturnPath } from "@/lib/public-base-url";
import { getMercadoPagoOAuthAuthorizationPageUrl } from "@/lib/mercadopago-oauth-auth-url";
import { generateMercadoPagoPkcePair } from "@/lib/mercadopago-oauth-pkce";
import { MP_OAUTH_RETURN_COOKIE, MP_OAUTH_PKCE_COOKIE } from "@/lib/mercadopago-oauth-cookies";

function oauthPkceEnabled(): boolean {
  const v = process.env.MERCADOPAGO_OAUTH_USE_PKCE?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function canManageMercadoPago(role: Role): boolean {
  return role === Role.ADMIN || role === Role.PROFESSIONAL || role === Role.SUPERVISOR;
}

/**
 * GET /api/plataforma/[tenantId]/integrations/mercadopago/authorize
 * Redirects the user to MercadoPago OAuth consent. state = tenantId.
 * Query: integration_source=integrations (obligatorio; solo desde Admin → Integraciones).
 * Opcional: return_to=/plataforma/... (misma app, mismo tenant) para volver tras el callback.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageMercadoPago(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const baseUrl = getPublicBaseUrl(req);
  const search = new URL(req.url).searchParams;
  const integrationSource = search.get("integration_source");
  if (integrationSource !== "integrations") {
    return NextResponse.json(
      { error: "La vinculación con Mercado Pago solo puede iniciarse desde Admin → Integraciones." },
      { status: 403 }
    );
  }

  const returnTo = search.get("return_to");
  const safeReturn =
    returnTo && isSafeMercadoPagoReturnPath(returnTo, tenantId) ? returnTo : undefined;

  const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    const adminUrl = `${baseUrl}/plataforma/${tenantId}/panel/admin?mp_error=oauth_not_configured`;
    return NextResponse.redirect(adminUrl);
  }

  const redirectUri = `${baseUrl}/api/integrations/mercadopago/callback`;
  // Host regional (p. ej. .com.ar); auth.mercadopago.com sin país suele dar 403 para apps MLA.
  const authUrl = new URL(getMercadoPagoOAuthAuthorizationPageUrl());
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", tenantId);
  authUrl.searchParams.set("platform_id", "mp");

  let pkceVerifier: string | undefined;
  if (oauthPkceEnabled()) {
    const pair = generateMercadoPagoPkcePair();
    pkceVerifier = pair.codeVerifier;
    authUrl.searchParams.set("code_challenge", pair.codeChallenge);
    authUrl.searchParams.set("code_method", "S256");
  }

  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
  };

  const res = NextResponse.redirect(authUrl.toString());
  if (safeReturn) {
    res.cookies.set(MP_OAUTH_RETURN_COOKIE, safeReturn, cookieOpts);
  }
  if (pkceVerifier) {
    res.cookies.set(MP_OAUTH_PKCE_COOKIE, pkceVerifier, cookieOpts);
  }
  return res;
}
