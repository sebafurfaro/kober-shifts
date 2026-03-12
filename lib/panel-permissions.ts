/**
 * Permisos del panel por sección y rol. Usado en la página Roles y en el Aside para ocultar/mostrar ítems.
 */
export type RoleKey = "ADMIN" | "PROFESSIONAL" | "SUPERVISOR";

export const DEFAULT_PERMISSIONS: Record<string, Record<RoleKey, number>> = {
  analytics: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 1 },
  turnosProfessional: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  patients: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 1 },
  servicios: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  admin: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 0 },
  pagos: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 1 },
  turnos: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  locations: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  coberturas: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
  collaborators: { ADMIN: 1, PROFESSIONAL: 0, SUPERVISOR: 0 },
  profesionales: { ADMIN: 1, PROFESSIONAL: 1, SUPERVISOR: 1 },
};

export type PermissionsMap = Record<string, Record<string, number>>;

/** Claves de la matriz de permisos (secciones). */
export type PermKey = keyof typeof DEFAULT_PERMISSIONS;

/**
 * Indica si el rol tiene permiso para la sección. Si permissions no está cargado, usa defaults.
 * Solo usar con role ADMIN, PROFESSIONAL o SUPERVISOR.
 */
export function canAccess(
  permissions: PermissionsMap | null | undefined,
  role: string,
  permKey: PermKey
): boolean {
  const roleKey = role as RoleKey;
  if (roleKey !== "ADMIN" && roleKey !== "PROFESSIONAL" && roleKey !== "SUPERVISOR") {
    return false;
  }
  const perms = permissions && typeof permissions === "object" ? permissions : {};
  const row = perms[permKey] ?? DEFAULT_PERMISSIONS[permKey];
  const value = row?.[roleKey];
  return value === 1;
}
