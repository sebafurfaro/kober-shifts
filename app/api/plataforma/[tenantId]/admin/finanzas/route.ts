import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import {
  getFinanzasPeriodRange,
  getPreviousFinanzasPeriodRange,
  sumIngresos,
  sumEgresos,
  percentChange,
  getLastSixMonthsSeries,
  getEgresosByCategory,
  getRecentMovements,
  type FinanzasPeriodKey,
} from "@/lib/finanzas-dashboard";

const PERIODS: FinanzasPeriodKey[] = ["month", "3m", "6m", "year"];

function parsePeriod(s: string | null): FinanzasPeriodKey {
  if (s && (PERIODS as string[]).includes(s)) return s as FinanzasPeriodKey;
  return "month";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    session.role !== Role.ADMIN &&
    session.role !== Role.PROFESSIONAL &&
    session.role !== Role.SUPERVISOR
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const period = parsePeriod(url.searchParams.get("period"));

  try {
    const cur = getFinanzasPeriodRange(period);
    const prev = getPreviousFinanzasPeriodRange(period);

    const curStartYmd = cur.start.slice(0, 10);
    const curEndYmd = cur.end.slice(0, 10);

    const [ingresosCur, ingresosPrev, egresosCur, egresosPrev, chartSix, byCategory, movements] =
      await Promise.all([
        sumIngresos(tenantId, cur.start, cur.end),
        sumIngresos(tenantId, prev.start, prev.end),
        sumEgresos(tenantId, curStartYmd, curEndYmd),
        sumEgresos(tenantId, prev.startYmd, prev.endYmd),
        getLastSixMonthsSeries(tenantId),
        getEgresosByCategory(tenantId, curStartYmd, curEndYmd),
        getRecentMovements(tenantId, cur.start, cur.end, curStartYmd, curEndYmd, 40),
      ]);

    const balanceCur = ingresosCur - egresosCur;
    const balancePrev = ingresosPrev - egresosPrev;

    return NextResponse.json({
      period: { key: period, label: cur.label },
      metrics: {
        ingresos: {
          value: ingresosCur,
          previous: ingresosPrev,
          changePercent: percentChange(ingresosCur, ingresosPrev),
        },
        egresos: {
          value: egresosCur,
          previous: egresosPrev,
          changePercent: percentChange(egresosCur, egresosPrev),
        },
        balance: {
          value: balanceCur,
          previous: balancePrev,
          changePercent: percentChange(balanceCur, balancePrev),
        },
      },
      chartSixMonths: chartSix,
      egresosByCategory: byCategory,
      movements,
    });
  } catch (error: unknown) {
    console.error("Error finanzas dashboard:", error);
    return NextResponse.json({ error: "Error al cargar finanzas" }, { status: 500 });
  }
}
