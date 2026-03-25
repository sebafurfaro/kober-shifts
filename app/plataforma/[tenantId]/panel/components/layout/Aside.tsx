"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  User,
  CalendarDays,
  Settings,
  BarChart3,
  CircleDollarSign,
  Menu,
  ChevronLeft,
  LayoutGrid,
  BookOpen,
  UserIcon,
  CalendarCheck2,
  Download,
} from "lucide-react";
import { Alert, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Button } from "@heroui/react";
import Logo from "@/app/branding/Logo";
import { Dispatch, SetStateAction } from "react";
import type { Role } from "@/lib/types";
import { canAccess, type PermissionsMap, type PermKey } from "@/lib/panel-permissions";
import { savePwaInstallTenantId } from "@/lib/pwa-entry";

const DRAWER_WIDTH = 210;
const DRAWER_COLLAPSED_WIDTH = 64;

/** Evento no estándar para instalación PWA (Chrome, Edge, etc.). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  onNavigate?: () => void;
  pathname: string;
  /** Si true, solo activo en coincidencia exacta. Usar para rutas raíz como /panel o /admin. */
  exact?: boolean;
}

function NavItem({ href, label, icon, isCollapsed, onNavigate, pathname, exact }: NavItemProps) {
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 py-3 transition-all duration-200 ease-in-out rounded-md font-primary
        ${isCollapsed ? "justify-center px-2" : "px-4"}
        ${isActive
          ? "bg-[#0288D1]/15 text-[#0288D1] font-semibold"
          : "text-slate-800 hover:bg-[#0288D1]/10"
        }`}
      title={isCollapsed ? label : undefined}
    >
      <span className={`w-5 h-5 shrink-0 ${isActive ? "text-[#0288D1]" : ""}`}>{icon}</span>
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

function SectionTitle({ label, isCollapsed }: { label: string; isCollapsed: boolean }) {
  if (isCollapsed) return null;
  return (
    <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
  );
}

/** PWA: diálogo nativo si hay `beforeinstallprompt`; si no, modal con instrucciones (p. ej. Safari / iOS). */
function DownloadAppButton({
  tenantId,
  isCollapsed,
  onNavigate,
}: {
  tenantId: string;
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [iosHelpOpen, setIosHelpOpen] = React.useState(false);
  const [hiddenStandalone, setHiddenStandalone] = React.useState(false);

  React.useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setHiddenStandalone(standalone);
  }, []);

  React.useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (hiddenStandalone) return null;

  const handleClick = async () => {
    savePwaInstallTenantId(tenantId);
    onNavigate?.();
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }
    setIosHelpOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full items-center gap-3 py-3 transition-all duration-200 ease-in-out rounded-md font-primary text-left
          ${isCollapsed ? "justify-center px-2" : "px-4"}
          text-slate-800 hover:bg-[#0288D1]/10`}
        title={isCollapsed ? "Instalar App" : undefined}
        aria-label="Instalar App"
      >
        <span className="w-5 h-5 shrink-0 text-[#0288D1]">
          <Download className="w-5 h-5" />
        </span>
        {!isCollapsed && <span className="text-sm font-medium">Installar App</span>}
      </button>

      <Modal isOpen={iosHelpOpen} onOpenChange={setIosHelpOpen} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Instalar la app</ModalHeader>
          <ModalBody className="text-sm text-slate-600 pb-2 space-y-3">
            <p>
              En <strong>iPhone o iPad</strong>: tocá Compartir{" "}
              <span className="whitespace-nowrap">(cuadrado con flecha)</span> y elegí{" "}
              <strong>Añadir a inicio</strong>.
            </p>
            <p>
              En <strong>Windows / Mac con Chrome o Edge</strong>: menú{" "}
              <span className="whitespace-nowrap">(⋮ tres puntos)</span> junto a la barra de direcciones →{" "}
              <strong>Instalar aplicación…</strong> o <strong>Instalar Turnos Nodo</strong>. Si no aparece,
              recargá la página una vez tras entrar al sitio (hace falta HTTPS en producción).
            </p>
            <p className="text-xs text-slate-500">
              Firefox y Safari en escritorio tienen soporte limitado para instalar PWAs; probá Chrome o Edge.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" variant="flat" onPress={() => setIosHelpOpen(false)}>
              Entendido
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

interface NavItemConfig {
  label: string;
  href: string;
  icon: React.ReactNode;
  show?: boolean;
}

interface TenantFeatures {
  show_pagos?: boolean;
  show_servicios?: boolean;
  show_coverage?: boolean;
  show_mercado_pago?: boolean;
  calendar?: boolean;
  payment_enabled?: boolean;
}

interface AsideProps {
  role: Role;
  currentTenantId: string;
  isMobile: boolean;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: Dispatch<SetStateAction<boolean>>;
  calendarEnabled: boolean;
  gestionItems: NavItemConfig[];
  colaboradoresItems: NavItemConfig[];
  pacientesItem: NavItemConfig;
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
  onWidthChange: (width: number) => void;
  /** Si se pasa, evita una segunda llamada a /features (viene del shell). */
  usage?: { used: number; max: number } | null;
  /** Matriz de permisos por sección y rol. Si no está cargada, se usan los defaults (staff ve según su rol). */
  permissions?: PermissionsMap | null;
  /** Feature flags del tenant */
  features?: TenantFeatures | null;
  /** Si el usuario logueado tiene un professional_profile (puede ser ADMIN con perfil). */
  hasProfessionalProfile?: boolean;
}

