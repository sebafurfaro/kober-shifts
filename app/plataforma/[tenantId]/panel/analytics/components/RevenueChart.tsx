"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/react";
import dynamic from "next/dynamic";
import type { AnalyticsMetrics } from "./types";
import { baseChartOptions } from "./chartConfig";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

interface RevenueChartProps {
  metrics: AnalyticsMetrics | null;
}

export function RevenueChart({ metrics }: RevenueChartProps) {
  const chartData = React.useMemo(() => {
    const byMonth = metrics?.revenue?.byMonth;
    const hasData = byMonth?.length;

    const currentYear = new Date().getFullYear();
    const emptyCategories = MONTH_NAMES.map((m) => `${m} ${currentYear}`);
    const emptyData = MONTH_NAMES.map(() => 0);

    const categories = hasData
      ? byMonth!.map((m) => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
      : emptyCategories;
    const series = [
      {
        name: "Ingresos (ARS)",
        data: hasData ? byMonth!.map((m) => m.total) : emptyData,
      },
    ];

    const options: ApexOptions = {
      ...baseChartOptions,
      xaxis: {
        ...baseChartOptions.xaxis,
        categories,
        tickAmount: categories.length,
      },
      yaxis: {
        ...baseChartOptions.yaxis,
        min: 0,
        max: hasData ? undefined : 1,
        forceNiceScale: true,
        labels: {
          ...baseChartOptions.yaxis?.labels,
          formatter: (val: number) => `$${val.toLocaleString("es-AR")}`,
        },
      },
    };
    return { options, series, empty: !hasData };
  }, [metrics?.revenue?.byMonth]);

  return (
    <Card className="mb-8">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Ingresos por mes
        </h3>
        <div className="relative">
          <Chart
            options={chartData.options}
            series={chartData.series}
            type="bar"
            height={300}
          />
          {chartData.empty && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-gray-500 text-sm">
              No hay datos de ingresos para el período seleccionado
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
