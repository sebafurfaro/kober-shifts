"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Logo from "@/app/branding/Logo";
import { PWA_STORAGE_TENANT_KEY, isValidPwaTenantIdSegment } from "@/lib/pwa-entry";
import { Role } from "@/lib/types";

/**
 * Punto de entrada de la PWA (manifest start_url). Sin marketing: solo logo y redirección.
 * Sesión válida → panel según rol; sin sesión → login del tenant con ?pwa=1
 */
export default function PwaEntryPage() {
  const router = useRouter();

  React.useLayoutEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const raw = localStorage.getItem(PWA_STORAGE_TENANT_KEY);
        if (!raw || !isValidPwaTenantIdSegment(raw)) {
          router.replace("/");
          return;
        }
        const tenantId = raw;
        const res = await fetch(`/api/plataforma/${tenantId}/auth/me`, { credentials: "include" });
        if (cancelled) return;

        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as { role?: Role };
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

        router.replace(`/plataforma/${tenantId}/login?pwa=1`);
      } catch {
        if (!cancelled) router.replace("/");
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
