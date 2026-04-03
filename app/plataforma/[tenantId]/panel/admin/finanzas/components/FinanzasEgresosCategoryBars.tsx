"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import Typography from "@/app/components/Typography";

function formatArs(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
    n
  );
}

export function FinanzasEgresosCategoryBars(props: {
  items: { category: string; amount: number; percent: number }[];
}) {
  const { items } = props;
  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <Card className="border border-default-200 shadow-sm h-full">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <Typography variant="h6">Egresos por categoría</Typography>
        <p className="text-sm text-default-500">En el período seleccionado</p>
      </CardHeader>
      <CardBody className="gap-4 pt-2">
        {items.length === 0 ? (
          <p className="text-sm text-default-500">No hay egresos en este período</p>
        ) : (
          items.map((row) => (
            <div key={row.category} className="space-y-1">
              <div className="flex justify-between text-sm gap-2">
                <span className="font-medium truncate">{row.category}</span>
                <span className="text-default-500 shrink-0">
                  {formatArs(row.amount)} · {row.percent.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-default-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-warning/80"
                  style={{ width: `${(row.amount / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
