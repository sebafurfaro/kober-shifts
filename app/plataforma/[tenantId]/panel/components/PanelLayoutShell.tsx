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
  const [showSpecialties, setShowSpecialties] = React.useState(true);
  const [showCoverage, setShowCoverage] = React.useState(true);
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
    async function loadFeatures() {
      try {
        const res = await fetch(`/api/plataforma/${currentTenantId}/features`, {
          credentials: "include",
        });
        if (res.ok) {
          const features = await res.json();
          setCalendarEnabled(features.calendar ?? true);
          setShowSpecialties(features.show_specialties ?? true);
          setShowCoverage(features.show_coverage ?? true);
        } else {
          setCalendarEnabled(true);
          setShowSpecialties(true);
          setShowCoverage(true);
        }
      } catch (error) {
        setCalendarEnabled(true);
        setShowSpecialties(true);
        setShowCoverage(true);
      }
    }
    loadFeatures();
  }, [currentTenantId]);

  // Load translations when component mounts
  React.useEffect(() => {
    if (mounted && currentTenantId) {
      loadTranslations(currentTenantId);
    }
  }, [mounted, currentTenantId, loadTranslations]);
  const base = `/plataforma/${currentTenantId}/panel`;

  const gestionItems = [
    {
      label: "Especialidades",
      href: `${base}/admin/specialties`,
      icon: <FolderTree className="w-5 h-5" />,
      show: showSpecialties,
    },
    {
      label: "Sedes",
      href: `${base}/admin/locations`,
      icon: <MapPin className="w-5 h-5" />,
      show: true,
    },
    {
      label: "Coberturas",
      href: `${base}/admin/coberturas`,
      icon: <FileText className="w-5 h-5" />,
      show: showCoverage,
    },
  ].filter((item) => item.show !== false);

  const colaboradoresItems = [
    {
      label: professionalLabel,
      href: `${base}/admin/professionals`,
      icon: <Hospital className="w-5 h-5" />,
      show: true,
    },
  ];

  const pacientesItem = {
    label: patientLabel,
    href: `${base}/admin/patients`,
    icon: <BookUser className="w-5 h-5" />,
  };

  async function logout() {
    await fetch(`/api/plataforma/${currentTenantId}/auth/logout`, { method: "POST" });
    window.location.href = `/plataforma/${currentTenantId}/login`;
  }

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
        tenantId={currentTenantId}
      />

      {/* Drawer */}
      <Aside
        role={role}
        currentTenantId={currentTenantId}
        isMobile={isMobile}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
        calendarEnabled={calendarEnabled}
        gestionItems={gestionItems}
        colaboradoresItems={colaboradoresItems}
        pacientesItem={pacientesItem}
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


