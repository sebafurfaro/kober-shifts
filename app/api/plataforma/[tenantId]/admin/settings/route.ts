import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { mongoClientPromise } from "@/lib/mongo";
import { Role } from "@/lib/types";

/**
 * GET /api/plataforma/[tenantId]/admin/settings
 * Get tenant settings from MongoDB
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("tenant_settings");

    const settings = await collection.findOne({ tenantId });

    // Return default settings if none exist (sitio inactivo por defecto)
    const defaultSettings = {
      isActive: false,
      notifications: {
        whatsapp: false,
        sms: false,
        email: false,
      },
      cancelationLimit: 0,
      patientLabel: "Pacientes",
      professionalLabel: "Profesionales",
      cancellationPolicy: "",
      whatsappReminderOption: "48",
      // Booking / seña (globales: % seña, política reembolso, confirmación manual, anticipación)
      depositPercent: 0,
      refundPolicyMessage: "",
      manualTurnConfirmation: false,
      minAnticipation: 0,
      maxAnticipation: 30,
      defaultSlotDurationMinutes: 30,
      defaultSlotMarginMinutes: 0,
    };

    const merged = { ...defaultSettings, ...settings?.settings };
    return NextResponse.json(merged);
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/plataforma/[tenantId]/admin/settings
 * Update tenant settings in MongoDB
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
  if (session.role !== Role.ADMIN && session.role !== Role.PROFESSIONAL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("tenant_settings");
    const existing = await collection.findOne({ tenantId });
    const existingSettings = (existing?.settings && typeof existing.settings === "object") ? existing.settings : {} as Record<string, unknown>;

    const notificationsFromBody = body.notifications as { whatsapp?: boolean; sms?: boolean; email?: boolean } | undefined;
    const notifications = {
      whatsapp: notificationsFromBody?.whatsapp ?? (existingSettings.notifications as { whatsapp?: boolean })?.whatsapp ?? false,
      sms: notificationsFromBody?.sms ?? (existingSettings.notifications as { sms?: boolean })?.sms ?? false,
      email: notificationsFromBody?.email ?? (existingSettings.notifications as { email?: boolean })?.email ?? false,
    };

    const cancelationLimit = typeof body.cancelationLimit === "number"
      ? body.cancelationLimit
      : typeof body.cancelationLimit === "string"
        ? parseInt(body.cancelationLimit, 10) || 0
        : (typeof existingSettings.cancelationLimit === "number" ? existingSettings.cancelationLimit : 0);

    const patientLabel = typeof body.patientLabel === "string" && body.patientLabel.trim()
      ? body.patientLabel.trim()
      : (typeof existingSettings.patientLabel === "string" && existingSettings.patientLabel.trim() ? existingSettings.patientLabel : "Pacientes");

    const professionalLabel = typeof body.professionalLabel === "string" && body.professionalLabel.trim()
      ? body.professionalLabel.trim()
      : (typeof existingSettings.professionalLabel === "string" && existingSettings.professionalLabel.trim() ? existingSettings.professionalLabel : "Profesionales");

    const cancellationPolicy = typeof body.cancellationPolicy === "string"
      ? body.cancellationPolicy.trim()
      : (typeof existingSettings.cancellationPolicy === "string" ? existingSettings.cancellationPolicy : "");

    const isActive = typeof body.isActive === "boolean"
      ? body.isActive
      : (existingSettings.isActive === true);

    const validReminderOptions = ["48", "24", "48_and_24"] as const;
    const rawReminder = body.whatsappReminderOption;
    const whatsappReminderOption =
      typeof rawReminder === "string" && validReminderOptions.includes(rawReminder as (typeof validReminderOptions)[number])
        ? (rawReminder as (typeof validReminderOptions)[number])
        : ((existingSettings.whatsappReminderOption as (typeof validReminderOptions)[number]) || "48");

    const depositPercent = typeof body.depositPercent === "number" && body.depositPercent >= 0 && body.depositPercent <= 1
      ? body.depositPercent
      : typeof body.depositPercent === "string"
        ? Math.min(1, Math.max(0, parseFloat(body.depositPercent) || 0) / 100)
        : (typeof existingSettings.depositPercent === "number" ? existingSettings.depositPercent : 0);

    const refundPolicyMessage = typeof body.refundPolicyMessage === "string"
      ? body.refundPolicyMessage.trim()
      : (typeof existingSettings.refundPolicyMessage === "string" ? existingSettings.refundPolicyMessage : "");

    const manualTurnConfirmation = typeof body.manualTurnConfirmation === "boolean"
      ? body.manualTurnConfirmation
      : (typeof existingSettings.manualTurnConfirmation === "boolean" ? existingSettings.manualTurnConfirmation : false);

    const minAnticipation = typeof body.minAnticipation === "number" && body.minAnticipation >= 0
      ? body.minAnticipation
      : typeof body.minAnticipation === "string"
        ? Math.max(0, parseInt(body.minAnticipation, 10) || 0)
        : (typeof existingSettings.minAnticipation === "number" ? existingSettings.minAnticipation : 0);

    const maxAnticipation = typeof body.maxAnticipation === "number"
      ? body.maxAnticipation
      : typeof body.maxAnticipation === "string"
        ? (body.maxAnticipation === "-1" ? -1 : parseInt(body.maxAnticipation, 10) || 30)
        : (typeof existingSettings.maxAnticipation === "number" ? existingSettings.maxAnticipation : 30);

    const defaultSlotDurationMinutes = typeof body.defaultSlotDurationMinutes === "number" && body.defaultSlotDurationMinutes > 0
      ? body.defaultSlotDurationMinutes
      : typeof body.defaultSlotDurationMinutes === "string"
        ? Math.max(1, parseInt(body.defaultSlotDurationMinutes, 10) || 30)
        : (typeof existingSettings.defaultSlotDurationMinutes === "number" ? existingSettings.defaultSlotDurationMinutes : 30);

    const defaultSlotMarginMinutes = typeof body.defaultSlotMarginMinutes === "number" && body.defaultSlotMarginMinutes >= 0
      ? body.defaultSlotMarginMinutes
      : typeof body.defaultSlotMarginMinutes === "string"
        ? Math.max(0, parseInt(body.defaultSlotMarginMinutes, 10) || 0)
        : (typeof existingSettings.defaultSlotMarginMinutes === "number" ? existingSettings.defaultSlotMarginMinutes : 0);

    const settings = {
      isActive,
      notifications,
      cancelationLimit,
      patientLabel,
      professionalLabel,
      cancellationPolicy,
      whatsappReminderOption,
      depositPercent,
      refundPolicyMessage,
      manualTurnConfirmation,
      minAnticipation,
      maxAnticipation,
      defaultSlotDurationMinutes,
      defaultSlotMarginMinutes,
    };

    await collection.updateOne(
      { tenantId },
      { $set: { tenantId, settings, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
