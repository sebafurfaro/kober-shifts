"use client";

import * as React from "react";

export type MercadoPagoIntegrationContextValue = {
  tenantId: string;
  isPagosFeatureEnabled: boolean;
  isMercadoPagoFeatureEnabled: boolean;
  isMercadoPagoLinked: boolean | null;
  isPaymentsLocal: boolean;
  isMercadoPagoStatusLoading: boolean;
  refreshMercadoPagoStatus: () => Promise<void>;
  connectMercadoPago: () => void;
  disconnectMercadoPago: () => Promise<void>;
  isDisconnecting: boolean;
};

const MercadoPagoIntegrationContext =
  React.createContext<MercadoPagoIntegrationContextValue | null>(null);

export function MercadoPagoIntegrationProvider({
  tenantId,
  isPagosFeatureEnabled,
  isMercadoPagoFeatureEnabled,
  children,
}: {
  tenantId: string;
  isPagosFeatureEnabled: boolean;
  isMercadoPagoFeatureEnabled: boolean;
  children: React.ReactNode;
}) {
  const [isLinked, setIsLinked] = React.useState<boolean | null>(null);
  const [isPaymentsLocal, setIsPaymentsLocal] = React.useState<boolean>(false);
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
      let data: { linked?: boolean; paymentsLocal?: boolean; _debug?: { rowStatus?: string }; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (res.ok) {
        setIsLinked(!!data.linked);
        setIsPaymentsLocal(!!data.paymentsLocal);
      } else {
        setIsLinked(false);
        setIsPaymentsLocal(false);
      }
    } catch (e) {
      console.error("Error loading Mercado Pago status:", e);
      setIsLinked(false);
      setIsPaymentsLocal(false);
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
      isMercadoPagoFeatureEnabled,
      isMercadoPagoLinked: isLinked,
      isPaymentsLocal,
      isMercadoPagoStatusLoading: isLoading,
      refreshMercadoPagoStatus: loadStatus,
      connectMercadoPago,
      disconnectMercadoPago,
      isDisconnecting,
    }),
    [
      tenantId,
      isPagosFeatureEnabled,
      isMercadoPagoFeatureEnabled,
      isLinked,
      isPaymentsLocal,
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

/** Muestra el ítem Cobros/Pagos en el menú si el tenant tiene `show_pagos` (no exige MP vinculado). */
export function useShowPagosAsideLink(): boolean {
  const { isPagosFeatureEnabled } = useMercadoPagoIntegration();
  return isPagosFeatureEnabled;
}
