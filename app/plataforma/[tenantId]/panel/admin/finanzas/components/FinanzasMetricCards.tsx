"use client";

import { Card, CardBody } from "@heroui/react";
import { ArrowDown, ArrowUp, BanknoteArrowUp, BanknoteArrowDown, ChartArea } from "lucide-react";

function formatArs(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
    n
  );
}

function TrendLine(props: {
  changePercent: number | null;
  /** ingresos | balance: más es bueno. egresos: más es malo */
  polarity: "more-is-good" | "more-is-bad";
}) {
  const { changePercent, polarity } = props;
  if (changePercent == null || Number.isNaN(changePercent)) {
    return <span className="text-xs text-default-600">sin dato previo</span>;
  }
  const up = changePercent > 0;
  const flat = Math.abs(changePercent) < 0.05;
  if (flat) {
    return <span className="text-xs text-default-700">0% vs período anterior</span>;
  }
  const good =
    polarity === "more-is-good" ? up : !up;
  const Icon = up ? ArrowUp : ArrowDown;
  const color = good ? "text-success" : "text-danger";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {Math.abs(changePercent).toFixed(0)}% vs período anterior
    </span>
  );
}

export function FinanzasMetricCards(props: {
  ingresos: { value: number; changePercent: number | null };
  egresos: { value: number; changePercent: number | null };
  balance: { value: number; changePercent: number | null };
}) {
  const { ingresos, egresos, balance } = props;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border border-green-200 bg-green-100/20 text-green-700 shadow-sm">
        <CardBody className="gap-3 p-5">
          <div className="flex items-center gap-2">
            <BanknoteArrowUp className="w-5 h-5 text-green-700" />
            <span className="text-sm font-medium text-green-700">Ingresos</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-green-700">{formatArs(ingresos.value)}</p>
          <TrendLine changePercent={ingresos.changePercent} polarity="more-is-good" />
        </CardBody>
      </Card>
      <Card className="border border-danger-200 bg-danger-100/20 text-danger-700 shadow-sm">
        <CardBody className="gap-3 p-5">
          <div className="flex items-center gap-2">
            <BanknoteArrowDown className="w-5 h-5 text-danger-700" />
            <span className="text-sm font-medium text-danger-700">Egresos</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-danger-700">{formatArs(egresos.value)}</p>
          <TrendLine changePercent={egresos.changePercent} polarity="more-is-bad" />
        </CardBody>
      </Card>
      <Card className="border border-blue-200 bg-blue-100/20 text-blue-700 shadow-sm">
        <CardBody className="gap-3 p-5">
          <div className="flex items-center gap-2">
            <ChartArea className="w-5 h-5 text-blue-700" />
            <span className="text-sm font-medium text-blue-700">Balance neto</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-blue-700">{formatArs(balance.value)}</p>
          <TrendLine changePercent={balance.changePercent} polarity="more-is-good" />
        </CardBody>
      </Card>
    </div>
  );
}
