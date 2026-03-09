/**
 * Acceso a tenant_settings, tenant_payments y tenant_features en MySQL.
 * Reemplaza el uso de MongoDB para estos datos.
 */

import mysql from "@/lib/mysql";

// --- tenant_settings ---

export interface TenantSettingsRow {
  tenantId: string;
  settings: Record<string, unknown> | null;
  permissions: Record<string, Record<string, number>> | null;
  updatedAt: Date;
}

export async function getTenantSettingsRow(tenantId: string): Promise<TenantSettingsRow | null> {
  const [rows] = await mysql.execute(
    "SELECT tenantId, settings, permissions, updatedAt FROM tenant_settings WHERE tenantId = ?",
    [tenantId]
  );
  const arr = rows as { tenantId: string; settings: string | Record<string, unknown> | null; permissions: string | Record<string, Record<string, number>> | null; updatedAt: Date }[];
  if (arr.length === 0) return null;
  const r = arr[0];
  const parseSettings = (v: unknown): Record<string, unknown> | null =>
    v == null ? null : typeof v === "object" ? (v as Record<string, unknown>) : (JSON.parse(String(v)) as Record<string, unknown>);
  const parsePermissions = (v: unknown): Record<string, Record<string, number>> | null =>
    v == null ? null : typeof v === "object" ? (v as Record<string, Record<string, number>>) : (JSON.parse(String(v)) as Record<string, Record<string, number>>);
  return {
    tenantId: r.tenantId,
    settings: parseSettings(r.settings),
    permissions: parsePermissions(r.permissions),
    updatedAt: r.updatedAt,
  };
}

export async function upsertTenantSettings(
  tenantId: string,
  settings: Record<string, unknown>,
  permissions?: Record<string, Record<string, number>>
): Promise<void> {
  const settingsJson = JSON.stringify(settings);
  const permissionsJson = permissions !== undefined ? JSON.stringify(permissions) : null;
  await mysql.execute(
    `INSERT INTO tenant_settings (tenantId, settings, permissions, updatedAt)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE settings = VALUES(settings), permissions = COALESCE(VALUES(permissions), permissions), updatedAt = NOW()`,
    [tenantId, settingsJson, permissionsJson]
  );
}

export async function updateTenantSettingsOnly(tenantId: string, settings: Record<string, unknown>): Promise<void> {
  const settingsJson = JSON.stringify(settings);
  await mysql.execute(
    `INSERT INTO tenant_settings (tenantId, settings, updatedAt) VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE settings = VALUES(settings), updatedAt = NOW()`,
    [tenantId, settingsJson]
  );
}

export async function updateTenantPermissionsOnly(
  tenantId: string,
  permissions: Record<string, Record<string, number>>
): Promise<void> {
  const permissionsJson = JSON.stringify(permissions);
  await mysql.execute(
    `INSERT INTO tenant_settings (tenantId, permissions, updatedAt) VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE permissions = VALUES(permissions), updatedAt = NOW()`,
    [tenantId, permissionsJson]
  );
}

// --- tenant_payments ---

export async function getTenantPaymentsRow(tenantId: string): Promise<{ settings: Record<string, unknown> | null } | null> {
  const [rows] = await mysql.execute(
    "SELECT settings FROM tenant_payments WHERE tenantId = ?",
    [tenantId]
  );
  const arr = rows as { settings: string | Record<string, unknown> | null }[];
  if (arr.length === 0) return null;
  const r = arr[0];
  const v = r.settings;
  return {
    settings: v == null ? null : typeof v === "object" ? v : (JSON.parse(String(v)) as Record<string, unknown>),
  };
}

export async function upsertTenantPayments(tenantId: string, settings: Record<string, unknown>): Promise<void> {
  const settingsJson = JSON.stringify(settings);
  await mysql.execute(
    `INSERT INTO tenant_payments (tenantId, settings, updatedAt) VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE settings = VALUES(settings), updatedAt = NOW()`,
    [tenantId, settingsJson]
  );
}

// --- tenant_features ---

export interface TenantFeaturesRow {
  tenantId: string;
  features: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
  usage: Record<string, unknown> | null;
  updatedAt: Date;
}

export async function getTenantFeaturesRow(tenantId: string): Promise<TenantFeaturesRow | null> {
  const [rows] = await mysql.execute(
    "SELECT tenantId, features, limits, usage, updatedAt FROM tenant_features WHERE tenantId = ?",
    [tenantId]
  );
  const arr = rows as { tenantId: string; features: string | Record<string, unknown> | null; limits: string | Record<string, unknown> | null; usage: string | Record<string, unknown> | null; updatedAt: Date }[];
  if (arr.length === 0) return null;
  const r = arr[0];
  const parse = (v: unknown): Record<string, unknown> | null =>
    v == null ? null : typeof v === "object" ? (v as Record<string, unknown>) : (JSON.parse(String(v)) as Record<string, unknown>);
  return {
    tenantId: r.tenantId,
    features: parse(r.features),
    limits: parse(r.limits),
    usage: parse(r.usage),
    updatedAt: r.updatedAt,
  };
}

export async function upsertTenantFeatures(
  tenantId: string,
  data: {
    features?: Record<string, unknown>;
    limits?: Record<string, unknown>;
    usage?: Record<string, unknown>;
  }
): Promise<void> {
  const row = await getTenantFeaturesRow(tenantId);
  const features = data.features !== undefined ? data.features : (row?.features ?? {});
  const limits = data.limits !== undefined ? data.limits : (row?.limits ?? {});
  const usage = data.usage !== undefined ? data.usage : (row?.usage ?? {});
  await mysql.execute(
    `INSERT INTO tenant_features (tenantId, features, limits, usage, updatedAt) VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE features = VALUES(features), limits = VALUES(limits), usage = VALUES(usage), updatedAt = NOW()`,
    [tenantId, JSON.stringify(features), JSON.stringify(limits), JSON.stringify(usage)]
  );
}

/** Actualizar solo un subcampo de features (merge) para incrementos etc. */
export async function updateTenantFeaturesMerge(
  tenantId: string,
  updates: { features?: Record<string, unknown>; limits?: Record<string, unknown> }
): Promise<void> {
  const row = await getTenantFeaturesRow(tenantId);
  const features = { ...(row?.features ?? {}), ...(updates.features ?? {}) };
  const limits = { ...(row?.limits ?? {}), ...(updates.limits ?? {}) };
  await mysql.execute(
    `INSERT INTO tenant_features (tenantId, features, limits, updatedAt) VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE features = VALUES(features), limits = VALUES(limits), updatedAt = NOW()`,
    [tenantId, JSON.stringify(features), JSON.stringify(limits)]
  );
}
