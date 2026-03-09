import {
  getTenantFeaturesRow,
  getTenantSettingsRow,
  upsertTenantFeatures,
  updateTenantFeaturesMerge,
} from "./settings-db";

export interface TenantFeatures {
  calendar: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  // WhatsApp Quota fields
  whatsappQuotaLimit: number;
  whatsappUsageCount: number;
  whatsappCarryOver: number;
  whatsappLastReset: string; // ISO date
  whatsappCustomMessage?: string;
}

export type WhatsappReminderOption = "24" | "48" | "48_and_24";

/** Store feature flags and limits (from Store Manager) */
export interface TenantFeatureFlagsAndLimits {
  show_coverage: boolean;
  maxUsers: number;
}

const defaultFeatures: TenantFeatures = {
  calendar: true,
  emailNotifications: false,
  whatsappNotifications: false,
  whatsappQuotaLimit: 0,
  whatsappUsageCount: 0,
  whatsappCarryOver: 0,
  whatsappLastReset: new Date().toISOString(),
};

const defaultFlagsAndLimits: TenantFeatureFlagsAndLimits = {
  show_coverage: true,
  maxUsers: 1,
};

/**
 * Get tenant feature flags from MySQL (legacy shape)
 */
export async function getTenantFeatures(tenantId: string): Promise<TenantFeatures> {
  try {
    const row = await getTenantFeaturesRow(tenantId);
    const features = row?.features && typeof row.features === "object" ? row.features : {};
    const limits = row?.limits && typeof row.limits === "object" ? row.limits : {};

    // Check if we need to reset monthly quota
    const lastResetStr = (features as Record<string, unknown>).whatsappLastReset as string || defaultFeatures.whatsappLastReset;
    const lastReset = new Date(lastResetStr);
    const now = new Date();

    let usageCount = (features as Record<string, unknown>).whatsappUsageCount as number ?? defaultFeatures.whatsappUsageCount;
    let carryOver = (features as Record<string, unknown>).whatsappCarryOver as number ?? defaultFeatures.whatsappCarryOver;
    const quotaLimit = (limits as Record<string, unknown>).whatsappRemindersLimit as number ?? (features as Record<string, unknown>).whatsappQuotaLimit as number ?? defaultFeatures.whatsappQuotaLimit;
    let currentLastReset = lastResetStr;

    // Reset logic: if month has changed
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      const remaining = Math.max(0, quotaLimit - usageCount);
      carryOver = carryOver + remaining;
      usageCount = 0;
      currentLastReset = now.toISOString();

      await upsertTenantFeatures(tenantId, {
        features: {
          ...(features as Record<string, unknown>),
          whatsappUsageCount: usageCount,
          whatsappCarryOver: carryOver,
          whatsappLastReset: currentLastReset,
        },
      });
    }

    return {
      calendar: (features as { calendar?: boolean }).calendar ?? defaultFeatures.calendar,
      emailNotifications: (features as { emailNotifications?: boolean }).emailNotifications ?? defaultFeatures.emailNotifications,
      whatsappNotifications: (features as { whatsappNotifications?: boolean }).whatsappNotifications ?? defaultFeatures.whatsappNotifications,
      whatsappQuotaLimit: quotaLimit,
      whatsappUsageCount: usageCount,
      whatsappCarryOver: carryOver,
      whatsappLastReset: currentLastReset,
      whatsappCustomMessage: typeof (features as { whatsappCustomMessage?: string }).whatsappCustomMessage === "string"
        ? (features as { whatsappCustomMessage: string }).whatsappCustomMessage
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching tenant features:", error);
    return defaultFeatures;
  }
}

/**
 * Get WhatsApp reminder option (24h / 48h / both) from tenant_settings (Admin).
 */
export async function getTenantWhatsAppReminderOption(tenantId: string): Promise<WhatsappReminderOption> {
  try {
    const row = await getTenantSettingsRow(tenantId);
    const settings = row?.settings && typeof row.settings === "object" ? row.settings as Record<string, unknown> : {};
    const opt = settings.whatsappReminderOption;
    if (opt === "24" || opt === "48" || opt === "48_and_24") return opt;
    return "48";
  } catch (error) {
    console.error("Error fetching tenant WhatsApp reminder option:", error);
    return "48";
  }
}

/**
 * Increment WhatsApp usage for a tenant if quota is available
 */
export async function incrementWhatsAppUsage(tenantId: string): Promise<boolean> {
  try {
    const features = await getTenantFeatures(tenantId);
    if (!features.whatsappNotifications) return false;

    const totalAvailable = features.whatsappQuotaLimit + features.whatsappCarryOver;
    if (features.whatsappUsageCount >= totalAvailable) {
      console.warn(`[TenantFeatures] Tenant ${tenantId} reached WhatsApp quota limit.`);
      return false;
    }

    const row = await getTenantFeaturesRow(tenantId);
    const currentFeatures = (row?.features ?? {}) as Record<string, unknown>;
    const newCount = ((currentFeatures.whatsappUsageCount as number) ?? 0) + 1;
    await updateTenantFeaturesMerge(tenantId, {
      features: { ...currentFeatures, whatsappUsageCount: newCount },
    });

    return true;
  } catch (error) {
    console.error("Error incrementing WhatsApp usage:", error);
    return false;
  }
}

/**
 * Get store feature flags and limits from MySQL (maxUsers, show_coverage)
 */
export async function getTenantFeatureFlagsAndLimits(tenantId: string): Promise<TenantFeatureFlagsAndLimits> {
  try {
    const row = await getTenantFeaturesRow(tenantId);
    const features = row?.features && typeof row.features === "object" ? row.features : {};
    const limits = row?.limits && typeof row.limits === "object" ? row.limits : {};
    const raw = features as { show_coverage?: boolean; disabled_payment?: boolean; payment_enabled?: boolean };
    const show_coverage = raw.show_coverage ?? true;
    const maxUsers = typeof (limits as { maxUsers?: number }).maxUsers === "number" && (limits as { maxUsers: number }).maxUsers >= 0
      ? (limits as { maxUsers: number }).maxUsers
      : defaultFlagsAndLimits.maxUsers;
    return { show_coverage, maxUsers };
  } catch (error) {
    console.error("Error fetching tenant feature flags and limits:", error);
    return defaultFlagsAndLimits;
  }
}
