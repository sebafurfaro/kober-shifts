import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Hook para verificar si una feature está habilitada en el tenant.
 * Si la feature está deshabilitada, redirige a la página base del panel.
 */
export function useFeatureGate(featureName: "show_pagos" | "show_servicios") {
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const checkFeature = async () => {
      try {
        const res = await fetch(`/api/plataforma/${tenantId}/features`, {
          credentials: "include",
        });
        if (res.ok) {
          const features = await res.json();
          const isEnabled = features[featureName] ?? false;
          setIsFeatureEnabled(isEnabled);
          if (!isEnabled) {
            // Redirigir al panel principal si la feature está deshabilitada
            router.replace(`/plataforma/${tenantId}/panel`);
          }
        } else {
          setIsFeatureEnabled(false);
          router.replace(`/plataforma/${tenantId}/panel`);
        }
      } catch (error) {
        setIsFeatureEnabled(false);
        router.replace(`/plataforma/${tenantId}/panel`);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeature();
  }, [tenantId, featureName, router]);

  return { isFeatureEnabled, isLoading };
}
