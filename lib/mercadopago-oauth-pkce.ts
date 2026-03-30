import crypto from "crypto";

/** RFC 7636: code_verifier y code_challenge (S256) para OAuth con PKCE en Mercado Pago. */

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateMercadoPagoPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64Url(crypto.randomBytes(32));
  const codeChallenge = base64Url(
    crypto.createHash("sha256").update(codeVerifier, "utf8").digest()
  );
  return { codeVerifier, codeChallenge };
}
