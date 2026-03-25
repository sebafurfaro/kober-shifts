import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTenantSettingsRow, updateTenantSettingsOnly } from "@/lib/settings-db";
import { Role } from "@/lib/types";
import { normalizeBlockedCalendarDays, normalizeHolidayAgendaAllowDays } from "@/lib/blocked-calendar-days";

function canAccessCalendar(session: { role: Role } | null): boolean {
  if (!session) return false;
  return session.role === Role.ADMIN || session.role === Role.PROFESSIONAL || session.role === Role.SUPERVISOR;
}

/**
 * GET /api/plataforma/[tenantId]/calendar/blocked-days
 * Lista de fechas YYYY-MM-DD (Buenos Aires) sin turnos por feriado / cierre.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessCalendar(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const row = await getTenantSettingsRow(tenantId);
    const settings = row?.settings && typeof row.settings === "object" ? (row.settings as Record<string, unknown>) : {};
    return NextResponse.json({
      blockedCalendarDays: normalizeBlockedCalendarDays(settings.blockedCalendarDays),
      blockAgendaOnNationalHolidays: settings.blockAgendaOnNationalHolidays === true,
      holidayAgendaAllowDays: normalizeHolidayAgendaAllowDays(settings.holidayAgendaAllowDays),
    });
  } catch (e) {
    console.error("blocked-days GET:", e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/**
 * PUT /api/plataforma/[tenantId]/calendar/blocked-days
 * Body: { blockedCalendarDays?: string[]; holidayAgendaAllowDays?: string[] } — listas completas normalizadas.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessCalendar(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      blockedCalendarDays?: unknown;
      holidayAgendaAllowDays?: unknown;
    };
    const row = await getTenantSettingsRow(tenantId);
    const existing =
      row?.settings && typeof row.settings === "object" ? ({ ...row.settings } as Record<string, unknown>) : {};
    const nextBlocked =
      body.blockedCalendarDays !== undefined
        ? normalizeBlockedCalendarDays(body.blockedCalendarDays)
        : normalizeBlockedCalendarDays(existing.blockedCalendarDays);
    const nextAllow =
      body.holidayAgendaAllowDays !== undefined
        ? normalizeHolidayAgendaAllowDays(body.holidayAgendaAllowDays)
        : normalizeHolidayAgendaAllowDays(existing.holidayAgendaAllowDays);
    await updateTenantSettingsOnly(tenantId, {
      ...existing,
      blockedCalendarDays: nextBlocked,
      holidayAgendaAllowDays: nextAllow,
    });
    return NextResponse.json({
      success: true,
      blockedCalendarDays: nextBlocked,
      holidayAgendaAllowDays: nextAllow,
      blockAgendaOnNationalHolidays: existing.blockAgendaOnNationalHolidays === true,
    });
  } catch (e) {
    console.error("blocked-days PUT:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
