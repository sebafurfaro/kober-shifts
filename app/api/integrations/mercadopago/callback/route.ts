import { NextResponse } from "next/server";
import { upsertMercadoPagoAccount } from "@/lib/mercadopago-accounts";

const MP_OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

/**
 * GET /api/integrations/mercadopago/callback
 * MercadoPago redirects here with ?code=...&state=tenantId
 * Exchange code for tokens and store per tenant, then redirect to panel payments.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // tenantId

  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  if (!code || !state) {
    const error = url.searchParams.get("error") || "missing_code_or_state";
    return NextResponse.redirect(
      `${baseUrl}/plataforma/${state || ""}/panel/admin/payments?mp_error=${encodeURIComponent(error)}`
    );
  }

  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${baseUrl}/plataforma/${state}/panel/admin/payments?mp_error=server_config`
    );
  }

  const redirectUri = `${baseUrl}/api/integrations/mercadopago/callback`;

  try {
    const tokenRes = await fetch(MP_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("MercadoPago OAuth token error:", tokenRes.status, errBody);
      return NextResponse.redirect(
        `${baseUrl}/plataforma/${state}/panel/admin/payments?mp_error=token_exchange_failed`
      );
    }

    const data = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      user_id?: number;
    };

    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

    await upsertMercadoPagoAccount({
      tenantId: state,
      mpUserId: data.user_id ?? null,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || data.access_token,
      expiresAt,
    });

    return NextResponse.redirect(
      `${baseUrl}/plataforma/${state}/panel/admin/payments?mp_linked=1`
    );
  } catch (error) {
    console.error("MercadoPago callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/plataforma/${state}/panel/admin/payments?mp_error=callback_failed`
    );
  }
}
