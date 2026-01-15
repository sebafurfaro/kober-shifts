import crypto from "node:crypto";
import type { Role } from "./types";

const SECRET =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV !== "production" ? "change_me_dev_only" : undefined);
if (!SECRET) throw new Error("Missing AUTH_SECRET");

export type SessionPayload = {
  userId: string;
  role: Role;
};

function base64url(input: Buffer) {
  return input
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sign(data: string) {
  return base64url(crypto.createHmac("sha256", SECRET).update(data).digest());
}

export function createSessionToken(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const body = base64url(Buffer.from(json, "utf8"));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (sign(body) !== sig) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64").toString("utf8")) as SessionPayload;
    if (!parsed?.userId || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(expected, actual);
}


