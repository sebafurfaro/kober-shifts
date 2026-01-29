"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  User,
  CalendarDays,
  Settings,
  BarChart3,
  PiggyBank,
  Menu,
  ChevronLeft,
} from "lucide-react";
import Logo from "@/app/branding/Logo";
import { Dispatch, SetStateAction } from "react";

type Role = "PATIENT" | "PROFESSIONAL" | "ADMIN";

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 64;

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
}

function NavItem({ href, label, icon, isCollapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 py-3 text-slate-800 hover:bg-[#0288D1]/10 transition-all duration-300 ease-in-out rounded-md font-primary ${
        isCollapsed ? "justify-center px-2" : "px-4"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <span className="w-5 h-5 shrink-0">{icon}</span>
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

interface AdminItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  show?: boolean;
}

interface AsideProps {
  role: Role;
  currentTenantId: string;
  isMobile: boolean;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: Dispatch<SetStateAction<boolean>>;
  calendarEnabled: boolean;
  adminItems: AdminItem[];
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
  onWidthChange: (width: number) => void;
}

export function Aside({
  role,
  currentTenantId,
  isMobile,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  calendarEnabled,
  adminItems,
  isCollapsed,
  setIsCollapsed,
  onWidthChange,
}: AsideProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isManuallyToggled, setIsManuallyToggled] = React.useState(false);

  // Calcular el ancho actual
  const currentWidth = React.useMemo(() => {
    if (isMobile) {
      return mobileDrawerOpen ? DRAWER_WIDTH : 0;
    }
    // Si está colapsado y no está siendo hover, usar ancho colapsado
    // Si fue toggled manualmente, respetar el estado colapsado
    if (isCollapsed && !isHovered) {
      return DRAWER_COLLAPSED_WIDTH;
    }
    return DRAWER_WIDTH;
  }, [isMobile, mobileDrawerOpen, isCollapsed, isHovered]);

  // Notificar cambios de ancho
  React.useEffect(() => {
    onWidthChange(currentWidth);
  }, [currentWidth, onWidthChange]);

  const handleToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    // Si el usuario colapsa manualmente, marcar como toggled manualmente
    // Si el usuario expande manualmente, permitir hover de nuevo
    setIsManuallyToggled(newCollapsedState);
  };

  const handleMouseEnter = () => {
    // Solo expandir con hover si está colapsado y NO fue toggled manualmente
    if (isCollapsed && !isManuallyToggled) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    // Solo colapsar si fue expandido por hover
    if (isCollapsed && !isManuallyToggled) {
      setIsHovered(false);
    }
  };

  // El aside está efectivamente colapsado si:
  // - isCollapsed es true Y
  // - No está siendo hover (independientemente de si fue toggled manualmente)
  const effectiveIsCollapsed = isCollapsed && !isHovered;

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white text-slate-900 z-49 transition-all duration-300 ${
        isMobile
          ? mobileDrawerOpen
            ? "translate-x-0"
            : "-translate-x-full"
          : "translate-x-0"
      }`}
      style={{ width: `${currentWidth}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="overflow-y-auto h-full py-4">
        {/* Logo and Toggle */}
        <div className={`flex mb-4 pb-4 border-b border-slate-200 ${
          effectiveIsCollapsed ? "flex-col items-center px-2 gap-2" : "items-center justify-between px-4"
        }`}>
          {!effectiveIsCollapsed && (
            <div className="flex items-center gap-2">
              <Logo width={32} height={32} />
              <span className="text-lg font-bold text-[#0e5287]">
                NODO App
              </span>
            </div>
          )}
          {effectiveIsCollapsed && (
            <Logo width={32} height={32} />
          )}
          {!isMobile && (
            <button
              onClick={handleToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              aria-label={effectiveIsCollapsed ? "Expand menu" : "Collapse menu"}
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform duration-300 ${
                  effectiveIsCollapsed ? "rotate-180" : ""
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

        <nav className="space-y-2 px-2">
          {role !== "PATIENT" && calendarEnabled && (
            <NavItem
              href={`/plataforma/${currentTenantId}/panel`}
              label="Calendario"
              icon={<Calendar className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
            />
          )}

          {(role === "ADMIN" || role === "PROFESSIONAL") && (
            <NavItem
              href={`/plataforma/${currentTenantId}/panel/analytics`}
              label="Analíticas"
              icon={<BarChart3 className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
            />
          )}

          {!effectiveIsCollapsed && <div className="border-t border-slate-200 my-2" />}

          {(role === "PATIENT" || role === "ADMIN") && (
            <NavItem
              href={`/plataforma/${currentTenantId}/panel/patient`}
              label="Mis turnos"
              icon={<CalendarDays className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
            />
          )}
          {(role === "PROFESSIONAL" || role === "ADMIN") && (
            <NavItem
              href={`/plataforma/${currentTenantId}/panel/professional`}
              label="Profesional"
              icon={<User className="w-5 h-5" />}
              isCollapsed={effectiveIsCollapsed}
            />
          )}
          {role === "ADMIN" && (
            <>
              <NavItem
                href={`/plataforma/${currentTenantId}/panel/admin`}
                label="Admin"
                icon={<Settings className="w-5 h-5" />}
                isCollapsed={effectiveIsCollapsed}
              />
              <NavItem
                href={`/plataforma/${currentTenantId}/panel/admin/payments`}
                label="Datos financieros"
                icon={<PiggyBank className="w-5 h-5" />}
                isCollapsed={effectiveIsCollapsed}
              />
            </>
          )}

          {role === "ADMIN" && (
            <>
              {!effectiveIsCollapsed && <div className="border-t border-slate-200 my-2" />}
              {adminItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isCollapsed={effectiveIsCollapsed}
                />
              ))}
            </>
          )}
          {role === "PROFESSIONAL" && (
            <>
              {!effectiveIsCollapsed && <div className="border-t border-slate-200 my-2" />}
              <NavItem
                href={`/plataforma/${currentTenantId}/panel/professional/patients`}
                label="Pacientes"
                icon={<User className="w-5 h-5" />}
                isCollapsed={effectiveIsCollapsed}
              />
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
