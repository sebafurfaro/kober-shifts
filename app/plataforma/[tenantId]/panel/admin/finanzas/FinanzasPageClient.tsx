"use client";

import * as React from "react";
import { Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { PanelHeader } from "../../components/PanelHeader";
import { Section } from "../../components/layout/Section";
import { FinanzasPeriodFilter } from "./components/FinanzasPeriodFilter";
import { FinanzasMetricCards } from "./components/FinanzasMetricCards";
import { FinanzasMonthlyBarsChart } from "./components/FinanzasMonthlyBarsChart";
import { FinanzasEgresosCategoryBars } from "./components/FinanzasEgresosCategoryBars";
import { FinanzasMovementsFeed } from "./components/FinanzasMovementsFeed";
import type { FinanzasDashboardResponse, FinanzasPeriodKey } from "./components/types";
import { useFeatureGate } from "@/lib/use-feature-gate";

export default function FinanzasPageClient() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [period, setPeriod] = React.useState<FinanzasPeriodKey>("month");
  const [data, setData] = React.useState<FinanzasDashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { isLoading: featureGateLoading } = useFeatureGate("show_pagos");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/plataforma/${tenantId}/admin/finanzas?period=${period}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const json = (await res.json()) as FinanzasDashboardResponse;
      setData(json);
    } catch (e: unknown) {
      setData(null);
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [tenantId, period]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (featureGateLoading) {
    return (
      <Section>
        <div className="flex justify-center py-16">
          <Spinner label="Cargando finanzas..." />
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <PanelHeader
        title="Finanzas"
        subtitle="Resumen de ingresos, egresos y balance en el período elegido."
      />

      <div className="flex flex-col gap-6 mb-6">
        <FinanzasPeriodFilter value={period} onChange={setPeriod} disabled={loading} />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner label="Cargando finanzas..." />
        </div>
      )}

      {!loading && error && (
        <p className="text-danger text-sm">{error}</p>
      )}

      {!loading && data && (
        <>
          <div className="mb-2">
            <p className="text-sm text-default-500">
              Período: <span className="font-medium text-foreground">{data.period.label}</span>
            </p>
          </div>
          <FinanzasMetricCards
            ingresos={data.metrics.ingresos}
            egresos={data.metrics.egresos}
            balance={data.metrics.balance}
          />

          <div className="mt-8">
            <FinanzasMonthlyBarsChart points={data.chartSixMonths} />
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <FinanzasEgresosCategoryBars items={data.egresosByCategory} />
            <FinanzasMovementsFeed movements={data.movements} />
          </div>
        </>
      )}
    </Section>
  );
}
