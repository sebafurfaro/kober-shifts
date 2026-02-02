import { NextResponse } from "next/server";

/**
 * GET /api/store/auth/google/redirect-uri
 * Devuelve el redirect_uri que usa el store. Agregá esta URI EXACTA en Google Cloud Console.
 */
export async function GET(req: Request) {
  const explicit = process.env.GOOGLE_STORE_REDIRECT_URI?.trim();
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const redirectUri = explicit
    ? explicit.replace(/\/$/, "")
    : `${base}/api/store/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID || "(no configurado)";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirect URI para Store</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem;">
  <h1>Error 400: redirect_uri_mismatch</h1>
  <p>Agregá la siguiente URI en <strong>Google Cloud Console</strong>:</p>
  <p>APIs y servicios → Credenciales → <strong>el cliente con este Client ID</strong> → URI de redirección autorizados → AGREGAR URI</p>
  <p style="font-size:12px;color:#666;word-break:break-all;">Client ID: ${clientId}</p>
  <p><strong>URI a copiar (exacta, sin espacio ni barra final):</strong></p>
  <input type="text" value="${redirectUri.replace(/"/g, "&quot;")}" id="uri" readonly style="width:100%;padding:0.5rem;font-size:14px;box-sizing:border-box;" />
  <p><button onclick="navigator.clipboard.writeText(document.getElementById('uri').value);this.textContent='Copiado';">Copiar</button></p>
  <p style="color:#666;font-size:14px;">Después de agregar la URI, guardá y esperá 1–2 minutos antes de probar de nuevo.</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
