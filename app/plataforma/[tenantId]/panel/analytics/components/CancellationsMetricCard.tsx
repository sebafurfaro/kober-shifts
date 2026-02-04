"use client";

import { XCircle } from "lucide-react";
import { MetricCard } from "./MetricCard";

export interface CancellationsMetricCardProps {
  totalMonth: number;
  totalYear: number;
  period: "month" | "year";
  onPeriodChange: (period: "month" | "year") => void;
}

/** Tarjeta de métrica de cancelaciones en el período. */
export function CancellationsMetricCard({
  totalMonth,
  totalYear,
  period,
  onPeriodChange,
}: CancellationsMetricCardProps) {
  const value = period === "month" ? totalMonth : totalYear;
  return (
    <MetricCard
      title="Cancelaciones"
      value={String(value)}
      subtitle="en el período"
      icon={<XCircle className="w-5 h-5" />}
      className="bg-linear-to-br from-rose-600 to-rose-500"
      period={period}
      onPeriodChange={onPeriodChange}
    />
  );
}
