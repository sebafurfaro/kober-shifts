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
import type { Role } from "@/lib/types";
import { DEFAULT_PERMISSIONS, type PermissionsMap } from "@/lib/panel-permissions";
import { buildPanelMobileNav } from "@/lib/panel-mobile-nav";
import { MobileBar } from "./layout/MobileBar";

const DRAWER_WIDTH = 260;

export function PanelLayoutShell({
  role,
  userName,
  tenantId,
  hasProfessionalProfile,
  children,
}: {
  role: Role;
  userName: string;
  tenantId: string;
  hasProfessionalProfile?: boolean;
  children: React.ReactNode;
}) {
  const params = useParams();
  const currentTenantId = tenantId || (params.tenantId as string);
  const [mounted, setMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [calendarEnabled, setCalendarEnabled] = React.useState(true);
  const [showCoverage, setShowCoverage] = React.useState(true);
  const [usage, setUsage] = React.useState<{ used: number; max: number } | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [asideWidth, setAsideWidth] = React.useState(DRAWER_WIDTH);
  const [permissions, setPermissions] = React.useState<PermissionsMap | null>(null);
  const [features, setFeatures] = React.useState<{ show_pagos?: boolean; show_servicios?: boolean } | null>(null);
  const { patientLabel, professionalLabel } = useTenantLabels();
  const loadTranslations = useTenantSettingsStore((state) => state.loadTranslations);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    setMounted(true);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function loadFeatures() {
      try {
        const res = await fetch(`/api/plataforma/${currentTenantId}/features`, {
          credentials: "include",
        });
        if (cancelled) return;
        if (res.ok) {
          const featureData = await res.json();
          setCalendarEnabled(featureData.calendar ?? true);
          setShowCoverage(featureData.show_coverage ?? true);
          setFeatures({
            show_pagos: featureData.show_pagos ?? false,
            show_servicios: featureData.show_servicios ?? false,
          });
          const used = typeof featureData.usedUsers === "number" ? featureData.usedUsers : 0;
          const max = typeof featureData.maxUsers === "number" ? featureData.maxUsers : 0;
          setUsage({ used, max });
        } else {
          setCalendarEnabled(true);
          setShowCoverage(true);
          setFeatures({ show_pagos: false, show_servicios: false });
          setUsage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setCalendarEnabled(true);
          setShowCoverage(true);
          setFeatures({ show_pagos: false, show_servicios: false });
          setUsage(null);
        }
      }
    }
    loadFeatures();
    return () => { cancelled = true; };
  }, [currentTenantId]);

  // Load translations when component mounts
  React.useEffect(() => {
    if (mounted && currentTenantId) {
      loadTranslations(currentTenantId);
    }
  }, [mounted, currentTenantId, loadTranslations]);

  // Load permissions for staff roles (para que el Aside respete la matriz de permisos)
  React.useEffect(() => {
    if (!mounted || !currentTenantId || role === "PATIENT") return;
    let cancelled = false;
    fetch(`/api/plataforma/${currentTenantId}/admin/permissions`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const raw = data?.permissions;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          setPermissions({ ...DEFAULT_PERMISSIONS, ...raw });
        } else {
          setPermissions({ ...DEFAULT_PERMISSIONS });
        }
      })
      .catch(() => setPermissions({ ...DEFAULT_PERMISSIONS }));
    return () => { cancelled = true; };
  }, [mounted, currentTenantId, role]);

  const base = `/plataforma/${currentTenantId}/panel`;

  const gestionItems = [
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
      label: "Colaboradores",
      href: `${base}/admin/collaborators`,
      icon: <Hospital className="w-5 h-5" />,
      show: true,
    },
  ];

  const pacientesItem = {
    label: patientLabel,
    href: `${base}/admin/patients`,
    icon: <BookUser className="w-5 h-5" />,
  };

  const { entries: mobileNavEntries, asideKeysToHide } = React.useMemo(
    () =>
      buildPanelMobileNav({
        role,
        currentTenantId,
        calendarEnabled,
        pacientesItem: { label: pacientesItem.label, href: pacientesItem.href },
        permissions,
        features,
        hasProfessionalProfile,
      }),
    [
      role,
      currentTenantId,
      calendarEnabled,
      pacientesItem.label,
      pacientesItem.href,
      permissions,
      features,
      hasProfessionalProfile,
    ],
  );

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
        role={role}
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
        usage={usage}
        permissions={permissions}
        features={features}
        hasProfessionalProfile={hasProfessionalProfile}
        navHiddenOnMobile={asideKeysToHide}
      />

      {/* Main Content */}
      <main
        className="flex-1 py-16 max-md:pb-24 px-6 w-full text-slate-900 transition-all duration-300 responsive-margin"
        style={{
          '--dynamic-aside-width': `${asideWidth}px`,
          backgroundImage: "linear-gradient(to bottom, #F3F8FC, #f4f8fa)",
        } as React.CSSProperties}
      >
        {children}
      </main>
      <MobileBar entries={mobileNavEntries} setMobileDrawerOpen={setMobileDrawerOpen} />
    </div>
  );
}


