"use client";

import { MessageCircle } from "lucide-react";
import { MetricCard } from "./MetricCard";

export interface WhatsAppRemindersMetricCardProps {
  used: number;
  assigned: number;
}

/** Tarjeta de métrica de recordatorios WhatsApp (usados / asignados). Sin selector Mes/Año. */
export function WhatsAppRemindersMetricCard({ used, assigned }: WhatsAppRemindersMetricCardProps) {
  return (
    <MetricCard
      title="Recordatorios WhatsApp"
      value={`${used} / ${assigned}`}
      subtitle="usados del total asignado"
      icon={<MessageCircle className="w-5 h-5" />}
      className="bg-linear-to-br from-teal-600 to-teal-500"
    />
  );
}
