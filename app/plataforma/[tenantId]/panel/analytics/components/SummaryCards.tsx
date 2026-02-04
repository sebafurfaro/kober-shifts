"use client";

import type { AnalyticsMetrics } from "./types";
import { RevenueMetricCard } from "./RevenueMetricCard";
import { AppointmentsMetricCard } from "./AppointmentsMetricCard";
import { PatientsMetricCard } from "./PatientsMetricCard";
import { CancellationsMetricCard } from "./CancellationsMetricCard";
import { WhatsAppRemindersMetricCard } from "./WhatsAppRemindersMetricCard";

export type SummaryBoxKey = "revenue" | "appointments" | "patients" | "cancellations";

export interface SummaryCardsProps {
  metrics: AnalyticsMetrics | null;
  /** Por box: 'month' | 'year'. Cada tarjeta tiene su propia selección. */
  periodByBox: Record<SummaryBoxKey, "month" | "year">;
  onPeriodChange: (box: SummaryBoxKey, period: "month" | "year") => void;
}

/**
 * Composición de las 5 tarjetas de métricas del resumen de analytics.
 * Para usar una métrica suelta en otra vista, importar el componente específico
 * (RevenueMetricCard, AppointmentsMetricCard, etc.).
 */
export function SummaryCards({
  metrics,
  periodByBox,
  onPeriodChange,
}: SummaryCardsProps) {
  const rev = metrics?.revenue;
  const app = metrics?.appointments;
  const pat = metrics?.patients;
  const can = metrics?.cancellations;
  const reminders = metrics?.reminders;

  const hasReminders = reminders != null;
  const gridCols = hasReminders ? "lg:grid-cols-5" : "lg:grid-cols-4";

  return (
    <div className="w-full mb-8">
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${gridCols}`}>
        <RevenueMetricCard
          totalMonth={rev?.totalMonth ?? 0}
          totalYear={rev?.totalYear ?? 0}
          period={periodByBox.revenue}
          onPeriodChange={(p) => onPeriodChange("revenue", p)}
        />
        <AppointmentsMetricCard
          totalMonth={app?.totalMonth ?? 0}
          totalYear={app?.totalYear ?? 0}
          period={periodByBox.appointments}
          onPeriodChange={(p) => onPeriodChange("appointments", p)}
        />
        <PatientsMetricCard
          totalMonth={pat?.totalMonth ?? 0}
          totalYear={pat?.totalYear ?? 0}
          period={periodByBox.patients}
          onPeriodChange={(p) => onPeriodChange("patients", p)}
        />
        <CancellationsMetricCard
          totalMonth={can?.totalMonth ?? 0}
          totalYear={can?.totalYear ?? 0}
          period={periodByBox.cancellations}
          onPeriodChange={(p) => onPeriodChange("cancellations", p)}
        />
        {hasReminders && (
          <WhatsAppRemindersMetricCard
            used={reminders.used}
            assigned={reminders.assigned}
          />
        )}
      </div>
    </div>
  );
}
