"use client";

import * as React from "react";
import {
  MapPin,
  BookUser,
  FolderTree,
  FileText,
  Hospital,
} from "lucide-react";
import { useParams } from "next/navigation";
import AppBar from "./layout/AppBar";
import { Aside } from "./layout/Aside";
import { useTenantLabels } from "@/lib/use-tenant-labels";
import { useTenantSettingsStore } from "@/lib/tenant-settings-store";

type Role = "PATIENT" | "PROFESSIONAL" | "ADMIN";

const DRAWER_WIDTH = 260;

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
  const [mounted, setMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [calendarEnabled, setCalendarEnabled] = React.useState(true);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [asideWidth, setAsideWidth] = React.useState(DRAWER_WIDTH);
  const { patientLabel, professionalLabel } = useTenantLabels();
  const loadTranslations = useTenantSettingsStore((state) => state.loadTranslations);

  // Set mounted flag to prevent hydration errors
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mounted]);

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

  // Load translations when component mounts
  React.useEffect(() => {
    if (mounted && currentTenantId) {
      loadTranslations(currentTenantId);
    }
  }, [mounted, currentTenantId, loadTranslations]);
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
      label: professionalLabel,
      href: `/plataforma/${currentTenantId}/panel/admin/professionals`,
      icon: <Hospital className="w-5 h-5" />,
      show: true,
    },
    {
      label: patientLabel,
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
        setMobileDrawerOpen={setMobileDrawerOpen}
        userName={userName}
        logout={logout}
        asideWidth={asideWidth}
      />

      {/* Drawer */}
      <Aside
        role={role}
        currentTenantId={currentTenantId}
        isMobile={isMobile}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
        calendarEnabled={calendarEnabled}
        adminItems={adminItems}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onWidthChange={setAsideWidth}
      />

      {/* Main Content */}
      <main
        className="flex-1 pt-16 px-6 w-full text-slate-900 transition-all duration-300"
        style={{
          marginLeft: isMobile ? 0 : `${asideWidth}px`,
          backgroundImage: "linear-gradient(to bottom, #F3F8FC, #f4f8fa)",
        }}
      >
        {children}
      </main>
    </div>
  );
}


