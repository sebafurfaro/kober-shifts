"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  User,
  CalendarDays,
  Settings,
  MapPin,
  BookUser,
  FolderTree,
  FileText,
  BarChart3,
  Hospital,
  PiggyBank
} from "lucide-react";
import { useParams } from "next/navigation";
import AppBar from "./layout/AppBar";

type Role = "PATIENT" | "PROFESSIONAL" | "ADMIN";

const DRAWER_WIDTH = 260;

function NavItem(props: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={props.href}
      className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:bg-[#0288D1]/10 transition-all duration-300 ease-in-out rounded-md font-primary"
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
          setCalendarEnabled(true);
        }
      } catch (error) {
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
      {isMobile && mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* AppBar */}
      <AppBar
        isMobile={isMobile}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
        userName={userName}
        logout={logout}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-[${DRAWER_WIDTH}px] bg-white text-slate-900 z-9998 transition-transform duration-300 ${isMobile
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

            <div className="border-t border-slate-200 my-2" />

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
              <>
                <NavItem
                  href={`/plataforma/${currentTenantId}/panel/admin`}
                  label="Admin"
                  icon={<Settings className="w-5 h-5" />}
                />
                <NavItem
                  href={`/plataforma/${currentTenantId}/panel/admin/payments`}
                  label="Datos financieros"
                  icon={<PiggyBank className="w-5 h-5" />}
                />
              </>
            )}

            {role === "ADMIN" && (
              <>
                <div className="border-t border-slate-200 my-2" />
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
                <div className="border-t border-slate-200 my-2" />
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
        className={`flex-1 pt-16 px-6 text-slate-900 transition-all duration-300 ${isMobile ? "ml-0 w-full" : `ml-[${DRAWER_WIDTH}px]`
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


