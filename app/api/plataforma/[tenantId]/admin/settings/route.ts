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

    // Return default settings if none exist
    const defaultSettings = {
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
    const notifications = body.notifications as {
      whatsapp?: boolean;
      sms?: boolean;
      email?: boolean;
    } | undefined;

    if (!notifications) {
      return NextResponse.json(
        { error: "Invalid settings format" },
        { status: 400 }
      );
    }

    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("tenant_settings");

    const cancelationLimit = typeof body.cancelationLimit === "number" 
      ? body.cancelationLimit 
      : typeof body.cancelationLimit === "string" 
        ? parseInt(body.cancelationLimit, 10) || 0
        : 0;

    const patientLabel = typeof body.patientLabel === "string" && body.patientLabel.trim()
      ? body.patientLabel.trim()
      : "Pacientes";

    const professionalLabel = typeof body.professionalLabel === "string" && body.professionalLabel.trim()
      ? body.professionalLabel.trim()
      : "Profesionales";

    const cancellationPolicy = typeof body.cancellationPolicy === "string"
      ? body.cancellationPolicy.trim()
      : "";

    const existing = await collection.findOne({ tenantId });
    const existingSettings = (existing?.settings && typeof existing.settings === "object") ? existing.settings : {};

    const validReminderOptions = ["48", "24", "48_and_24"] as const;
    const rawReminder = body.whatsappReminderOption;
    const whatsappReminderOption =
      typeof rawReminder === "string" && validReminderOptions.includes(rawReminder as (typeof validReminderOptions)[number])
        ? (rawReminder as (typeof validReminderOptions)[number])
        : ((existingSettings as { whatsappReminderOption?: string })?.whatsappReminderOption as (typeof validReminderOptions)[number]) || "48";

    const settings = {
      notifications: {
        whatsapp: notifications.whatsapp ?? false,
        sms: notifications.sms ?? false,
        email: notifications.email ?? false,
      },
      cancelationLimit,
      patientLabel,
      professionalLabel,
      cancellationPolicy: cancellationPolicy || (existingSettings as { cancellationPolicy?: string }).cancellationPolicy || "",
      whatsappReminderOption,
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
