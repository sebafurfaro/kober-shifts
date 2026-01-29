"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Spinner, Card, CardBody } from "@heroui/react";
import { SummaryCards } from "./components/SummaryCards";
import { DailyChart } from "./components/DailyChart";
import { WeeklyChart } from "./components/WeeklyChart";
import { MonthlyChart } from "./components/MonthlyChart";
import { PatientsTable } from "./components/PatientsTable";
import type { AnalyticsStats, PatientsResponse } from "./components/types";
import { useTenantLabels } from "@/lib/use-tenant-labels";

export default function AnalyticsPageClient() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const { patientLabel } = useTenantLabels();

  const [stats, setStats] = React.useState<AnalyticsStats | null>(null);
  const [patientsData, setPatientsData] = React.useState<PatientsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [patientsLoading, setPatientsLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<"totalAppointments" | "cancelledAppointments">("totalAppointments");

  // Load analytics stats
  React.useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch(`/api/plataforma/${tenantId}/analytics/stats`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [tenantId]);

  // Load patients
  const loadPatients = React.useCallback(async () => {
    try {
      setPatientsLoading(true);
      const res = await fetch(
        `/api/plataforma/${tenantId}/analytics/patients?page=${currentPage}&limit=10&sortBy=${sortBy}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load patients");
      const data = await res.json();
      setPatientsData(data);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setPatientsLoading(false);
    }
  }, [tenantId, currentPage, sortBy]);

  React.useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  return (
    <div className="lg:max-w-7xl w-full mx-auto mt-8">
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <SummaryCards stats={stats} />

          <PatientsTable
            patientsData={patientsData}
            loading={patientsLoading}
            currentPage={currentPage}
            sortBy={sortBy}
            onPageChange={setCurrentPage}
            onSortChange={setSortBy}
            patientLabel={patientLabel}
          />

          <Card className="mt-6 opacity-50">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Top 10 Prestaciones Más Usadas
              </h3>
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                Esta funcionalidad está deshabilitada por el momento
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
