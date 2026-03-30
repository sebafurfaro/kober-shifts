/** Intercambio de código OAuth con la API de Mercado Pago (misma URL que el SDK). */

const MP_OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

export type MercadoPagoOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user_id?: number;
};

/**
 * Mercado Pago acepta JSON (como el SDK) o application/x-www-form-urlencoded.
 * Probamos JSON primero y luego form, para maximizar compatibilidad.
 */
export async function exchangeAuthorizationCodeForTokens(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  /** Obligatorio si en MP Developers activaste OAuth con PKCE. */
  codeVerifier?: string;
}): Promise<MercadoPagoOAuthTokenResponse> {
  const bodyJson: Record<string, string> = {
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
  };
  if (params.codeVerifier) {
    bodyJson.code_verifier = params.codeVerifier;
  }

  const jsonRes = await fetch(MP_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyJson),
  });

  if (jsonRes.ok) {
    return (await jsonRes.json()) as MercadoPagoOAuthTokenResponse;
  }

  const jsonErr = await jsonRes.text();
  console.error("MercadoPago OAuth token (JSON):", jsonRes.status, jsonErr);

  const form = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
  });
  if (params.codeVerifier) {
    form.set("code_verifier", params.codeVerifier);
  }

  const formRes = await fetch(MP_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!formRes.ok) {
    const formErr = await formRes.text();
    console.error("MercadoPago OAuth token (form):", formRes.status, formErr);
    throw new Error(
      `MercadoPago oauth/token falló: JSON ${jsonRes.status} ${jsonErr.slice(0, 500)} | form ${formRes.status} ${formErr.slice(0, 500)}`
    );
  }

  return (await formRes.json()) as MercadoPagoOAuthTokenResponse;
}
