"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import {
  Menu,
  Calendar,
  LogOut,
  User,
  CalendarDays,
  Settings,
  MapPin,
  BookUser,
  FolderTree,
  FileText,
  BarChart3,
  Hospital
} from "lucide-react";
import { useParams } from "next/navigation";
import Logo from "@/app/branding/Logo";

type Role = "PATIENT" | "PROFESSIONAL" | "ADMIN";

const DRAWER_WIDTH = 260;

function NavItem(props: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={props.href}
      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors duration-150 rounded-lg"
    >
      <span className="w-5 h-5">{props.icon}</span>
      <span className="text-sm font-medium">{props.label}</span>
    </Link>
  );
}

export function PanelLayoutShell({
  role,
  userName,
  tenantId,
  children,
}: {
  role: Role;
  userName: string;
  tenantId: string;
  children: React.ReactNode;
}) {
  const params = useParams();
  // Use prop if provided, otherwise fallback to params
  const currentTenantId = tenantId || (params.tenantId as string);
  const [isMobile, setIsMobile] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [calendarEnabled, setCalendarEnabled] = React.useState(true);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load calendar feature flag
  React.useEffect(() => {
    async function loadCalendarFeature() {
      try {
        const res = await fetch(`/api/plataforma/${currentTenantId}/features`, {
          credentials: "include",
        });
        if (res.ok) {
          const features = await res.json();
          setCalendarEnabled(features.calendar ?? true);
        } else {
          // Default to enabled on error
          setCalendarEnabled(true);
        }
      } catch (error) {
        console.error("Error loading calendar feature:", error);
        // Default to enabled on error
        setCalendarEnabled(true);
      }
    }
    loadCalendarFeature();
  }, [currentTenantId]);
  const configSections = { showLocations: true, showSpecialties: true };

  async function logout() {
    await fetch(`/api/plataforma/${currentTenantId}/auth/logout`, { method: "POST" });
    window.location.href = `/plataforma/${currentTenantId}/login`;
  }

  const adminItems = [
    {
      label: "Sedes",
      href: `/plataforma/${currentTenantId}/panel/admin/locations`,
      icon: <MapPin className="w-5 h-5" />,
      show: configSections?.showLocations ?? false,
    },
    {
      label: "Especialidades",
      href: `/plataforma/${currentTenantId}/panel/admin/specialties`,
      icon: <FolderTree className="w-5 h-5" />,
      show: configSections?.showSpecialties ?? true,
    },
    {
      label: "Profesionales",
      href: `/plataforma/${currentTenantId}/panel/admin/professionals`,
      icon: <Hospital className="w-5 h-5" />,
      show: true,
    },
    {
      label: "Pacientes",
      href: `/plataforma/${currentTenantId}/panel/admin/patients`,
      icon: <BookUser className="w-5 h-5" />,
      show: true,
    },
    {
      label: "Coberturas",
      href: `/plataforma/${currentTenantId}/panel/admin/coberturas`,
      icon: <FileText className="w-5 h-5" />,
      show: true,
    },
  ].filter(item => item.show);

  return (
    <div className="flex min-h-screen">
      {/* Mobile Overlay */}
      {isMobile && mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* AppBar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        {isMobile && (
          <Button
            isIconOnly
            variant="light"
            onPress={() => setMobileDrawerOpen((v) => !v)}
            className="mr-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <Logo width={40} height={40} />
        </div>
        <p className="text-sm text-gray-700 mr-4">Hola, {userName}</p>
        <Button
          isIconOnly
          variant="light"
          onPress={logout}
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Drawer */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-[${DRAWER_WIDTH}px] bg-[#0e5287] text-white z-30 transition-transform duration-300 ${
          isMobile
            ? mobileDrawerOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
        }`}
        style={{ width: `${DRAWER_WIDTH}px` }}
      >
        <div className="overflow-y-auto h-full py-4">
          <nav className="space-y-2 px-2">
            {role !== "PATIENT" && calendarEnabled && (
              <NavItem
                href={`/plataforma/${currentTenantId}/panel`}
                label="Calendario"
                icon={<Calendar className="w-5 h-5" />}
              />
            )}

            {(role === "ADMIN" || role === "PROFESSIONAL") && (
              <NavItem
                href={`/plataforma/${currentTenantId}/panel/analytics`}
                label="Analíticas"
                icon={<BarChart3 className="w-5 h-5" />}
              />
            )}

            <div className="border-t border-white/20 my-2" />

            {(role === "PATIENT" || role === "ADMIN") && (
              <NavItem
                href={`/plataforma/${currentTenantId}/panel/patient`}
                label="Mis turnos"
                icon={<CalendarDays className="w-5 h-5" />}
              />
            )}
            {(role === "PROFESSIONAL" || role === "ADMIN") && (
              <NavItem
                href={`/plataforma/${currentTenantId}/panel/professional`}
                label="Profesional"
                icon={<User className="w-5 h-5" />}
              />
            )}
            {role === "ADMIN" && (
              <NavItem
                href={`/plataforma/${currentTenantId}/panel/admin`}
                label="Admin"
                icon={<Settings className="w-5 h-5" />}
              />
            )}

            {role === "ADMIN" && (
              <>
                <div className="border-t border-white/20 my-2" />
                {adminItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                  />
                ))}
              </>
            )}
            {role === "PROFESSIONAL" && (
              <>
                <div className="border-t border-white/20 my-2" />
                <NavItem
                  href={`/plataforma/${currentTenantId}/panel/professional/patients`}
                  label="Pacientes"
                  icon={<User className="w-5 h-5" />}
                />
              </>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 pt-16 px-6 transition-all duration-300 ${
          isMobile ? "ml-0" : `ml-[${DRAWER_WIDTH}px]`
        }`}
        style={{
          marginLeft: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          backgroundImage: "linear-gradient(to bottom, #F3F8FC, #f4f8fa)",
        }}
      >
        {children}
      </main>
    </div>
  );
}


