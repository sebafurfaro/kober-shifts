"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/react";
import { XCircle, TrendingUp, TrendingDown } from "lucide-react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface CancellationsMetricCardProps {
  totalMonth?: number;
  totalYear?: number;
  /** Datos por mes para el evolutivo (column chart) */
  byMonth?: Array<{ year: number; month: number; count: number }>;
}

export function CancellationsMetricCard({
  totalMonth = 0,
  byMonth = [],
}: CancellationsMetricCardProps) {
  // Ensure we have at least a few data points for the graph to look like a graph
  const series = React.useMemo(() => {
    const arr = Array.isArray(byMonth) ? byMonth : [];
    // Extract actual data
    let data = arr.map((m) => Number(m.count));

    // If we have less than 5 months of data, pad with 0s at the start
    if (data.length < 5) {
      const zerosNeeded = 5 - data.length;
      const zeros = new Array(zerosNeeded).fill(0);
      data = [...zeros, ...data];
    } else {
      // Take last 12 months
      data = data.slice(-12);
    }

    return [
      {
        name: "Cancelaciones",
        data: data,
      },
    ];
  }, [byMonth]);

  const percentageChange = React.useMemo(() => {
    if (!byMonth || byMonth.length < 2) return 0;
    const current = byMonth[byMonth.length - 1].count;
    const prev = byMonth[byMonth.length - 2].count;
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  }, [byMonth]);

  // For cancellations, increase is usually "bad", decrease is "good".
  // But visually, trending up usually means "more cancellations".
  // Let's keep logic simple: arrow matches direction.
  // Color: Red if cancellations went UP, Green if cancellations went DOWN.
  const isIncrease = percentageChange > 0;
  const isDecrease = percentageChange < 0;

  const chartOptions: ApexOptions = React.useMemo(
    () => ({
      chart: {
        type: "bar",
        height: 80, // Explicit height
        sparkline: { enabled: true },
        toolbar: { show: false },
        fontFamily: "Inter, sans-serif",
        animations: { enabled: true }
      },
      plotOptions: {
        bar: {
          columnWidth: "60%",
          borderRadius: 4,
          borderRadiusApplication: "end",
          colors: {
            backgroundBarColors: ['transparent'],
          }
        },
      },
      colors: ["#f43f5e"], // Rose-500
      fill: {
        type: "gradient",
        gradient: {
          type: "vertical",
          shadeIntensity: 1,
          opacityFrom: 1,
          opacityTo: 0.6,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: "#fb7185", // rose-400
              opacity: 1,
            },
            {
              offset: 100,
              color: "#fda4af", // rose-300
              opacity: 0.6,
            },
          ],
        },
      },
      tooltip: {
        enabled: true,
        theme: "light",
        y: {
          formatter: function (val) {
            return val.toString();
          },
        },
      },
      states: {
        hover: { filter: { type: "none" } },
        active: { filter: { type: "none" } },
      },
    }),
    []
  );

  return (
    <Card className="bg-white shadow-sm border border-gray-100 h-full">
      <CardBody className="p-6 flex flex-row items-end justify-between">
        {/* Left Side: Metric Info */}
        <div className="flex flex-col gap-1 w-1/2">
          <p className="text-gray-500 font-medium text-sm">Cancelaciones (Mes)</p>

          <div className="flex items-center gap-2 mt-1">
            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-md">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-gray-800">
              {Number(totalMonth).toLocaleString("es-AR")}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 text-sm font-semibold mt-2 ${isIncrease ? "text-rose-500" : isDecrease ? "text-emerald-500" : "text-gray-500"
              }`}
          >
            {percentageChange >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(percentageChange).toFixed(1)}%
            <span className="text-gray-400 font-normal ml-1 text-xs">
              vs mes anterior
            </span>
          </div>
        </div>

        {/* Right Side: Bar Chart */}
        <div className="w-1/2 h-20 flex flex-col justify-end pl-4 relative">
          <Chart
            options={chartOptions}
            series={series}
            type="bar"
            height={80}
            width="100%"
          />
        </div>
      </CardBody>
    </Card>
  );
}
