"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { PWA_STORAGE_TENANT_KEY, isValidPwaTenantIdSegment } from "@/lib/pwa-entry";

/**
 * Si la app abierta desde el icono (standalone) cae en `/`, redirige al panel del último tenant guardado.
 */
export function PwaStandaloneHomeRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  React.useLayoutEffect(() => {
    if (pathname !== "/") return;
    try {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!standalone) return;
      const raw = localStorage.getItem(PWA_STORAGE_TENANT_KEY);
      if (!raw || !isValidPwaTenantIdSegment(raw)) return;
      router.replace(`/plataforma/${raw}/panel`);
    } catch {
      // ignore
    }
  }, [pathname, router]);

  return null;
}
