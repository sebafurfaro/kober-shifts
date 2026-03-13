"use client";

import * as React from "react";
import { Alert, Button, Spinner } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { TenantConfigSection } from "../../components/TenantConfigSection";
import { TenantFeatureFlags, TenantLimits, TenantTranslations } from "../../components/TenantConfigDialog";

interface TenantConfig {
  features: TenantFeatureFlags;
  limits: TenantLimits;
}

interface Tenant {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  config?: TenantConfig;
}

const defaultFeatures: TenantFeatureFlags = {
  show_coverage: true,
  show_mercado_pago: true,
  calendar: true,
  payment_enabled: true,
  whatsappNotifications: false,
  whatsappCustomMessage: "",
  show_pagos: false,
  show_servicios: false,
};

const defaultLimits: TenantLimits = {
  maxUsers: 1,
  whatsappRemindersLimit: 0,
};

export default function StoreTenantEditPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadTenant = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/store/tenants`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/store/login";
          return;
        }
        throw new Error("Error al cargar tenants");
      }
      const data = await res.json();
      const tenantsList = Array.isArray(data) ? data : [];
      const found = tenantsList.find((t: Tenant) => t.id === tenantId) || null;
      if (!found) {
        setError("No se encontró el tenant solicitado");
        setTenant(null);
        return;
      }

      let config: TenantConfig | undefined;
      try {
        const configRes = await fetch(`/api/store/tenants/${tenantId}/features`, {
          credentials: "include",
        });
        if (configRes.ok) {
          config = await configRes.json();
        }
      } catch (configError) {
        console.error(`Error loading config for tenant ${tenantId}:`, configError);
      }

      setTenant({ ...found, config });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar el tenant");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  const handleSaveConfig = async (data: {
    features: TenantFeatureFlags;
    limits: TenantLimits;
    translations: TenantTranslations;
    adminEmail?: string;
    adminPassword?: string;
  }) => {
    const requests: Promise<Response>[] = [
      fetch(`/api/store/tenants/${tenantId}/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ features: data.features, limits: data.limits }),
      }),
      fetch(`/api/store/tenants/${tenantId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientLabel: data.translations.patientLabel,
          professionalLabel: data.translations.professionalLabel,
        }),
      }),
    ];
    if (data.adminEmail || data.adminPassword) {
      requests.push(
        fetch(`/api/store/tenants/${tenantId}/admin`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: data.adminEmail,
            password: data.adminPassword,
          }),
        })
      );
    }
    const [featuresRes, settingsRes, adminRes] = await Promise.all(requests);
    if (!featuresRes.ok) {
      const err = await featuresRes.json().catch(() => ({}));
      const msg = err.detail ? `${err.error}: ${err.detail}` : (err.error || "Error al guardar configuración");
      throw new Error(msg);
    }
    if (!settingsRes.ok) {
      const err = await settingsRes.json().catch(() => ({}));
      const msg = err.error || "Error al guardar traducciones";
      throw new Error(msg);
    }
    if (adminRes && !adminRes.ok) {
      const err = await adminRes.json().catch(() => ({}));
      const msg = err.error || "Error al guardar credenciales admin";
      throw new Error(msg);
    }
    await loadTenant();
  };

  return (
    <div className="w-full mx-auto px-4 py-8 space-y-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Editar tenant</h1>
        <Button variant="light" onPress={() => router.push("/store/tenants")}>
          Volver
        </Button>
      </div>

      <div className="max-w-5xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        )}

        {error && <Alert color="danger">{error}</Alert>}

        {!loading && !error && tenant && (
          <TenantConfigSection
            tenantId={tenant.id}
            tenantName={tenant.name}
            initialFeatures={tenant.config?.features ?? defaultFeatures}
            initialLimits={tenant.config?.limits ?? defaultLimits}
            onSave={handleSaveConfig}
          />
        )}
      </div>
    </div>
  );
}
