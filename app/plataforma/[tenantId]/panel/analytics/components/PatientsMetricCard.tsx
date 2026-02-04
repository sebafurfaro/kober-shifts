"use client";

import { Users } from "lucide-react";
import { MetricCard } from "./MetricCard";

export interface PatientsMetricCardProps {
  totalMonth: number;
  totalYear: number;
  period: "month" | "year";
  onPeriodChange: (period: "month" | "year") => void;
}

/** Tarjeta de métrica de clientes/pacientes registrados. */
export function PatientsMetricCard({
  totalMonth,
  totalYear,
  period,
  onPeriodChange,
}: PatientsMetricCardProps) {
  const value = period === "month" ? totalMonth : totalYear;
  return (
    <MetricCard
      title="Clientes"
      value={String(value)}
      subtitle="registrados"
      icon={<Users className="w-5 h-5" />}
      className="bg-linear-to-br from-violet-600 to-violet-500"
      period={period}
      onPeriodChange={onPeriodChange}
    />
  );
}
