"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/react";
import dynamic from "next/dynamic";
import type { AnalyticsStats } from "./types";
import { baseChartOptions } from "./chartConfig";
import type { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface WeeklyChartProps {
  stats: AnalyticsStats | null;
}

export function WeeklyChart({ stats }: WeeklyChartProps) {
  const chartData = React.useMemo(() => {
    if (!stats?.weekly || stats.weekly.length === 0) {
      return null;
    }

    const categories = stats.weekly.map((w) => `Semana ${w.week}/${w.year}`);

    const series = [
      {
        name: "Turnos",
        data: stats.weekly.map((w) => w.count),
      },
    ];

    const options: ApexOptions = {
      ...baseChartOptions,
      xaxis: {
        ...baseChartOptions.xaxis,
        categories,
      },
    };

    return { options, series };
  }, [stats?.weekly]);

  return (
    <Card>
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Turnos por Semana (Últimas 12 semanas)
        </h3>
        {chartData ? (
          <Chart
            options={chartData.options}
            series={chartData.series}
            type="line"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
            lineDashArray={[5, 5]}
            lineWidth={2}
            lineColor="#00C9FF"
            lineOpacity={0.8}
            lineRadius={10}
            lineRadiusOffset={10}
            height={300}
          />
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No hay datos disponibles
          </div>
        )}
      </CardBody>
    </Card>
  );
}
