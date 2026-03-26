import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PWA_SESSION_COOKIE,
  PWA_SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE,
  getSessionCookieOptions,
} from "@/lib/session-cookies";

function withPwaSessionRenewal(req: NextRequest, res: NextResponse): NextResponse {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const isPwaSession = req.cookies.get(PWA_SESSION_COOKIE)?.value === "1";
  if (!sessionToken || !isPwaSession) return res;
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    ...getSessionCookieOptions({ persistent: true }),
  });
  res.cookies.set(PWA_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PWA_SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

/**
 * Proxy (antes middleware): Edge-safe. No importar módulos con `node:crypto`.
 *
 * - `/api/plataforma/:tenantId/*` y `/plataforma/:tenantId/*`: headers `x-tenant-id` + renovación PWA.
 * - `/plataforma` sin tenant: redirect a `/` (comportamiento previo).
 * - Renovación de sesión PWA en rutas coincidentes.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const apiMatch = pathname.match(/^\/api\/plataforma\/([^/]+)(\/.*)?$/);
  if (apiMatch) {
    const res = NextResponse.next();
    withPwaSessionRenewal(request, res);
    res.headers.set("x-tenant-id", apiMatch[1]);
    res.headers.set("x-pathname", pathname);
    return res;
  }

  const pageMatch = pathname.match(/^\/plataforma\/([^/]+)(\/.*)?$/);
  if (pageMatch) {
    const res = NextResponse.next();
    withPwaSessionRenewal(request, res);
    res.headers.set("x-tenant-id", pageMatch[1]);
    res.headers.set("x-pathname", pathname);
    return res;
  }

  if (pathname.startsWith("/plataforma")) {
    const res = NextResponse.redirect(new URL("/", request.url));
    return withPwaSessionRenewal(request, res);
  }

  return withPwaSessionRenewal(request, NextResponse.next());
}

export const config = {
  matcher: ["/plataforma/:path*", "/api/plataforma/:path*"],
};