export function Aside({
  role,
  currentTenantId,
  isMobile,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  calendarEnabled,
  gestionItems,
  colaboradoresItems,
  pacientesItem,
  isCollapsed,
  setIsCollapsed,
  onWidthChange,
  usage: usageFromProp,
  permissions,
  features,
  hasProfessionalProfile,
}: AsideProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isManuallyToggled, setIsManuallyToggled] = React.useState(false);
  const [usageLocal, setUsageLocal] = React.useState<{ used: number; max: number } | null>(null);
  const [transitionReady, setTransitionReady] = React.useState(false);
  const can = (permKey: PermKey) => canAccess(permissions ?? null, role, permKey);
  const pathname = usePathname();

  const handleNavClick = isMobile ? () => setMobileDrawerOpen(false) : undefined;

  React.useEffect(() => {
    setTransitionReady(true);
  }, []);

  React.useEffect(() => {
    if (usageFromProp !== undefined || !currentTenantId || role === "PATIENT") return;
    let cancelled = false;
    fetch(`/api/plataforma/${currentTenantId}/features`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const used = typeof data.usedUsers === "number" ? data.usedUsers : 0;
        const max = typeof data.maxUsers === "number" ? data.maxUsers : 0;
        setUsageLocal({ used, max });
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [currentTenantId, role, usageFromProp]);

  const usage = usageFromProp !== undefined ? usageFromProp : usageLocal;

  const currentWidth = React.useMemo(() => {
    if (isMobile) return DRAWER_WIDTH;
    if (isCollapsed && !isHovered) return DRAWER_COLLAPSED_WIDTH;
    return DRAWER_WIDTH;
  }, [isMobile, isCollapsed, isHovered]);

  React.useEffect(() => {
    onWidthChange(currentWidth);
  }, [currentWidth, onWidthChange]);

  const handleToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    setIsManuallyToggled(newCollapsedState);
  };

  const handleMouseEnter = () => {
    if (isCollapsed && !isManuallyToggled) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isCollapsed && !isManuallyToggled) setIsHovered(false);
  };

  const effectiveIsCollapsed = isCollapsed && !isHovered;
  const isStaff = role === "ADMIN" || role === "PROFESSIONAL" || role === "SUPERVISOR";
  const base = `/plataforma/${currentTenantId}/panel`;

  // Helper function to check if a service is enabled
  const isFeatureEnabled = (featureName: keyof TenantFeatures): boolean => {
    return features ? (features[featureName] ?? true) : true;
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white text-slate-900 z-49 transition-transform duration-300 ${mobileDrawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      style={{ width: `${currentWidth}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="overflow-y-auto h-full py-4">
        {/* Logo and Toggle */}
        <div
          className={`flex mb-4 pb-4 border-b border-slate-200 ${effectiveIsCollapsed ? "flex-col items-center px-2 gap-2" : "items-center justify-between px-4"
            }`}
        >
          {!effectiveIsCollapsed && (
            <div className="flex items-center gap-2">
              <Logo width={32} height={32} />
              <span className="text-lg font-bold text-[#0e5287]">NODO App</span>
            </div>
          )}
          {effectiveIsCollapsed && <Logo width={32} height={32} />}
          {!isMobile && (
            <button
              onClick={handleToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              aria-label={effectiveIsCollapsed ? "Expand menu" : "Collapse menu"}
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform duration-300 ${effectiveIsCollapsed ? "rotate-180" : ""
                  }`}
              />
            </button>
          )}
          {isMobile && !effectiveIsCollapsed && (
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              aria-label="Close menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1 px-2">
          <DownloadAppButton
            tenantId={currentTenantId}
            isCollapsed={effectiveIsCollapsed}
            onNavigate={handleNavClick}
          />

          {/* Métricas */}
          {role !== "PATIENT" && can("analytics") && (
            <>
              <SectionTitle label="Métricas" isCollapsed={effectiveIsCollapsed} />
              <NavItem
                href={`${base}/analytics`}
                label="Analíticas"
                icon={<BarChart3 className="w-5 h-5" />}
                isCollapsed={effectiveIsCollapsed}
                onNavigate={handleNavClick}
                pathname={pathname}
              />
            </>
          )}

          {/* Recursos: Calendario, Turnos Profesional, Servicios, Clientes */}
          {role !== "PATIENT" && (calendarEnabled || can("turnosProfessional") || (can("servicios") && isFeatureEnabled("show_servicios")) || can("patients")) ? (
            <SectionTitle label="Recursos" isCollapsed={effectiveIsCollapsed} />
          ) : null}
          {role !== "PATIENT" && calendarEnabled && (
            <NavItem
              href={base}
              label="Calendario"
              icon={<Calendar className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
              onNavigate={handleNavClick}
              pathname={pathname}
              exact
            />
          )}
          {isStaff && can("turnosProfessional") && (role === "PROFESSIONAL" || hasProfessionalProfile) && (
            <NavItem
              href={`${base}/professional`}
              label="Mis turnos"
              icon={<CalendarCheck2 className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
              onNavigate={handleNavClick}
              pathname={pathname}
            />
          )}
          {isStaff && can("servicios") && isFeatureEnabled("show_servicios") && (
            <NavItem
              href={`${base}/admin/servicios`}
              label="Servicios"
              icon={<LayoutGrid className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
              onNavigate={handleNavClick}
              pathname={pathname}
            />
          )}
          {isStaff && can("patients") && (
            <NavItem
              href={pacientesItem.href}
              label={pacientesItem.label}
              icon={pacientesItem.icon}
              isCollapsed={effectiveIsCollapsed}
              onNavigate={handleNavClick}
              pathname={pathname}
            />
          )}

          {/* Gestión: Admin, Pagos, Turnos, Sedes, Coberturas */}
          {(isStaff && (can("admin") || (can("pagos") && isFeatureEnabled("show_pagos")) || can("turnos") || can("locations") || can("coberturas"))) && (
            <>
              <SectionTitle label="Gestión" isCollapsed={effectiveIsCollapsed} />
              {can("admin") && (
                <NavItem
                  href={`${base}/admin`}
                  label="Admin"
                  icon={<Settings className="w-5 h-5" />}
                  isCollapsed={effectiveIsCollapsed}
                  onNavigate={handleNavClick}
                  pathname={pathname}
                  exact
                />
              )}
              {can("pagos") && isFeatureEnabled("show_pagos") && (
                <NavItem
                  href={`${base}/admin/payments`}
                  label="Pagos"
                  icon={<CircleDollarSign className="w-5 h-5" />}
                  isCollapsed={effectiveIsCollapsed}
                  onNavigate={handleNavClick}
                  pathname={pathname}
                />
              )}
              {can("turnos") && (
                <NavItem
                  href={`${base}/admin/turnos`}
                  label="Turnos"
                  icon={<CalendarCheck2 className="w-5 h-5" />}
                  isCollapsed={effectiveIsCollapsed}
                  onNavigate={handleNavClick}
                  pathname={pathname}
                />
              )}
              {gestionItems
                .filter((item) => {
                  if (item.show === false) return false;
                  if (item.href.includes("/locations")) return can("locations");
                  if (item.href.includes("/coberturas")) return can("coberturas");
                  return true;
                })
                .map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isCollapsed={effectiveIsCollapsed}
                    onNavigate={handleNavClick}
                    pathname={pathname}
                  />
                ))}
            </>
          )}

          {/* Colaboradores */}
          {isStaff && can("collaborators") && colaboradoresItems.length > 0 && (
            <>
              <SectionTitle label="Colaboradores" isCollapsed={effectiveIsCollapsed} />
              {colaboradoresItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isCollapsed={effectiveIsCollapsed}
                  onNavigate={handleNavClick}
                  pathname={pathname}
                />
              ))}
            </>
          )}
          {role === "ADMIN" && (
            <NavItem
              href={`${base}/admin/roles`}
              label="Roles"
              icon={<User className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
              onNavigate={handleNavClick}
              pathname={pathname}
            />
          )}
          {isStaff && can("profesionales") && (
            <NavItem
              href={`${base}/admin/profesionales`}
              label="Profesionales"
              icon={<User className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
              onNavigate={handleNavClick}
              pathname={pathname}
            />
          )}

          {/* Mis turnos y Mis datos (solo rol PATIENT) */}
          {role === "PATIENT" && (
            <>
              {!effectiveIsCollapsed && <div className="border-t border-slate-200 my-2" />}
              <NavItem
                href={`${base}/patient`}
                label="Mis turnos"
                icon={<CalendarDays className="w-5 h-5" />}
                isCollapsed={effectiveIsCollapsed}
                onNavigate={handleNavClick}
                pathname={pathname}
                exact
              />
              <NavItem
                href={`${base}/patient/mis-datos`}
                label="Mis datos"
                icon={<User className="w-5 h-5" />}
                isCollapsed={effectiveIsCollapsed}
                onNavigate={handleNavClick}
                pathname={pathname}
              />
            </>
          )}

          {/* Ayuda (no visible para PATIENT) */}
          {role !== "PATIENT" && (
            <>
              <SectionTitle label="Ayuda" isCollapsed={effectiveIsCollapsed} />
              <NavItem
                href={"https://nodoapp.gitbook.io/nodoapp-docs"}
                label="Documentación"
                icon={<BookOpen className="w-5 h-5" />}
                isCollapsed={effectiveIsCollapsed}
                onNavigate={handleNavClick}
                pathname={pathname}
              />
              {!effectiveIsCollapsed && usage !== null && (
                <div className="px-4 pt-2 pb-2">
                  <Alert color="primary" variant="faded" icon={<UserIcon className="w-4 h-4" />} className="text-sm">
                    Usaste {usage.used}/{usage.max} usuario{usage.max !== 1 ? "s" : ""}.
                  </Alert>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
