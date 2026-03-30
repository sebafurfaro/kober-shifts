import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import { getPublicBaseUrl, isSafeMercadoPagoReturnPath } from "@/lib/public-base-url";

const MP_OAUTH_RETURN_COOKIE = "mp_oauth_return";

function canManageMercadoPago(role: Role): boolean {
  return role === Role.ADMIN || role === Role.PROFESSIONAL || role === Role.SUPERVISOR;
}

/**
 * GET /api/plataforma/[tenantId]/integrations/mercadopago/authorize
 * Redirects the user to MercadoPago OAuth consent. state = tenantId.
 * Query: optional return_to=/plataforma/... (misma app, mismo tenant) para volver tras el callback.
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
  const returnTo = new URL(req.url).searchParams.get("return_to");
  const safeReturn =
    returnTo && isSafeMercadoPagoReturnPath(returnTo, tenantId) ? returnTo : undefined;

  const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    const paymentsUrl = `${baseUrl}/plataforma/${tenantId}/panel/admin/payments?mp_error=oauth_not_configured`;
    return NextResponse.redirect(paymentsUrl);
  }

  const redirectUri = `${baseUrl}/api/integrations/mercadopago/callback`;
  // Alineado con mercadopago SDK getAuthorizationURL (platform_id=mp)
  const authUrl = new URL("https://auth.mercadopago.com/authorization");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", tenantId);
  authUrl.searchParams.set("platform_id", "mp");

  const res = NextResponse.redirect(authUrl.toString());
  if (safeReturn) {
    res.cookies.set(MP_OAUTH_RETURN_COOKIE, safeReturn, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
    });
  }
  return res;
}
