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

/** Evita open redirects al volver del OAuth. */
export function isSafeMercadoPagoReturnPath(path: string, tenantId: string): boolean {
  if (!path.startsWith("/") || path.includes("..")) return false;
  return path.startsWith(`/plataforma/${tenantId}/`);
}
