// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to extract `tenantId` from the URL path `/plataforma/:tenantId/*`.
 * It adds the tenantId as a custom header `x-tenant-id` so that API routes
 * and server components can read it without parsing the URL again.
 * If the tenantId is missing, the request is redirected to the root page.
 */
export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // Store routes are completely excluded from this middleware
    // They handle their own authentication in app/store/layout.tsx
    // No need to check or process store routes here

    // Expected pattern: /plataforma/<tenantId>/...
    const match = pathname.match(/^\/plataforma\/([^\/]+)(\/.*)?$/);
    if (!match) {
        // No tenantId present – redirect to home (or a landing page)
        return NextResponse.redirect(new URL('/', request.url));
    }

    const tenantId = match[1];
    // Attach tenantId as a header for downstream handlers
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenantId);
    response.headers.set('x-pathname', pathname);
    return response;
}

/**
 * Apply middleware only to plataforma routes.
 * Store routes are completely excluded from middleware.
 */
export const config = {
    matcher: [
        '/plataforma/:tenantId/:path*',
    ],
};
