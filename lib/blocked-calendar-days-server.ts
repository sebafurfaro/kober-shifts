import { getTenantSettingsRow } from "@/lib/settings-db";
import { appointmentStartDateYMDInBuenosAires, normalizeBlockedCalendarDays, normalizeHolidayAgendaAllowDays } from "@/lib/blocked-calendar-days";
import { fetchArgentinaNationalHolidayYmdsForYear } from "@/lib/argentina-national-holidays";

/**
 * Solo para API / Node. No importar desde componentes cliente (evita arrastrar mysql2 al bundle).
 */
export async function getTenantCalendarBlockSettings(tenantId: string): Promise<{
  blockedCalendarDays: string[];
  blockAgendaOnNationalHolidays: boolean;
  holidayAgendaAllowDays: string[];
}> {
  const row = await getTenantSettingsRow(tenantId).catch(() => null);
  const s =
    row?.settings && typeof row.settings === "object" ? (row.settings as Record<string, unknown>) : {};
  return {
    blockedCalendarDays: normalizeBlockedCalendarDays(s.blockedCalendarDays),
    blockAgendaOnNationalHolidays: s.blockAgendaOnNationalHolidays === true,
    holidayAgendaAllowDays: normalizeHolidayAgendaAllowDays(s.holidayAgendaAllowDays),
  };
}

/** Incluye bloqueo manual y feriados nacionales según configuración. */
export async function isStartAtBlockedForTenant(tenantId: string, startAt: Date): Promise<boolean> {
  const settings = await getTenantCalendarBlockSettings(tenantId);
  const ymd = appointmentStartDateYMDInBuenosAires(startAt);
  if (settings.blockedCalendarDays.includes(ymd)) return true;
  if (!settings.blockAgendaOnNationalHolidays) return false;
  if (settings.holidayAgendaAllowDays.includes(ymd)) return false;
  const year = Number(ymd.slice(0, 4));
  const national = await fetchArgentinaNationalHolidayYmdsForYear(year);
  return national.has(ymd);
}
