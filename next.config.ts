import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/pwa", destination: "/plataforma/pwa", permanent: false }];
  },
  output: "standalone",
  outputFileTracingIncludes: {
    "/**": ["./docs/**/*"],
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://www.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: https://accounts.google.com https://www.googleapis.com https://*.mercadopago.com https://api.mercadopago.com",
              "frame-src 'self' https://accounts.google.com https://www.gstatic.com https://*.mercadopago.com https://www.google.com",
              "worker-src 'self'",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;