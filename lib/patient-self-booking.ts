import { NextResponse } from "next/server";
import { getTenantSettingsRow } from "@/lib/settings-db";
import { Role } from "@/lib/types";

/**
 * Lee si el tenant permite autoreserva para pacientes (default true).
 */
export async function getPatientSelfBookingEnabled(tenantId: string): Promise<boolean> {
  const row = await getTenantSettingsRow(tenantId).catch(() => null);
  const settings =
    row?.settings && typeof row.settings === "object"
      ? (row.settings as Record<string, unknown>)
      : {};
  if (typeof settings.patientSelfBookingEnabled === "boolean") {
    return settings.patientSelfBookingEnabled;
  }
  return true;
}

type SessionLike = { role: Role; tenantId: string } | null;

/**
 * Lectura de catálogo para sacar turno (servicios, profesionales, sedes, slots):
 * - Sin sesión: solo si autoreserva está habilitada.
 * - Con sesión: mismo tenant; si es PATIENT y autoreserva off → 403.
 */
export async function ensureBookingCatalogAccess(
  session: SessionLike,
  tenantId: string
): Promise<NextResponse | null> {
  const enabled = await getPatientSelfBookingEnabled(tenantId);
  if (!session) {
    if (!enabled) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
  }
  if (session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return patientSelfBookingForbiddenResponse(session, tenantId);
}

/**
 * Si la sesión es PATIENT y el tenant deshabilitó autoreserva, devuelve NextResponse 403.
 * En cualquier otro caso devuelve null (el caller sigue).
 */
export async function patientSelfBookingForbiddenResponse(
  session: SessionLike,
  tenantId: string
): Promise<NextResponse | null> {
  if (!session || session.tenantId !== tenantId) return null;
  if (session.role !== Role.PATIENT) return null;
  const enabled = await getPatientSelfBookingEnabled(tenantId);
  if (enabled) return null;
  return NextResponse.json(
    { error: "La reserva online para pacientes está deshabilitada." },
    { status: 403 }
  );
}
