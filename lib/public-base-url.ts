/**
 * URL base pública para OAuth redirect_uri y redirects post-login.
 * Debe ser idéntica en authorize y callback; si no hay APP_URL, usar headers (Vercel/proxy).
 */
function inferProto(req: Request, host: string | null): string {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "https";
  }
  const h = (host ?? "").toLowerCase();
  // Sin proxy (ej. `next dev`), no hay x-forwarded-proto: localhost debe ser http, no https por defecto.
  if (h.startsWith("localhost") || h.startsWith("127.0.0.1")) {
    return "http";
  }
  return "https";
}

export function getPublicBaseUrl(req: Request): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = inferProto(req, host);
  if (host) {
    return `${proto}://${host}`;
  }
  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

const MP_CALLBACK_PATH = "/api/integrations/mercadopago/callback";

/**
 * Base pública para OAuth Mercado Pago y redirects posteriores al callback.
 * Debe coincidir **exactamente** con el dominio registrado en MP Developers.
 *
 * Prioridad: `MERCADOPAGO_OAUTH_BASE_URL` (recomendado en producción si hay dudas
 * entre www / apex o proxy) → `APP_URL` → inferido del request.
 */
export function getMercadoPagoOAuthBaseUrl(req: Request): string {
  const explicit =
    process.env.MERCADOPAGO_OAUTH_BASE_URL?.trim() || process.env.APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  return getPublicBaseUrl(req);
}

/** Ruta absoluta del redirect_uri que MP valida en el intercambio de token. */
export function getMercadoPagoOAuthRedirectUri(req: Request): string {
  return `${getMercadoPagoOAuthBaseUrl(req)}${MP_CALLBACK_PATH}`;
}

/**
 * Valida que un redirect_uri guardado en cookie sea seguro y apunte al callback OAuth.
 */
export function isSafeMercadoPagoRedirectUriCookie(value: string | undefined): value is string {
  if (!value || value.length > 512 || value.includes("..")) return false;
  try {
    const u = new URL(value);
    if (u.pathname.replace(/\/$/, "") !== MP_CALLBACK_PATH) return false;
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Evita open redirects al volver del OAuth. */
export function isSafeMercadoPagoReturnPath(path: string, tenantId: string): boolean {
  if (!path.startsWith("/") || path.includes("..")) return false;
  return path.startsWith(`/plataforma/${tenantId}/`);
}
