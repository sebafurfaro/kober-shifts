import type { Role } from "@/lib/types";
import { canAccess, type PermissionsMap, type PermKey } from "@/lib/panel-permissions";

/** Claves alineadas con ítems del Aside que pueden duplicarse en la barra móvil. */
export type AsideNavKey =
  | "analytics"
  | "calendar"
  | "professional"
  | "servicios"
  | "patients"
  | "admin"
  | "pagos"
  | "turnos"
  | "locations"
  | "coberturas"
  | "collaborators"
  | "roles"
  | "profesionales"
  | "patient-mis-turnos"
  | "patient-mis-datos"
  | "documentation";

export type MobileNavLinkItem = {
  kind: "link";
  key: AsideNavKey;
  href: string;
  label: string;
  exact?: boolean;
};

export type MobileNavMenuItem = { kind: "menu"; key: "menu" };

export type MobileNavEntry = MobileNavLinkItem | MobileNavMenuItem;

interface TenantFeatures {
  show_pagos?: boolean;
  show_servicios?: boolean;
  show_coverage?: boolean;
  show_mercado_pago?: boolean;
  calendar?: boolean;
  payment_enabled?: boolean;
}

interface PacientesItemConfig {
  label: string;
  href: string;
}

/**
 * Misma visibilidad que Aside (staff): hasta 4 enlaces en orden de prioridad + menú central que abre el drawer.
 * No se rellenan huecos con otras secciones si falta un ítem.
 */
export function buildPanelMobileNav(args: {
  role: Role;
  currentTenantId: string;
  calendarEnabled: boolean;
  pacientesItem: PacientesItemConfig;
  permissions: PermissionsMap | null | undefined;
  features: TenantFeatures | null | undefined;
  hasProfessionalProfile?: boolean;
}): { entries: MobileNavEntry[]; asideKeysToHide: Set<AsideNavKey> } {
  const {
    role,
    calendarEnabled,
    pacientesItem,
    permissions,
    features,
    hasProfessionalProfile,
  } = args;
  const base = `/plataforma/${args.currentTenantId}/panel`;
  const can = (permKey: PermKey) => canAccess(permissions ?? null, role, permKey);
  const isStaff = role === "ADMIN" || role === "PROFESSIONAL" || role === "SUPERVISOR";

  const asideKeysToHide = new Set<AsideNavKey>();

  if (role === "PATIENT") {
    const entries: MobileNavEntry[] = [
      {
        kind: "link",
        key: "patient-mis-turnos",
        href: `${base}/patient`,
        label: "Mis turnos",
        exact: true,
      },
      {
        kind: "link",
        key: "patient-mis-datos",
        href: `${base}/patient/mis-datos`,
        label: "Mis datos",
      },
      { kind: "menu", key: "menu" },
    ];
    asideKeysToHide.add("patient-mis-turnos");
    asideKeysToHide.add("patient-mis-datos");
    return { entries, asideKeysToHide };
  }

  const linkCandidates: MobileNavLinkItem[] = [];

  if (can("analytics")) {
    linkCandidates.push({
      kind: "link",
      key: "analytics",
      href: `${base}/analytics`,
      label: "Analíticas",
    });
  }
  if (calendarEnabled) {
    linkCandidates.push({
      kind: "link",
      key: "calendar",
      href: base,
      label: "Calendario",
      exact: true,
    });
  }
  if (isStaff && can("turnosProfessional") && (role === "PROFESSIONAL" || hasProfessionalProfile)) {
    linkCandidates.push({
      kind: "link",
      key: "professional",
      href: `${base}/professional`,
      label: "Mis turnos",
    });
  }
  if (isStaff && can("patients")) {
    linkCandidates.push({
      kind: "link",
      key: "patients",
      href: pacientesItem.href,
      label: pacientesItem.label,
    });
  }
  if (isStaff && can("admin")) {
    linkCandidates.push({
      kind: "link",
      key: "admin",
      href: `${base}/admin`,
      label: "Admin",
      exact: true,
    });
  }

  const links = linkCandidates.slice(0, 4);
  links.forEach((l) => asideKeysToHide.add(l.key));

  const entries = insertMenuCenter(links);
  return { entries, asideKeysToHide };
}

function insertMenuCenter(links: MobileNavLinkItem[]): MobileNavEntry[] {
  const menu: MobileNavMenuItem = { kind: "menu", key: "menu" };
  if (links.length === 0) return [menu];
  if (links.length === 1) return [links[0], menu];
  if (links.length === 2) return [links[0], menu, links[1]];
  if (links.length === 3) return [links[0], links[1], menu, links[2]];
  return [links[0], links[1], menu, links[2], links[3]];
}
