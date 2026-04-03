"use client";

import { Button } from "@heroui/react";
import type { FinanzasPeriodKey } from "./types";

const OPTIONS: { key: FinanzasPeriodKey; label: string }[] = [
  { key: "month", label: "Este mes" },
  { key: "3m", label: "Últimos 3 meses" },
  { key: "6m", label: "Últimos 6 meses" },
  { key: "year", label: "Este año" },
];

export function FinanzasPeriodFilter(props: {
  value: FinanzasPeriodKey;
  onChange: (p: FinanzasPeriodKey) => void;
  disabled?: boolean;
}) {
  const { value, onChange, disabled } = props;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
      {OPTIONS.map((o) => (
        <Button
          key={o.key}
          size="sm"
          variant={value === o.key ? "solid" : "flat"}
          color={value === o.key ? "primary" : "default"}
          onPress={() => onChange(o.key)}
          isDisabled={disabled}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
