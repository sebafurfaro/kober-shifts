import { formatInTimeZone } from "date-fns-tz";
import { BUENOS_AIRES_TIMEZONE } from "@/lib/timezone";

/** Normaliza y deduplica fechas YYYY-MM-DD guardadas en tenant settings. */
export function normalizeBlockedCalendarDays(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out = new Set<string>();
  for (const d of raw) {
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) out.add(d);
  }
  return [...out].sort();
}

export function appointmentStartDateYMDInBuenosAires(startAt: Date): string {
  return formatInTimeZone(startAt, BUENOS_AIRES_TIMEZONE, "yyyy-MM-dd");
}

export function isTenantCalendarDayBlocked(startAt: Date, blocked: string[]): boolean {
  const ymd = appointmentStartDateYMDInBuenosAires(startAt);
  return blocked.includes(ymd);
}

/** Misma forma que `blockedCalendarDays`: fechas YYYY-MM-DD donde se permite agenda aunque sea feriado (si aplica la regla global). */
export function normalizeHolidayAgendaAllowDays(raw: unknown): string[] {
  return normalizeBlockedCalendarDays(raw);
}

/**
 * Día sin turnos: bloqueo manual, o feriado nacional con regla activa y sin excepción.
 * `nationalHolidayYmds` debe incluir el `ymd` si es feriado (p. ej. API Argentina Datos).
 */
export function isEffectiveCalendarDayBlocked(
  ymd: string,
  opts: {
    blockedCalendarDays: string[];
    blockAgendaOnNationalHolidays: boolean;
    holidayAgendaAllowDays: string[];
    nationalHolidayYmds: Set<string>;
  }
): boolean {
  if (opts.blockedCalendarDays.includes(ymd)) return true;
  if (!opts.blockAgendaOnNationalHolidays) return false;
  if (opts.holidayAgendaAllowDays.includes(ymd)) return false;
  return opts.nationalHolidayYmds.has(ymd);
}
