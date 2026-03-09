import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/store-session";
import { getTenantSettingsRow, updateTenantSettingsOnly } from "@/lib/settings-db";

const ALLOWED_EMAILS = ["seba.furfaro@gmail.com", "caourisaldana@gmail.com"].map((e) => e.toLowerCase());

async function validateStoreAccess() {
  const session = await getStoreSession();
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }
  if (!ALLOWED_EMAILS.includes(session.email.toLowerCase())) {
    return { error: "Forbidden", status: 403 };
  }
  return { session };
}

const DEFAULT_TRANSLATIONS = {
  patientLabel: "Pacientes",
  professionalLabel: "Profesionales",
};

/**
 * GET /api/store/tenants/[id]/settings
 * Get tenant translations (labels) from MySQL. Used by Store to edit per-tenant.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateStoreAccess();
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { id: tenantId } = await params;
  if (!tenantId) {
    return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });
  }

  try {
    const row = await getTenantSettingsRow(tenantId);
    const settings = row?.settings && typeof row.settings === "object" ? row.settings : {};

    const patientLabel =
      typeof (settings as { patientLabel?: string }).patientLabel === "string" &&
      (settings as { patientLabel: string }).patientLabel.trim()
        ? (settings as { patientLabel: string }).patientLabel.trim()
        : DEFAULT_TRANSLATIONS.patientLabel;
    const professionalLabel =
      typeof (settings as { professionalLabel?: string }).professionalLabel === "string" &&
      (settings as { professionalLabel: string }).professionalLabel.trim()
        ? (settings as { professionalLabel: string }).professionalLabel.trim()
        : DEFAULT_TRANSLATIONS.professionalLabel;

    return NextResponse.json({ patientLabel, professionalLabel });
  } catch (error: unknown) {
    console.error("Error fetching tenant settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/store/tenants/[id]/settings
 * Update tenant translations (labels) in MySQL. Merges only patientLabel/professionalLabel.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateStoreAccess();
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { id: tenantId } = await params;
  if (!tenantId) {
    return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const patientLabel =
      typeof body.patientLabel === "string" && body.patientLabel.trim()
        ? body.patientLabel.trim()
        : DEFAULT_TRANSLATIONS.patientLabel;
    const professionalLabel =
      typeof body.professionalLabel === "string" && body.professionalLabel.trim()
        ? body.professionalLabel.trim()
        : DEFAULT_TRANSLATIONS.professionalLabel;

    const row = await getTenantSettingsRow(tenantId);
    const existingSettings =
      row?.settings && typeof row.settings === "object"
        ? (row.settings as Record<string, unknown>)
        : {};

    const notifications =
      existingSettings.notifications && typeof existingSettings.notifications === "object"
        ? existingSettings.notifications
        : { whatsapp: false, sms: false, email: false };
    const cancelationLimit =
      typeof existingSettings.cancelationLimit === "number"
        ? existingSettings.cancelationLimit
        : 0;

    const settings = {
      ...existingSettings,
      notifications,
      cancelationLimit,
      patientLabel,
      professionalLabel,
    };

    await updateTenantSettingsOnly(tenantId, settings);

    return NextResponse.json({ success: true, patientLabel, professionalLabel });
  } catch (error: unknown) {
    console.error("Error updating tenant settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
