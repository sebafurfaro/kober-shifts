import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/store-session";
import { getTenantFeaturesRow, upsertTenantFeatures } from "@/lib/settings-db";

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

const DEFAULT_FEATURES = {
  show_coverage: true,
  show_mercado_pago: true,
  calendar: true,
  payment_enabled: true,
  whatsappNotifications: false,
  whatsappCustomMessage: "",
};

const DEFAULT_LIMITS = {
  maxUsers: 1,
  whatsappRemindersLimit: 0,
};

/**
 * GET /api/store/tenants/[id]/features
 * Get tenant feature flags from MySQL
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

  try {
    const doc = await getTenantFeaturesRow(tenantId);

    const rawFeatures = doc?.features && typeof doc.features === "object" ? doc.features : {};
    const paymentEnabled =
      (rawFeatures as { payment_enabled?: boolean }).payment_enabled ??
      (typeof (rawFeatures as { disabled_payment?: boolean }).disabled_payment === "boolean"
        ? !(rawFeatures as { disabled_payment: boolean }).disabled_payment
        : true);
    const features = {
      ...DEFAULT_FEATURES,
      ...rawFeatures,
      payment_enabled: paymentEnabled,
    };
    const limits = doc?.limits && typeof doc.limits === "object"
      ? { ...DEFAULT_LIMITS, ...(doc.limits as Record<string, unknown>) }
      : DEFAULT_LIMITS;

    return NextResponse.json({ features, limits });
  } catch (error: unknown) {
    console.error("Error fetching feature flags:", error);
    return NextResponse.json(
      {
        features: DEFAULT_FEATURES,
        limits: DEFAULT_LIMITS,
      },
      { status: 200 }
    );
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * PUT /api/store/tenants/[id]/features
 * Update tenant feature flags in MySQL
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateStoreAccess();
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { id: tenantId } = await params;
    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const features = body.features as {
      show_coverage?: boolean;
      show_mercado_pago?: boolean;
      show_pagos?: boolean;
      show_servicios?: boolean;
      calendar?: boolean;
      payment_enabled?: boolean;
      whatsappNotifications?: boolean;
      whatsappCustomMessage?: string;
    } | undefined;
    const limits = body.limits as {
      maxUsers?: number;
      whatsappRemindersLimit?: number;
    } | undefined;

    const doc = await getTenantFeaturesRow(tenantId);
    const docRaw = doc?.features && typeof doc.features === "object" ? doc.features : {};
    const docPaymentEnabled =
      (docRaw as { payment_enabled?: boolean }).payment_enabled ??
      (typeof (docRaw as { disabled_payment?: boolean }).disabled_payment === "boolean"
        ? !(docRaw as { disabled_payment: boolean }).disabled_payment
        : true);
    const featureFlags = {
      show_coverage: features?.show_coverage ?? (docRaw as { show_coverage?: boolean }).show_coverage ?? true,
      show_mercado_pago: features?.show_mercado_pago ?? (docRaw as { show_mercado_pago?: boolean }).show_mercado_pago ?? true,
      show_pagos: features?.show_pagos ?? (docRaw as { show_pagos?: boolean }).show_pagos ?? false,
      show_servicios: features?.show_servicios ?? (docRaw as { show_servicios?: boolean }).show_servicios ?? false,
      calendar: features?.calendar ?? (docRaw as { calendar?: boolean }).calendar ?? true,
      payment_enabled: features?.payment_enabled ?? docPaymentEnabled ?? true,
      whatsappNotifications: features?.whatsappNotifications ?? (docRaw as { whatsappNotifications?: boolean }).whatsappNotifications ?? false,
      whatsappCustomMessage: features?.whatsappCustomMessage ?? (docRaw as { whatsappCustomMessage?: string }).whatsappCustomMessage ?? "",
    };

    const limitsData = {
      maxUsers: typeof limits?.maxUsers === "number" ? limits.maxUsers : ((doc?.limits as { maxUsers?: number })?.maxUsers ?? 1),
      whatsappRemindersLimit: typeof limits?.whatsappRemindersLimit === "number" ? limits.whatsappRemindersLimit : ((doc?.limits as { whatsappRemindersLimit?: number })?.whatsappRemindersLimit ?? 0),
    };

    await upsertTenantFeatures(tenantId, { features: featureFlags, limits: limitsData });

    return NextResponse.json({ success: true, features: featureFlags, limits: limitsData });
  } catch (err: unknown) {
    console.error("PUT /api/store/tenants/[id]/features unexpected error:", err);
    const payload: { error: string; detail?: string } = {
      error: "Failed to update feature flags",
    };
    if (process.env.NODE_ENV !== "production") {
      payload.detail = err instanceof Error ? err.message : String(err);
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
