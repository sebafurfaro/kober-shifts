import { getTenantSettingsRow, updateTenantPermissionsOnly } from "@/lib/settings-db";

/**
 * Permisos por permiso y rol. Guardado en MySQL tenant_settings.permissions.
 */
export async function getPermissions(tenantId: string): Promise<Record<string, Record<string, number>>> {
  try {
    const row = await getTenantSettingsRow(tenantId);
    const permissions = row?.permissions;
    if (permissions && typeof permissions === "object" && !Array.isArray(permissions)) {
      return permissions;
    }
    return {};
  } catch (error) {
    console.error("[permissions-store] getPermissions error:", error);
    return {};
  }
}

export async function setPermissions(
  tenantId: string,
  permissions: Record<string, Record<string, number>>
): Promise<void> {
  await updateTenantPermissionsOnly(tenantId, permissions);
}
