"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/react";
import { Skeleton } from "@heroui/react";

/**
 * Skeleton que imita la forma de una tarjeta de métrica (ej. Turnos, Ingresos, Cancelaciones).
 * Uso: <WithSkeleton isLoading={loading} fallback={<MetricCardSkeleton />}>...
 */
export function MetricCardSkeleton() {
  return (
    <Card className="bg-white shadow-sm border border-gray-100 h-fit">
      <CardBody className="p-6 flex flex-row items-end justify-between">
        <div className="flex flex-col gap-2 w-1/2">
          <Skeleton className="h-4 w-24 rounded" />
          <div className="flex items-center gap-2 mt-1">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
          <Skeleton className="h-4 w-28 rounded mt-2" />
        </div>
        <div className="w-1/2 h-20 flex items-end gap-1 pl-4">
          {[40, 60, 45, 55].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
