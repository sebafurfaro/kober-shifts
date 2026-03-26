/**
 * Solo nombres y opciones de cookies (sin crypto).
 * Importable desde Edge (proxy); no importar aquí `lib/auth`.
 */
export const SESSION_COOKIE = "ks_session";
export const PWA_SESSION_COOKIE = "ks_pwa";
export const PWA_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 días

export function getSessionCookieOptions(opts?: { persistent?: boolean }) {
  const persistent = opts?.persistent === true;
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(persistent ? { maxAge: PWA_SESSION_MAX_AGE_SECONDS } : {}),
  };
}
