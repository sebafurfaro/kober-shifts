"use client";

import { Calendar } from "lucide-react";
import { MetricCard } from "./MetricCard";

export interface AppointmentsMetricCardProps {
  totalMonth: number;
  totalYear: number;
  period: "month" | "year";
  onPeriodChange: (period: "month" | "year") => void;
}

/** Tarjeta de métrica de turnos agendados. */
export function AppointmentsMetricCard({
  totalMonth,
  totalYear,
  period,
  onPeriodChange,
}: AppointmentsMetricCardProps) {
  const value = period === "month" ? totalMonth : totalYear;
  return (
    <MetricCard
      title="Turnos"
      value={String(value)}
      subtitle="agendados"
      icon={<Calendar className="w-5 h-5" />}
      className="bg-linear-to-br from-blue-600 to-blue-500"
      period={period}
      onPeriodChange={onPeriodChange}
    />
  );
}
