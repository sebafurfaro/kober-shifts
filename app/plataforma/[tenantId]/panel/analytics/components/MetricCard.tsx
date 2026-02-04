"use client";

import * as React from "react";
import { Card, CardBody, Button } from "@heroui/react";

export interface MetricCardProps {
  /** Título de la tarjeta (ej. "Ingresos", "Turnos") */
  title: string;
  /** Valor principal a mostrar */
  value: string | number;
  /** Texto secundario bajo el valor (ej. "ARS", "agendados") */
  subtitle: string;
  /** Icono a mostrar */
  icon: React.ReactNode;
  /** Clases CSS para el fondo de la card (ej. gradiente) */
  className?: string;
  /** Si se define, se muestran los botones Mes/Año */
  period?: "month" | "year";
  /** Callback al cambiar período (solo tiene efecto si period está definido) */
  onPeriodChange?: (period: "month" | "year") => void;
}

/**
 * Tarjeta reutilizable para mostrar una métrica con opcional selector Mes/Año.
 * Se puede usar en cualquier vista que necesite mostrar un KPI.
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  className = "",
  period,
  onPeriodChange,
}: MetricCardProps) {
  return (
    <Card className={`${className} text-white`}>
      <CardBody className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-medium opacity-90">{title}</p>
          {period != null && onPeriodChange && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={period === "month" ? "flat" : "bordered"}
                className="min-w-12 text-white border-white/40"
                onPress={() => onPeriodChange("month")}
              >
                Mes
              </Button>
              <Button
                size="sm"
                variant={period === "year" ? "flat" : "bordered"}
                className="min-w-12 text-white border-white/40"
                onPress={() => onPeriodChange("year")}
              >
                Año
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-lg shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="text-xl font-bold truncate">{value}</p>
            <p className="text-xs opacity-80">{subtitle}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
