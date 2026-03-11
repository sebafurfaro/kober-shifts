"use client";

import * as React from "react";

export interface WithSkeletonProps {
  /** Cuando true se muestra el skeleton en lugar del contenido (alias: loading) */
  isLoading?: boolean;
  /** Alias de isLoading por compatibilidad */
  loading?: boolean;
  /** Contenido a mostrar mientras carga (opcional; si no se pasa, se muestran los children) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Envuelve cualquier contenido y muestra un skeleton (fallback) mientras isLoading/loading es true.
 * Uso escalado por componente:
 *
 * <WithSkeleton isLoading={loading} fallback={<MetricCardSkeleton />}>
 *   <AppointmentsMetricCard ... />
 * </WithSkeleton>
 */
export function WithSkeleton({ isLoading, loading, fallback, children }: WithSkeletonProps) {
  const showSkeleton = isLoading ?? loading ?? false;
  if (showSkeleton && fallback != null) return <>{fallback}</>;
  return <>{children}</>;
}
