"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import Typography from "@/app/components/Typography";
import { useMemo } from "react";
import { isToday, isYesterday } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { BUENOS_AIRES_TIMEZONE } from "@/lib/timezone";
import { ArrowDown, ArrowUp } from "lucide-react";

const TZ = BUENOS_AIRES_TIMEZONE;

function formatArs(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
    n
  );
}

function safeDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function relativeDay(iso: string): string {
  const d = safeDate(iso);
  if (!d) return "—";
  if (isToday(d)) return "hoy";
  if (isYesterday(d)) return "ayer";
  try {
    return formatInTimeZone(d, TZ, "d MMM");
  } catch {
    return "—";
  }
}

export function FinanzasMovementsFeed(props: {
  movements: {
    kind: "income" | "expense";
    title: string;
    subtitle: string | null;
    amount: number;
    at: string;
  }[];
}) {
  const { movements } = props;
  const sorted = useMemo(() => {
    return [...movements].sort((a, b) => {
      const tb = safeDate(b.at)?.getTime() ?? 0;
      const ta = safeDate(a.at)?.getTime() ?? 0;
      return tb - ta;
    });
  }, [movements]);

  return (
    <Card className="border border-default-200 shadow-sm h-full">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <Typography variant="h6">Últimos movimientos</Typography>
        <p className="text-sm text-default-500">Ingresos y egresos del período</p>
      </CardHeader>
      <CardBody className="gap-0 divide-y divide-default-100 pt-2 max-h-[420px] overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-sm text-default-500 py-4">No hay movimientos en este período</p>
        ) : (
          sorted.map((m, i) => {
            const inc = m.kind === "income";
            const line = m.subtitle ? `${m.title} — ${m.subtitle}` : m.title;
            return (
              <div key={`${m.at}-${i}`} className="flex items-start gap-3 py-3 first:pt-0">
                <span className="mt-0.5 text-default-500" aria-hidden>
                  {inc ? <ArrowUp className="w-4 h-4 text-success" /> : <ArrowDown className="w-4 h-4 text-danger" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">{line}</p>
                  <p className="text-xs text-default-500">{relativeDay(m.at)}</p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums shrink-0 ${inc ? "text-success" : "text-danger"}`}
                >
                  {inc ? "+" : ""}
                  {formatArs(m.amount)}
                </span>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
