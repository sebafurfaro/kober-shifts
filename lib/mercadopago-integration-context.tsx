"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

export type MercadoPagoIntegrationContextValue = {
  tenantId: string;
  /** Feature `show_pagos` del tenant (API /features). */
  isPagosFeatureEnabled: boolean;
  /** null = cargando estado desde la API. */
  isMercadoPagoLinked: boolean | null;
  isMercadoPagoStatusLoading: boolean;
  refreshMercadoPagoStatus: () => Promise<void>;
  /** Solo permitido desde Integraciones (OAuth con `integration_source=integrations`). */
  connectMercadoPago: () => void;
  disconnectMercadoPago: () => Promise<void>;
  isDisconnecting: boolean;
};

const MercadoPagoIntegrationContext =
  React.createContext<MercadoPagoIntegrationContextValue | null>(null);

export function MercadoPagoIntegrationProvider({
  tenantId,
  isPagosFeatureEnabled,
  children,
}: {
  tenantId: string;
  isPagosFeatureEnabled: boolean;
  children: React.ReactNode;
}) {
  const [isLinked, setIsLinked] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  const loadStatus = React.useCallback(async () => {
    const clientLog =
      typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_MERCADOPAGO_LINKAGE_LOG === "1";
    try {
      setIsLoading(true);
      const res = await fetch(`/api/plataforma/${tenantId}/integrations/mercadopago/status`, {
        credentials: "include",
      });
      const raw = await res.text();
      let data: { linked?: boolean; _debug?: { rowStatus?: string }; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (clientLog) {
        console.info("[mp-oauth-status client]", {
          tenantId,
          httpStatus: res.status,
          linked: data.linked,
          _debug: data._debug,
          ok: res.ok,
        });
      }
      if (res.ok) {
        setIsLinked(!!data.linked);
      } else {
        if (clientLog) {
          console.warn("[mp-oauth-status client] no ok", res.status, data);
        }
        setIsLinked(false);
      }
    } catch (e) {
      console.error("Error loading Mercado Pago status:", e);
      if (clientLog) {
        console.warn("[mp-oauth-status client] fetch error", e);
      }
      setIsLinked(false);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    if (tenantId) void loadStatus();
  }, [tenantId, loadStatus]);

  const connectMercadoPago = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const params = new URLSearchParams();
    params.set("integration_source", "integrations");
    if (returnTo.startsWith("/plataforma/")) {
      params.set("return_to", returnTo);
    }
    window.location.href = `/api/plataforma/${tenantId}/integrations/mercadopago/authorize?${params.toString()}`;
  }, [tenantId]);

  const disconnectMercadoPago = React.useCallback(async () => {
    if (isDisconnecting) return;
    try {
      setIsDisconnecting(true);
      const res = await fetch(`/api/plataforma/${tenantId}/integrations/mercadopago/disconnect`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al desvincular Mercado Pago");
      }
      setIsLinked(false);
      await loadStatus();
    } catch (err) {
      console.error(err);
      setIsLinked(false);
      throw err;
    } finally {
      setIsDisconnecting(false);
    }
  }, [tenantId, isDisconnecting, loadStatus]);

  const value = React.useMemo<MercadoPagoIntegrationContextValue>(
    () => ({
      tenantId,
      isPagosFeatureEnabled,
      isMercadoPagoLinked: isLinked,
      isMercadoPagoStatusLoading: isLoading,
      refreshMercadoPagoStatus: loadStatus,
      connectMercadoPago,
      disconnectMercadoPago,
      isDisconnecting,
    }),
    [
      tenantId,
      isPagosFeatureEnabled,
      isLinked,
      isLoading,
      loadStatus,
      connectMercadoPago,
      disconnectMercadoPago,
      isDisconnecting,
    ]
  );

  return (
    <MercadoPagoIntegrationContext.Provider value={value}>
      {children}
    </MercadoPagoIntegrationContext.Provider>
  );
}

export function useMercadoPagoIntegration(): MercadoPagoIntegrationContextValue {
  const ctx = React.useContext(MercadoPagoIntegrationContext);
  if (!ctx) {
    throw new Error("useMercadoPagoIntegration must be used within MercadoPagoIntegrationProvider");
  }
  return ctx;
}

/**
 * Ítem "Pagos" en el aside: requiere feature `show_pagos` y cuenta MP vinculada.
 * Mientras carga el estado del vínculo, no se muestra (evita parpadeo).
 */
export function useShowPagosAsideLink(): boolean {
  const { isPagosFeatureEnabled, isMercadoPagoLinked, isMercadoPagoStatusLoading } =
    useMercadoPagoIntegration();
  if (!isPagosFeatureEnabled) return false;
  if (isMercadoPagoStatusLoading || isMercadoPagoLinked === null) return false;
  return isMercadoPagoLinked === true;
}

/**
 * Rutas bajo /admin/payments: si la feature está activa pero no hay MP vinculado, vuelve a Admin.
 */
export function useRedirectIfPagosWithoutMercadoPago(): void {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const { isPagosFeatureEnabled, isMercadoPagoLinked, isMercadoPagoStatusLoading } =
    useMercadoPagoIntegration();

  React.useEffect(() => {
    if (!isPagosFeatureEnabled) return;
    if (isMercadoPagoStatusLoading || isMercadoPagoLinked === null) return;
    if (!isMercadoPagoLinked) {
      router.replace(`/plataforma/${tenantId}/panel/admin`);
    }
  }, [
    isPagosFeatureEnabled,
    isMercadoPagoLinked,
    isMercadoPagoStatusLoading,
    tenantId,
    router,
  ]);
}
