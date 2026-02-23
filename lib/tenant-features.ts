import { getMongoClientPromise } from "./mongo";

export interface TenantFeatures {
  calendar: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  // WhatsApp Quota fields
  whatsappQuotaLimit: number;
  whatsappUsageCount: number;
  whatsappCarryOver: number;
  whatsappLastReset: string; // ISO date
}

/** Store feature flags and limits (from Store Manager) */
export interface TenantFeatureFlagsAndLimits {
  show_specialties: boolean;
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
  show_specialties: true,
  show_coverage: true,
  maxUsers: 1,
};

/**
 * Get tenant feature flags from MongoDB (legacy shape)
 */
export async function getTenantFeatures(tenantId: string): Promise<TenantFeatures> {
  try {
    const client = await getMongoClientPromise();
    const db = client.db("kober_shifts");
    const collection = db.collection("tenant_features");
    const doc = await collection.findOne({ tenantId });
    const features = doc?.features && typeof doc.features === "object" ? doc.features : {};
    const limits = doc?.limits && typeof doc.limits === "object" ? doc.limits : {};

    // Check if we need to reset monthly quota
    const lastResetStr = (features as any).whatsappLastReset || defaultFeatures.whatsappLastReset;
    const lastReset = new Date(lastResetStr);
    const now = new Date();

    let usageCount = (features as any).whatsappUsageCount ?? defaultFeatures.whatsappUsageCount;
    let carryOver = (features as any).whatsappCarryOver ?? defaultFeatures.whatsappCarryOver;
    // Prefer limits.whatsappRemindersLimit from Store Manager, fallback to features.whatsappQuotaLimit
    let quotaLimit = (limits as any).whatsappRemindersLimit ?? (features as any).whatsappQuotaLimit ?? defaultFeatures.whatsappQuotaLimit;
    let currentLastReset = lastResetStr;

    // Reset logic: if month has changed
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      // Carry over logic: (remaining from last month) + previous carryOver
      const remaining = Math.max(0, quotaLimit - usageCount);
      carryOver = carryOver + remaining;
      usageCount = 0;
      currentLastReset = now.toISOString();

      // Update in DB
      await collection.updateOne(
        { tenantId },
        {
          $set: {
            "features.whatsappUsageCount": usageCount,
            "features.whatsappCarryOver": carryOver,
            "features.whatsappLastReset": currentLastReset
          }
        }
      );
    }

    return {
      calendar: (features as { calendar?: boolean }).calendar ?? defaultFeatures.calendar,
      emailNotifications: (features as { emailNotifications?: boolean }).emailNotifications ?? defaultFeatures.emailNotifications,
      whatsappNotifications: (features as { whatsappNotifications?: boolean }).whatsappNotifications ?? defaultFeatures.whatsappNotifications,
      whatsappQuotaLimit: quotaLimit,
      whatsappUsageCount: usageCount,
      whatsappCarryOver: carryOver,
      whatsappLastReset: currentLastReset,
    };
  } catch (error) {
    console.error("Error fetching tenant features:", error);
    return defaultFeatures;
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

    const client = await getMongoClientPromise();
    const db = client.db("kober_shifts");
    const collection = db.collection("tenant_features");

    await collection.updateOne(
      { tenantId },
      { $inc: { "features.whatsappUsageCount": 1 } }
    );

    return true;
  } catch (error) {
    console.error("Error incrementing WhatsApp usage:", error);
    return false;
  }
}


/**
 * Get store feature flags and limits from MongoDB (maxUsers, show_specialties, show_coverage)
 */
export async function getTenantFeatureFlagsAndLimits(tenantId: string): Promise<TenantFeatureFlagsAndLimits> {
  try {
    const client = await getMongoClientPromise();
    const db = client.db("kober_shifts");
    const collection = db.collection("tenant_features");
    const doc = await collection.findOne({ tenantId });
    const features = doc?.features && typeof doc.features === "object" ? doc.features : {};
    const limits = doc?.limits && typeof doc.limits === "object" ? doc.limits : {};
    const raw = features as { show_specialties?: boolean; show_coverage?: boolean; disabled_payment?: boolean; payment_enabled?: boolean };
    const show_specialties = raw.show_specialties ?? true;
    const show_coverage = raw.show_coverage ?? true;
    const maxUsers = typeof (limits as { maxUsers?: number }).maxUsers === "number" && (limits as { maxUsers: number }).maxUsers >= 0
      ? (limits as { maxUsers: number }).maxUsers
      : defaultFlagsAndLimits.maxUsers;
    return { show_specialties, show_coverage, maxUsers };
  } catch (error) {
    console.error("Error fetching tenant feature flags and limits:", error);
    return defaultFlagsAndLimits;
  }
}
