"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
/**
 * Si la app abierta desde el icono (standalone) cae en `/`, redirige a la entrada PWA bajo /plataforma.
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
      router.replace("/plataforma/pwa");
    } catch {
      // ignore
    }
  }, [pathname, router]);

  return null;
}
