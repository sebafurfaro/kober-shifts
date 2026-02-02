import { NextResponse } from "next/server";
import { getGoogleAuthUrlForStore } from "@/lib/googleOAuth";

// redirect_uri debe coincidir EXACTAMENTE con una URI en Google Cloud Console > Credenciales > URI de redirección.
// Prioridad: GOOGLE_STORE_REDIRECT_URI (recomendado) > NEXTAUTH_URL + path.
function getStoreRedirectUri(req: Request): string {
  const explicit = process.env.GOOGLE_STORE_REDIRECT_URI?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  return `${base}/api/store/auth/google/callback`;
}

export async function GET(req: Request) {
  try {
    const redirectUri = getStoreRedirectUri(req);
    const state = Buffer.from(JSON.stringify({ type: "store" })).toString("base64");

    const authUrl = getGoogleAuthUrlForStore(state, redirectUri);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Store Google auth start error:", error);
    return NextResponse.redirect(new URL("/store/login?error=config", req.url));
  }
}
