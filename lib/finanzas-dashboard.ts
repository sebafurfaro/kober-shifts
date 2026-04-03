import mysql from "./mysql";
import { ensureTenantExpensesTable } from "./tenant-expenses";
import { ensurePaymentsTable } from "./mercadopago-payments";
import { subMonths, format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { BUENOS_AIRES_TIMEZONE } from "./timezone";

export type FinanzasPeriodKey = "month" | "3m" | "6m" | "year";

const TZ = BUENOS_AIRES_TIMEZONE;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Último día del mes calendario (1-12). */
function lastDayOfCalendarMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

/** Inicio y fin como strings MySQL (sesión -03:00). */
export function getFinanzasPeriodRange(
  key: FinanzasPeriodKey,
  ref: Date = new Date()
): { start: string; end: string; label: string; startDate: Date; endDate: Date } {
  const y = Number(formatInTimeZone(ref, TZ, "yyyy"));
  const m = Number(formatInTimeZone(ref, TZ, "MM"));

  if (key === "month") {
    const start = `${y}-${pad2(m)}-01 00:00:00`;
    const ld = lastDayOfCalendarMonth(y, m);
    const end = `${y}-${pad2(m)}-${pad2(ld)} 23:59:59`;
    const label = formatInTimeZone(ref, TZ, "MMMM yyyy", { locale: esLocale });
    return {
      start,
      end,
      label,
      startDate: new Date(`${y}-${pad2(m)}-01T00:00:00-03:00`),
      endDate: new Date(`${y}-${pad2(m)}-${pad2(ld)}T23:59:59-03:00`),
    };
  }
  if (key === "3m") {
    const ey = Number(formatInTimeZone(ref, TZ, "yyyy"));
    const em = Number(formatInTimeZone(ref, TZ, "MM"));
    const startD = subMonths(ref, 2);
    const sy = Number(formatInTimeZone(startD, TZ, "yyyy"));
    const sm = Number(formatInTimeZone(startD, TZ, "MM"));
    const start = `${sy}-${pad2(sm)}-01 00:00:00`;
    const ld = lastDayOfCalendarMonth(ey, em);
    const end = `${ey}-${pad2(em)}-${pad2(ld)} 23:59:59`;
    return {
      start,
      end,
      label: "Últimos 3 meses",
      startDate: new Date(`${sy}-${pad2(sm)}-01T00:00:00-03:00`),
      endDate: new Date(`${ey}-${pad2(em)}-${pad2(ld)}T23:59:59-03:00`),
    };
  }
  if (key === "6m") {
    const ey = Number(formatInTimeZone(ref, TZ, "yyyy"));
    const em = Number(formatInTimeZone(ref, TZ, "MM"));
    const startD = subMonths(ref, 5);
    const sy = Number(formatInTimeZone(startD, TZ, "yyyy"));
    const sm = Number(formatInTimeZone(startD, TZ, "MM"));
    const start = `${sy}-${pad2(sm)}-01 00:00:00`;
    const ld = lastDayOfCalendarMonth(ey, em);
    const end = `${ey}-${pad2(em)}-${pad2(ld)} 23:59:59`;
    return {
      start,
      end,
      label: "Últimos 6 meses",
      startDate: new Date(`${sy}-${pad2(sm)}-01T00:00:00-03:00`),
      endDate: new Date(`${ey}-${pad2(em)}-${pad2(ld)}T23:59:59-03:00`),
    };
  }
  const start = `${y}-01-01 00:00:00`;
  const end = `${y}-12-31 23:59:59`;
  return {
    start,
    end,
    label: `Año ${y}`,
    startDate: new Date(`${y}-01-01T00:00:00-03:00`),
    endDate: new Date(`${y}-12-31T23:59:59-03:00`),
  };
}

export function getPreviousFinanzasPeriodRange(
  key: FinanzasPeriodKey,
  ref: Date = new Date()
): { start: string; end: string; startYmd: string; endYmd: string } {
  if (key === "month") {
    const r = getFinanzasPeriodRange("month", subMonths(ref, 1));
    return {
      start: r.start,
      end: r.end,
      startYmd: r.start.slice(0, 10),
      endYmd: r.end.slice(0, 10),
    };
  }
  if (key === "3m") {
    const r = getFinanzasPeriodRange("3m", subMonths(ref, 3));
    return {
      start: r.start,
      end: r.end,
      startYmd: r.start.slice(0, 10),
      endYmd: r.end.slice(0, 10),
    };
  }
  if (key === "6m") {
    const r = getFinanzasPeriodRange("6m", subMonths(ref, 6));
    return {
      start: r.start,
      end: r.end,
      startYmd: r.start.slice(0, 10),
      endYmd: r.end.slice(0, 10),
    };
  }
  const y = Number(formatInTimeZone(ref, TZ, "yyyy")) - 1;
  const start = `${y}-01-01 00:00:00`;
  const end = `${y}-12-31 23:59:59`;
  return { start, end, startYmd: `${y}-01-01`, endYmd: `${y}-12-31` };
}

/**
 * Ingresos = pagos aprobados del negocio:
 * 1) mercadopago_payments en approved / fully_paid (misma lógica que Cobros/Pagos).
 * 2) appointment_payments aprobados solo si no hay fila en mercadopago_payments para ese turno
 *    (evita duplicar cuando MP y checkout coexisten).
 */
async function sumMercadopagoPagosAprobados(
  tenantId: string,
  startSql: string,
  endSql: string
): Promise<number> {
  await ensurePaymentsTable();
  try {
    const [rows] = await mysql.execute(
      `SELECT COALESCE(SUM(mp.amount), 0) as total
       FROM mercadopago_payments mp
       WHERE mp.tenantId = ?
         AND mp.status IN ('approved', 'fully_paid')
         AND mp.updatedAt >= ? AND mp.updatedAt <= ?`,
      [tenantId, startSql, endSql]
    );
    return Number((rows as { total: number }[])[0]?.total ?? 0);
  } catch {
    return 0;
  }
}

async function sumAppointmentPaymentsSinMercadopagoLocal(
  tenantId: string,
  startSql: string,
  endSql: string
): Promise<number> {
  await ensurePaymentsTable();
  try {
    const [rows] = await mysql.execute(
      `SELECT COALESCE(SUM(ap.amount), 0) as total
       FROM appointment_payments ap
       WHERE ap.tenantId = ?
         AND ap.status = 'approved'
         AND ap.updatedAt >= ? AND ap.updatedAt <= ?
         AND NOT EXISTS (
           SELECT 1 FROM mercadopago_payments mp
           WHERE BINARY mp.appointmentId = BINARY ap.appointmentId AND mp.tenantId = ap.tenantId
         )`,
      [tenantId, startSql, endSql]
    );
    return Number((rows as { total: number }[])[0]?.total ?? 0);
  } catch {
    return 0;
  }
}

export async function sumIngresos(
  tenantId: string,
  startSql: string,
  endSql: string
): Promise<number> {
  const mp = await sumMercadopagoPagosAprobados(tenantId, startSql, endSql);
  const apSolo = await sumAppointmentPaymentsSinMercadopagoLocal(tenantId, startSql, endSql);
  return mp + apSolo;
}

export async function sumEgresos(tenantId: string, startYmd: string, endYmd: string): Promise<number> {
  await ensureTenantExpensesTable();
  const [rows] = await mysql.execute(
    `SELECT COALESCE(SUM(amount), 0) as total FROM tenant_expenses
     WHERE tenantId = ? AND expenseDate >= ? AND expenseDate <= ?`,
    [tenantId, startYmd.slice(0, 10), endYmd.slice(0, 10)]
  );
  return Number((rows as { total: number }[])[0]?.total ?? 0);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export type MonthlyBarPoint = {
  year: number;
  month: number;
  label: string;
  ingresos: number;
  egresos: number;
};

export async function getLastSixMonthsSeries(tenantId: string): Promise<MonthlyBarPoint[]> {
  const ref = new Date();
  const points: MonthlyBarPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(ref, i);
    const y = Number(formatInTimeZone(d, TZ, "yyyy"));
    const m = Number(formatInTimeZone(d, TZ, "MM"));
    const start = `${y}-${pad2(m)}-01 00:00:00`;
    const ld = lastDayOfCalendarMonth(y, m);
    const end = `${y}-${pad2(m)}-${pad2(ld)} 23:59:59`;
    const ymdStart = `${y}-${pad2(m)}-01`;
    const ymdEnd = `${y}-${pad2(m)}-${pad2(ld)}`;
    const ingresos = await sumIngresos(tenantId, start, end);
    const egresos = await sumEgresos(tenantId, ymdStart, ymdEnd);
    points.push({
      year: y,
      month: m,
      label: format(new Date(y, m - 1, 1), "MMM", { locale: esLocale }),
      ingresos,
      egresos,
    });
  }
  return points;
}

export type CategorySlice = { category: string; amount: number; percent: number };

export async function getEgresosByCategory(
  tenantId: string,
  startYmd: string,
  endYmd: string
): Promise<CategorySlice[]> {
  await ensureTenantExpensesTable();
  const [rows] = await mysql.execute(
    `SELECT category, COALESCE(SUM(amount), 0) as total
     FROM tenant_expenses
     WHERE tenantId = ? AND expenseDate >= ? AND expenseDate <= ?
     GROUP BY category
     ORDER BY total DESC`,
    [tenantId, startYmd.slice(0, 10), endYmd.slice(0, 10)]
  );
  const list = (rows as { category: string; total: number }[]).map((r) => ({
    category: r.category,
    amount: Number(r.total),
    percent: 0,
  }));
  const sum = list.reduce((s, x) => s + x.amount, 0);
  if (sum > 0) {
    for (const x of list) x.percent = Math.round((x.amount / sum) * 1000) / 10;
  }
  return list;
}

export type MovementRow = {
  kind: "income" | "expense";
  title: string;
  subtitle: string | null;
  amount: number;
  at: string;
};

function toValidIso(d: unknown): string | null {
  const u = d instanceof Date ? d : new Date(String(d ?? ""));
  return Number.isFinite(u.getTime()) ? u.toISOString() : null;
}

export async function getRecentMovements(
  tenantId: string,
  startSql: string,
  endSql: string,
  startYmd: string,
  endYmd: string,
  limit: number
): Promise<MovementRow[]> {
  const movements: MovementRow[] = [];
  await ensurePaymentsTable();

  try {
    const [apRows] = await mysql.execute(
      `SELECT ap.amount, ap.updatedAt,
              COALESCE(s.name, 'Servicio') as serviceName,
              COALESCE(u.name, TRIM(CONCAT(COALESCE(a.patientFirstName,''), ' ', COALESCE(a.patientLastName,'')))) as patientName
       FROM appointment_payments ap
       INNER JOIN appointments a ON a.id = ap.appointmentId AND a.tenantId = ap.tenantId
       LEFT JOIN services s ON s.id = a.serviceId AND s.tenantId = a.tenantId
       LEFT JOIN users u ON u.id = a.patientId AND u.tenantId = a.tenantId
       WHERE ap.tenantId = ? AND ap.status = 'approved' AND ap.updatedAt >= ? AND ap.updatedAt <= ?
         AND NOT EXISTS (
           SELECT 1 FROM mercadopago_payments mp
           WHERE BINARY mp.appointmentId = BINARY ap.appointmentId AND mp.tenantId = ap.tenantId
         )`,
      [tenantId, startSql, endSql]
    );
    for (const r of apRows as Record<string, unknown>[]) {
      const amt = Number(r.amount);
      const serviceName = String(r.serviceName ?? "Servicio");
      const patient = String(r.patientName ?? "").trim() || "Paciente";
      const at = toValidIso(r.updatedAt);
      if (!at) continue;
      movements.push({
        kind: "income",
        title: serviceName,
        subtitle: patient,
        amount: amt,
        at,
      });
    }
  } catch {
    /* */
  }

  try {
    const [mpRows] = await mysql.execute(
      `SELECT mp.amount, mp.updatedAt,
              COALESCE(s.name, 'Servicio') as serviceName,
              COALESCE(u.name, TRIM(CONCAT(COALESCE(a.patientFirstName,''), ' ', COALESCE(a.patientLastName,'')))) as patientName
       FROM mercadopago_payments mp
       INNER JOIN appointments a ON BINARY a.id = BINARY mp.appointmentId AND a.tenantId = mp.tenantId
       LEFT JOIN services s ON s.id = a.serviceId AND s.tenantId = a.tenantId
       LEFT JOIN users u ON u.id = a.patientId AND u.tenantId = a.tenantId
       WHERE mp.tenantId = ?
         AND mp.status IN ('approved', 'fully_paid')
         AND mp.updatedAt >= ? AND mp.updatedAt <= ?`,
      [tenantId, startSql, endSql]
    );
    for (const r of mpRows as Record<string, unknown>[]) {
      const amt = Number(r.amount);
      const serviceName = String(r.serviceName ?? "Servicio");
      const patient = String(r.patientName ?? "").trim() || "Paciente";
      const at = toValidIso(r.updatedAt);
      if (!at) continue;
      movements.push({
        kind: "income",
        title: serviceName,
        subtitle: patient,
        amount: amt,
        at,
      });
    }
  } catch {
    /* */
  }

  await ensureTenantExpensesTable();
  try {
    const [exRows] = await mysql.execute(
      `SELECT title, category, amount, expenseDate, createdAt
       FROM tenant_expenses
       WHERE tenantId = ? AND expenseDate >= ? AND expenseDate <= ?`,
      [tenantId, startYmd.slice(0, 10), endYmd.slice(0, 10)]
    );
    for (const r of exRows as Record<string, unknown>[]) {
      const expenseDate = String(r.expenseDate).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) continue;
      const created = r.createdAt instanceof Date ? r.createdAt : new Date(String(r.createdAt ?? ""));
      const hhmmss = Number.isFinite(created.getTime())
        ? format(created, "HH:mm:ss")
        : "12:00:00";
      const combined = new Date(`${expenseDate}T${hhmmss}`);
      const atIso = Number.isFinite(combined.getTime())
        ? combined.toISOString()
        : new Date(`${expenseDate}T15:00:00.000Z`).toISOString();
      movements.push({
        kind: "expense",
        title: String(r.title ?? ""),
        subtitle: String(r.category ?? ""),
        amount: -Math.abs(Number(r.amount)),
        at: atIso,
      });
    }
  } catch {
    /* */
  }

  movements.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return movements.slice(0, limit);
}
