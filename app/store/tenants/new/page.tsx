"use client";

import * as React from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { TenantFormSection } from "../../components/TenantFormSection";

export default function StoreTenantCreatePage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    name: string;
    id?: string;
    logoUrl?: string;
    features?: {
      show_coverage: boolean;
      show_mercado_pago: boolean;
      calendar: boolean;
      payment_enabled: boolean;
    };
    limits?: { maxUsers: number; whatsappRemindersLimit: number };
    adminEmail?: string;
    adminPassword?: string;
  }) => {
    const res = await fetch(`/api/store/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        id: data.id,
        logoUrl: data.logoUrl,
        features: data.features,
        limits: data.limits,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
      }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Error al crear tenant");
    }
    router.push("/store/tenants");
  };

  return (
    <div className="w-full mx-auto px-4 py-8 space-y-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Crear tenant</h1>
        <Button variant="light" onPress={() => router.push("/store/tenants")}>
          Volver
        </Button>
      </div>
      <div className="max-w-5xl mx-auto">
        <TenantFormSection onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
