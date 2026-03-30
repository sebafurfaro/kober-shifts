import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upsertMercadoPagoAccount } from "@/lib/mercadopago-accounts";
import { exchangeAuthorizationCodeForTokens } from "@/lib/mercadopago-oauth-token";
import { getPublicBaseUrl, isSafeMercadoPagoReturnPath } from "@/lib/public-base-url";
import { MP_OAUTH_RETURN_COOKIE, MP_OAUTH_PKCE_COOKIE } from "@/lib/mercadopago-oauth-cookies";

function clearOAuthCookies(res: NextResponse): void {
  res.cookies.set(MP_OAUTH_RETURN_COOKIE, "", { maxAge: 0, path: "/" });
  res.cookies.set(MP_OAUTH_PKCE_COOKIE, "", { maxAge: 0, path: "/" });
}

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

  const jar = await cookies();
  const pkceVerifier = jar.get(MP_OAUTH_PKCE_COOKIE)?.value;

  if (!code || !state) {
    const error = url.searchParams.get("error") || "missing_code_or_state";
    const res = NextResponse.redirect(
      `${baseUrl}${defaultPaymentsPath}?mp_error=${encodeURIComponent(error)}`
    );
    clearOAuthCookies(res);
    return res;
  }

  const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    const res = NextResponse.redirect(
      `${baseUrl}${defaultPaymentsPath}?mp_error=server_config`
    );
    clearOAuthCookies(res);
    return res;
  }

  const redirectUri = `${baseUrl}/api/integrations/mercadopago/callback`;

  try {
    let data: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      user_id?: number;
    };

    try {
      data = await exchangeAuthorizationCodeForTokens({
        clientId,
        clientSecret,
        code,
        redirectUri,
        codeVerifier: pkceVerifier || undefined,
      });
    } catch (e) {
      console.error("MercadoPago OAuth exchangeAuthorizationCodeForTokens:", e);
      const res = NextResponse.redirect(
        `${baseUrl}${defaultPaymentsPath}?mp_error=token_exchange_failed`
      );
      clearOAuthCookies(res);
      return res;
    }

    if (!data.access_token) {
      console.error("MercadoPago OAuth: respuesta sin access_token", data);
      const res = NextResponse.redirect(
        `${baseUrl}${defaultPaymentsPath}?mp_error=token_exchange_failed`
      );
      clearOAuthCookies(res);
      return res;
    }

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

    const returnPath = jar.get(MP_OAUTH_RETURN_COOKIE)?.value;
    const successPath =
      returnPath && isSafeMercadoPagoReturnPath(returnPath, state)
        ? returnPath
        : `${defaultPaymentsPath}`;
    const target = appendMpLinked(baseUrl, successPath);

    const res = NextResponse.redirect(target);
    clearOAuthCookies(res);
    return res;
  } catch (error) {
    console.error("MercadoPago callback error:", error);
    const res = NextResponse.redirect(
      `${baseUrl}${defaultPaymentsPath}?mp_error=callback_failed`
    );
    clearOAuthCookies(res);
    return res;
  }
}
