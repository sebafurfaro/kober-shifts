import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";

/**
 * GET /api/plataforma/[tenantId]/integrations/mercadopago/authorize
 * Redirects the user to MercadoPago OAuth consent. state = tenantId.
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
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  if (!clientId) {
    const host = req.headers.get("x-forwarded-host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = process.env.APP_URL || (host ? `${proto}://${host}` : "http://localhost:3000");
    const paymentsUrl = `${baseUrl}/plataforma/${tenantId}/panel/admin/payments?mp_error=oauth_not_configured`;
    return NextResponse.redirect(paymentsUrl);
  }

  const host = req.headers.get("x-forwarded-host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = process.env.APP_URL || (host ? `${proto}://${host}` : "http://localhost:3000");
  const redirectUri = `${baseUrl}/api/integrations/mercadopago/callback`;
  const authUrl = new URL("https://auth.mercadopago.com/authorization");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", tenantId);

  return NextResponse.redirect(authUrl.toString());
}
