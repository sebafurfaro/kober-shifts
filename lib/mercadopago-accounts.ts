import mysql from "./mysql";
import { encryptToken, decryptToken } from "./mercadopago-encrypt";
import { randomUUID } from "crypto";

const TABLE = "mercadopago_accounts";
const MP_OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

export interface MercadoPagoAccount {
  id: string;
  tenantId: string;
  mpUserId: string | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

async function ensureTable() {
  await mysql.execute(`
    CREATE TABLE IF NOT EXISTS mercadopago_accounts (
      id VARCHAR(36) PRIMARY KEY,
      tenantId VARCHAR(255) NOT NULL,
      mpUserId VARCHAR(255),
      accessTokenEncrypted TEXT NOT NULL,
      refreshTokenEncrypted TEXT NOT NULL,
      expiresAt DATETIME,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_mercadopago_accounts_tenant (tenantId),
      INDEX idx_mercadopago_tenant (tenantId)
    )
  `);
}

function rowToAccount(row: any): MercadoPagoAccount {
  let accessToken = "";
  let refreshToken = "";
  try {
    accessToken = decryptToken(row.accessTokenEncrypted);
    refreshToken = decryptToken(row.refreshTokenEncrypted);
  } catch {
    // If decryption fails (e.g. key changed), return placeholder so caller can force re-link
  }
  return {
    id: row.id,
    tenantId: row.tenantId,
    mpUserId: row.mpUserId ?? null,
    accessToken,
    refreshToken,
    expiresAt: row.expiresAt ?? null,
    status: row.status ?? "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getMercadoPagoAccountByTenant(
  tenantId: string
): Promise<MercadoPagoAccount | null> {
  await ensureTable();
  const [rows] = await mysql.execute(
    "SELECT * FROM mercadopago_accounts WHERE tenantId = ? AND status = 'active'",
    [tenantId]
  );
  const arr = rows as any[];
  if (arr.length === 0) return null;
  const row = arr[0];
  try {
    return rowToAccount(row);
  } catch {
    return null;
  }
}

export async function getMercadoPagoAccountWithRefresh(
  tenantId: string
): Promise<MercadoPagoAccount | null> {
  const account = await getMercadoPagoAccountByTenant(tenantId);
  if (!account) return null;
  if (!account.expiresAt) return account;
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  if (!clientId || !clientSecret) return account;
  const now = Date.now();
  if (account.expiresAt.getTime() - now > 60 * 1000) return account;
  try {
    const refreshPayload = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token" as const,
      refresh_token: account.refreshToken,
    };
    let tokenRes = await fetch(MP_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshPayload),
    });
    if (!tokenRes.ok) {
      const formBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: account.refreshToken,
      });
      tokenRes = await fetch(MP_OAUTH_TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });
    }
    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("MercadoPago refresh token error:", tokenRes.status, errBody);
      return account;
    }
    const data = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      user_id?: number;
    };
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;
    const updated = await upsertMercadoPagoAccount({
      tenantId,
      mpUserId: data.user_id ?? account.mpUserId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || account.refreshToken,
      expiresAt,
    });
    return updated;
  } catch (error) {
    console.error("MercadoPago refresh token exception:", error);
    return account;
  }
}

export async function upsertMercadoPagoAccount(params: {
  tenantId: string;
  mpUserId: number | string | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
}): Promise<MercadoPagoAccount> {
  await ensureTable();
  const accessEnc = encryptToken(params.accessToken);
  const refreshEnc = encryptToken(params.refreshToken);
  const mpUserId = params.mpUserId != null ? String(params.mpUserId) : null;

  const [existing] = await mysql.execute(
    "SELECT id FROM mercadopago_accounts WHERE tenantId = ?",
    [params.tenantId]
  );
  const existingRows = existing as any[];

  if (existingRows.length > 0) {
    await mysql.execute(
      `UPDATE mercadopago_accounts SET
         mpUserId = ?, accessTokenEncrypted = ?, refreshTokenEncrypted = ?, expiresAt = ?, status = 'active'
       WHERE tenantId = ?`,
      [mpUserId, accessEnc, refreshEnc, params.expiresAt, params.tenantId]
    );
  } else {
    await mysql.execute(
      `INSERT INTO mercadopago_accounts
         (id, tenantId, mpUserId, accessTokenEncrypted, refreshTokenEncrypted, expiresAt, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [randomUUID(), params.tenantId, mpUserId, accessEnc, refreshEnc, params.expiresAt]
    );
  }

  const [rows] = await mysql.execute("SELECT * FROM mercadopago_accounts WHERE tenantId = ?", [
    params.tenantId,
  ]);
  const arr = rows as any[];
  if (arr.length === 0) throw new Error("Failed to read back mercadopago_account");
  return rowToAccount(arr[0]);
}

export async function hasMercadoPagoAccount(tenantId: string): Promise<boolean> {
  await ensureTable();
  const [rows] = await mysql.execute(
    "SELECT 1 FROM mercadopago_accounts WHERE tenantId = ? AND status = 'active'",
    [tenantId]
  );
  return (rows as any[]).length > 0;
}

export async function deactivateMercadoPagoAccount(tenantId: string): Promise<void> {
  await ensureTable();
  await mysql.execute(
    "UPDATE mercadopago_accounts SET status = 'inactive' WHERE tenantId = ?",
    [tenantId]
  );
}
