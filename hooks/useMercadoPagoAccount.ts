import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function useMercadoPagoAccount(tenantId: string) {
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const searchParams = useSearchParams();

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/plataforma/${tenantId}/integrations/mercadopago/status`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIsLinked(!!data.linked);
      } else {
        setIsLinked(false);
      }
    } catch (e) {
      console.error("Error loading Mercado Pago status:", e);
      setIsLinked(false);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadStatus();
    }
  }, [tenantId, loadStatus]);

  // Tras el redirect OAuth: confirmar estado en API (mp_linked) o reflejar error en URL
  useEffect(() => {
    const mpLinkedParam = searchParams.get("mp_linked");
    const mpErrorParam = searchParams.get("mp_error");
    if (mpLinkedParam === "1") {
      void loadStatus();
    } else if (mpErrorParam) {
      setIsLinked(false);
    }
  }, [searchParams, loadStatus]);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const params = new URLSearchParams();
    if (returnTo.startsWith("/plataforma/")) {
      params.set("return_to", returnTo);
    }
    const qs = params.toString();
    window.location.href = `/api/plataforma/${tenantId}/integrations/mercadopago/authorize${qs ? `?${qs}` : ""}`;
  }, [tenantId]);

  const disconnect = useCallback(async () => {
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
      setIsLinked(false); // Reflejar en la UI si falla por timeout o error
      throw err;
    } finally {
      setIsDisconnecting(false);
    }
  }, [tenantId, isDisconnecting, loadStatus]);

  return {
    isLinked,
    isLoading,
    isDisconnecting,
    connect,
    disconnect,
    refreshStatus: loadStatus,
    mpErrorParam: searchParams.get("mp_error"),
    mpSuccessParam: searchParams.get("mp_linked")
  };
}
