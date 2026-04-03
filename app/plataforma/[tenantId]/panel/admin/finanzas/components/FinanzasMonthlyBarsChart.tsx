"use client";

import dynamic from "next/dynamic";
import { Card, CardBody, CardHeader } from "@heroui/react";
import Typography from "@/app/components/Typography";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function FinanzasMonthlyBarsChart(props: {
  points: { label: string; ingresos: number; egresos: number }[];
}) {
  const { points } = props;
  const categories = points.map((p) => p.label);
  const series = [
    { name: "Ingresos", data: points.map((p) => Math.round(p.ingresos)) },
    { name: "Egresos", data: points.map((p) => Math.round(p.egresos)) },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
      stacked: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: "58%",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: { categories },
    yaxis: {
      labels: {
        formatter: (v: number) =>
          new Intl.NumberFormat("es-AR", {
            notation: v >= 1000 ? "compact" : "standard",
            maximumFractionDigits: 1,
          }).format(v),
      },
    },
    colors: ["#16a34a", "#ea580c"],
    legend: { position: "top", horizontalAlign: "right" },
    tooltip: {
      y: {
        formatter: (val: number) =>
          new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(val),
      },
    },
  };

  return (
    <Card className="border border-default-200 shadow-sm">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <Typography variant="h6">Ingresos y egresos (últimos 6 meses)</Typography>
        <p className="text-sm text-default-500">Evolución mensual en pesos</p>
      </CardHeader>
      <CardBody className="pt-2">
        {points.length === 0 ? (
          <p className="text-sm text-default-500 py-8 text-center">Sin datos para graficar</p>
        ) : (
          <Chart options={options} series={series} type="bar" height={320} />
        )}
      </CardBody>
    </Card>
  );
}
