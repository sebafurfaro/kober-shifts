/**
 * Skeletons reutilizables para estados de carga.
 * Uso escalado por componente:
 *
 * 1) Con wrapper WithSkeleton (recomendado):
 *    import { WithSkeleton, MetricCardSkeleton } from "@/app/plataforma/[tenantId]/panel/components/skeletons";
 *    <WithSkeleton isLoading={loading} fallback={<MetricCardSkeleton />}>
 *      <AppointmentsMetricCard ... />
 *    </WithSkeleton>
 *
 * 2) Directo en el componente:
 *    if (loading) return <MetricCardSkeleton />;
 *    return <ContenidoReal />;
 */

export { WithSkeleton } from "./WithSkeleton";
export type { WithSkeletonProps } from "./WithSkeleton";
export { MetricCardSkeleton } from "./MetricCardSkeleton";
export { TableSkeleton } from "./TableSkeleton";
export type { TableSkeletonProps } from "./TableSkeleton";
