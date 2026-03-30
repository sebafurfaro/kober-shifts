"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Logo from "@/app/branding/Logo";
import { PWA_STORAGE_TENANT_KEY, isValidPwaTenantIdSegment, savePwaInstallTenantId } from "@/lib/pwa-entry";
import { Role } from "@/lib/types";

/**
 * Entrada PWA bajo /plataforma (alineada al manifest scope).
 * Sesión válida → panel según rol; sin sesión → login del tenant (paciente) o login de equipo.
 */
export default function PlataformaPwaEntryPage() {
  const router = useRouter();

  React.useLayoutEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const sessionRes = await fetch("/api/plataforma/auth/me", { credentials: "include" });
        if (cancelled) return;

        if (sessionRes.ok) {
          const data = (await sessionRes.json().catch(() => ({}))) as { role?: Role; tenantId?: string };
          const tenantId = data.tenantId;
          if (!tenantId) {
            router.replace("/plataforma/login?pwa=1");
            return;
          }
          savePwaInstallTenantId(tenantId);
          const role = data.role;
          if (role === Role.ADMIN || role === Role.SUPERVISOR) {
            router.replace(`/plataforma/${tenantId}/panel/admin`);
          } else if (role === Role.PROFESSIONAL) {
            router.replace(`/plataforma/${tenantId}/panel/professional`);
          } else if (role === Role.PATIENT) {
            router.replace(`/plataforma/${tenantId}/panel/patient`);
          } else {
            router.replace(`/plataforma/${tenantId}/panel`);
          }
          return;
        }

        const raw = localStorage.getItem(PWA_STORAGE_TENANT_KEY);
        if (raw && isValidPwaTenantIdSegment(raw)) {
          router.replace(`/plataforma/${raw}/login?pwa=1`);
          return;
        }

        router.replace("/plataforma/login?pwa=1");
      } catch {
        if (!cancelled) router.replace("/plataforma/login?pwa=1");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc]">
      <Logo width={56} height={56} />
      <p className="mt-5 text-sm text-slate-500">Abriendo la app…</p>
    </div>
  );
}
