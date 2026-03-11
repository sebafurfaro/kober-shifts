"use client";

import * as React from "react";
import { Card } from "@heroui/react";
import { Skeleton } from "@heroui/react";

export interface TableSkeletonProps {
  /** Número de filas a mostrar (default 5) */
  rows?: number;
  /** Número de celdas por fila (default 4) */
  columns?: number;
}

/**
 * Skeleton que imita una tabla dentro de un Card.
 * Uso: <WithSkeleton isLoading={loading} fallback={<TableSkeleton rows={6} columns={5} />}>...
 */
export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <Card className="card">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex gap-4 border-b border-gray-200 pb-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 rounded" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className="h-8 flex-1 rounded"
                style={{ maxWidth: colIdx === 0 ? "30%" : undefined }}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
