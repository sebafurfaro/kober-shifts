import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upsertMercadoPagoAccount } from "@/lib/mercadopago-accounts";
import { getPublicBaseUrl, isSafeMercadoPagoReturnPath } from "@/lib/public-base-url";

const MP_OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const MP_OAUTH_RETURN_COOKIE = "mp_oauth_return";

function appendMpLinked(base: string, pathWithQuery: string): string {
  const join = pathWithQuery.includes("?") ? "&" : "?";
  return `${base}${pathWithQuery}${join}mp_linked=1`;
}

/**
 * GET /api/integrations/mercadopago/callback
 * MercadoPago redirects here with ?code=...&state=tenantId
 * Exchange code for tokens and store per tenant, then redirect (pagos o return_to guardado en cookie).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // tenantId

  const baseUrl = getPublicBaseUrl(req);
  const defaultPaymentsPath = `/plataforma/${state || ""}/panel/admin/payments`;

  if (!code || !state) {
    const error = url.searchParams.get("error") || "missing_code_or_state";
    return NextResponse.redirect(
      `${baseUrl}${defaultPaymentsPath}?mp_error=${encodeURIComponent(error)}`
    );
  }

  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${baseUrl}${defaultPaymentsPath}?mp_error=server_config`
    );
  }

  const redirectUri = `${baseUrl}/api/integrations/mercadopago/callback`;

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(MP_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("MercadoPago OAuth token error:", tokenRes.status, errBody);
      return NextResponse.redirect(
        `${baseUrl}${defaultPaymentsPath}?mp_error=token_exchange_failed`
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

    const jar = await cookies();
    const returnPath = jar.get(MP_OAUTH_RETURN_COOKIE)?.value;
    const successPath =
      returnPath && isSafeMercadoPagoReturnPath(returnPath, state)
        ? returnPath
        : `${defaultPaymentsPath}`;
    const target = appendMpLinked(baseUrl, successPath);

    const res = NextResponse.redirect(target);
    res.cookies.set(MP_OAUTH_RETURN_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  } catch (error) {
    console.error("MercadoPago callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}${defaultPaymentsPath}?mp_error=callback_failed`
    );
  }
}
