"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { RevenueMetricCard } from "./components/RevenueMetricCard";
import { AppointmentsMetricCard } from "./components/AppointmentsMetricCard";
import { CancellationsMetricCard } from "./components/CancellationsMetricCard";
import { RevenueChart } from "./components/RevenueChart";
import { PatientsTable } from "./components/PatientsTable";
import type { AnalyticsMetrics, PatientsResponse } from "./components/types";
import { useTenantLabels } from "@/lib/use-tenant-labels";

export default function AnalyticsPageClient() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const { patientLabel } = useTenantLabels();

  type BoxKey = "revenue" | "appointments" | "patients" | "cancellations";
  const [periodByBox, setPeriodByBox] = React.useState<Record<BoxKey, "month" | "year">>({
    revenue: "month",
    appointments: "month",
    patients: "month",
    cancellations: "month",
  });

  const [metrics, setMetrics] = React.useState<AnalyticsMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = React.useState(true);
  const [patientsData, setPatientsData] = React.useState<PatientsResponse | null>(null);
  const [patientsLoading, setPatientsLoading] = React.useState(false);

  // Cargar métricas (mes actual + año actual en una sola llamada)
  React.useEffect(() => {
    let cancelled = false;
    async function loadMetrics() {
      try {
        setMetricsLoading(true);
        const res = await fetch(`/api/plataforma/${tenantId}/analytics/metrics`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al cargar métricas");
        const data = await res.json();
        if (!cancelled) setMetrics(data);
      } catch (error) {
        console.error("Error loading metrics:", error);
        if (!cancelled) setMetrics(null);
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    }
    loadMetrics();
    return () => { cancelled = true; };
  }, [tenantId]);

  // Top 10 clientes (solo una página, orden por turnos totales)
  React.useEffect(() => {
    let cancelled = false;
    async function loadPatients() {
      try {
        setPatientsLoading(true);
        const res = await fetch(
          `/api/plataforma/${tenantId}/analytics/patients?page=1&limit=10&sortBy=totalAppointments`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Error al cargar clientes");
        const data = await res.json();
        if (!cancelled) setPatientsData(data);
      } catch (error) {
        console.error("Error loading patients:", error);
        if (!cancelled) setPatientsData(null);
      } finally {
        if (!cancelled) setPatientsLoading(false);
      }
    }
    loadPatients();
    return () => { cancelled = true; };
  }, [tenantId]);

  return (
    <div className="lg:max-w-7xl w-full mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Métricas</h1>
      {metricsLoading ? (
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RevenueMetricCard
              totalMonth={metrics?.revenue?.totalMonth ?? 0}
              totalYear={metrics?.revenue?.totalYear ?? 0}
              period={periodByBox.revenue}
              onPeriodChange={(p) => setPeriodByBox((prev) => ({ ...prev, revenue: p }))}
            />
            <AppointmentsMetricCard
              totalMonth={metrics?.appointments?.totalMonth ?? 0}
              totalYear={metrics?.appointments?.totalYear ?? 0}
              period={periodByBox.appointments}
              onPeriodChange={(p) => setPeriodByBox((prev) => ({ ...prev, appointments: p }))}
            />
            <CancellationsMetricCard
              totalMonth={metrics?.patients?.totalMonth ?? 0}
              totalYear={metrics?.patients?.totalYear ?? 0}
              period={periodByBox.patients}
              onPeriodChange={(p) => setPeriodByBox((prev) => ({ ...prev, patients: p }))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
            <PatientsTable
              patientsData={patientsData}
              loading={patientsLoading}
              currentPage={1}
              sortBy="totalAppointments"
              onPageChange={() => {}}
              onSortChange={() => {}}
              patientLabel={patientLabel}
              top10Only
            />
            </div>
              <RevenueChart metrics={metrics} />
          </div>
        </div>
      )}
    </div>
  );
}
