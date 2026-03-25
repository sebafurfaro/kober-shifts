import { randomUUID } from "crypto";
import type { PushSubscription } from "web-push";
import mysql from "@/lib/mysql";

let ensured = false;

/** Idempotente: crea la tabla si no existe (útil en dev; en producción preferir migración SQL). */
export async function ensurePushSubscriptionsTable(): Promise<void> {
  if (ensured) return;
  await mysql.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id VARCHAR(36) NOT NULL,
      tenantId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh VARCHAR(255) NOT NULL,
      auth VARCHAR(255) NOT NULL,
      expirationTime BIGINT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_push_tenant_user (tenantId, userId),
      KEY idx_push_tenant (tenantId),
      KEY idx_push_user (userId),
      CONSTRAINT fk_push_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE,
      CONSTRAINT fk_push_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  ensured = true;
}

export async function upsertPushSubscription(
  tenantId: string,
  userId: string,
  sub: PushSubscription
): Promise<void> {
  await ensurePushSubscriptionsTable();
  const id = randomUUID();
  const exp =
    sub.expirationTime !== undefined && sub.expirationTime !== null
      ? Number(sub.expirationTime)
      : null;
  await mysql.execute(
    `INSERT INTO push_subscriptions (id, tenantId, userId, endpoint, p256dh, auth, expirationTime)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       endpoint = VALUES(endpoint),
       p256dh = VALUES(p256dh),
       auth = VALUES(auth),
       expirationTime = VALUES(expirationTime),
       updatedAt = CURRENT_TIMESTAMP`,
    [id, tenantId, userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, exp]
  );
}

export async function getPushSubscriptionForUser(
  tenantId: string,
  userId: string
): Promise<PushSubscription | null> {
  await ensurePushSubscriptionsTable();
  const [rows] = await mysql.execute(
    `SELECT endpoint, p256dh, auth, expirationTime FROM push_subscriptions
     WHERE tenantId = ? AND userId = ? LIMIT 1`,
    [tenantId, userId]
  );
  const list = rows as Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
    expirationTime: number | null;
  }>;
  if (list.length === 0) return null;
  const r = list[0];
  return {
    endpoint: r.endpoint,
    keys: { p256dh: r.p256dh, auth: r.auth },
    ...(r.expirationTime != null ? { expirationTime: Number(r.expirationTime) } : {}),
  };
}
