import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PLAIN_PREFIX = "plain:";

function getEncryptionKey(): Buffer | null {
  const raw = process.env.MERCADOPAGO_TOKEN_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) return null;
  return crypto.createHash("sha256").update(raw.slice(0, 64)).digest();
}

export function encryptToken(plain: string): string {
  const key = getEncryptionKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MERCADOPAGO_TOKEN_ENCRYPTION_KEY is required in production");
    }
    return PLAIN_PREFIX + Buffer.from(plain, "utf8").toString("base64");
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(encrypted: string): string {
  if (encrypted.startsWith(PLAIN_PREFIX)) {
    return Buffer.from(encrypted.slice(PLAIN_PREFIX.length), "base64").toString("utf8");
  }
  const key = getEncryptionKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MERCADOPAGO_TOKEN_ENCRYPTION_KEY is required in production");
    }
    throw new Error("Cannot decrypt: no encryption key set");
  }
  const buf = Buffer.from(encrypted, "base64");
  if (buf.length < IV_LENGTH + TAG_LENGTH) throw new Error("Invalid encrypted payload");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}
