"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/react";
import { DollarSign } from "lucide-react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface RevenueMetricCardProps {
  /** Valor principal a mostrar (ej. total del mes) */
  totalMonth?: number;
  totalYear?: number;
  /** Datos por mes para el evolutivo (sparkline) */
  byMonth?: Array<{ year: number; month: number; total: number }>;
}

/** Tarjeta de métrica de ingresos con mini gráfico evolutivo (sin ejes). */
export function RevenueMetricCard({
  totalMonth = 0,
  byMonth,
}: RevenueMetricCardProps) {
  const series = React.useMemo(() => {
    const arr = Array.isArray(byMonth) ? byMonth : [];
    return [
      {
        name: "Ingresos",
        data: arr.length > 0 ? arr.map((m) => m.total) : [0],
      },
    ];
  }, [byMonth]);

  const chartOptions: ApexOptions = React.useMemo(
    () => ({
      chart: {
        type: "line",
        sparkline: { enabled: true },
        toolbar: { show: false },
        fontFamily: "Inter, sans-serif",
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      colors: ["rgba(255,255,255,0.95)"],
      xaxis: { labels: { show: false } },
      yaxis: { labels: { show: false } },
      grid: {
        show: false,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      tooltip: { enabled: false },
    }),
    []
  );

  return (
    <Card className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
      <CardBody className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-medium opacity-90">Ingresos</p>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-white/20 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold truncate">
              ${Number(totalMonth).toLocaleString("es-AR")}
            </p>
            <p className="text-xs opacity-80">ARS</p>
          </div>
        </div>
        <div className="h-12 -mx-1">
          <Chart
            options={chartOptions}
            series={series}
            type="line"
            height={48}
          />
        </div>
      </CardBody>
    </Card>
  );
}
