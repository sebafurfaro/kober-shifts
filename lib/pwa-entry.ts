/** Clave localStorage: último tenant desde el que el usuario usó la plataforma (PWA deep link). */
export const PWA_STORAGE_TENANT_KEY = "kober_pwa_tenant_id";

export function savePwaInstallTenantId(tenantId: string): void {
  if (typeof window === "undefined" || !tenantId) return;
  try {
    localStorage.setItem(PWA_STORAGE_TENANT_KEY, tenantId.trim());
  } catch {
    // private mode / quota
  }
}

export function isValidPwaTenantIdSegment(id: string): boolean {
  if (!id || id.length > 255) return false;
  return /^[a-zA-Z0-9_.-]+$/.test(id);
}
