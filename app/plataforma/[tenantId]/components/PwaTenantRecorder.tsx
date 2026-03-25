"use client";

import * as React from "react";
import { savePwaInstallTenantId } from "@/lib/pwa-entry";

/** Persiste el tenant actual para que la PWA (standalone) pueda abrir en /plataforma/{tenantId}/panel. */
export function PwaTenantRecorder({ tenantId }: { tenantId: string }) {
  React.useEffect(() => {
    savePwaInstallTenantId(tenantId);
  }, [tenantId]);
  return null;
}
