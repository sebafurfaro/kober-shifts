"use client";

import { DollarSign } from "lucide-react";
import { MetricCard } from "./MetricCard";

export interface RevenueMetricCardProps {
  totalMonth: number;
  totalYear: number;
  period: "month" | "year";
  onPeriodChange: (period: "month" | "year") => void;
}

/** Tarjeta de métrica de ingresos (revenue). Valor en ARS con formato local. */
export function RevenueMetricCard({
  totalMonth,
  totalYear,
  period,
  onPeriodChange,
}: RevenueMetricCardProps) {
  const value = period === "month" ? totalMonth : totalYear;
  return (
    <MetricCard
      title="Ingresos"
      value={`$${value.toLocaleString("es-AR")}`}
      subtitle="ARS"
      icon={<DollarSign className="w-5 h-5" />}
      className="bg-linear-to-br from-emerald-600 to-emerald-500"
      period={period}
      onPeriodChange={onPeriodChange}
    />
  );
}
