/**
 * Email del usuario con rol ADMIN de soporte. Es el único que puede tener rol ADMIN.
 * No cuenta dentro del límite de usuarios del tenant.
 */
export const SUPPORT_ADMIN_EMAIL = "seba.furfaro@gmail.com";

export function isSupportAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase().trim() === SUPPORT_ADMIN_EMAIL;
}
