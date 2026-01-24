"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/react";
import dynamic from "next/dynamic";
import type { AnalyticsStats } from "./types";
import { baseChartOptions } from "./chartConfig";
import type { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DailyChartProps {
  stats: AnalyticsStats | null;
}

export function DailyChart({ stats }: DailyChartProps) {
  const chartData = React.useMemo(() => {
    if (!stats?.daily || stats.daily.length === 0) {
      return null;
    }

    const categories = stats.daily.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString("es-AR", { month: "short", day: "numeric" });
    });

    const series = [
      {
        name: "Turnos",
        data: stats.daily.map((d) => d.count),
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
  }, [stats?.daily]);

  return (
    <Card className="">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Turnos por Día (Últimos 30 días)
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
            lineColor="#92FE9D"
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
