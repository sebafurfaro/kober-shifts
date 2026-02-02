import { getMongoClientPromise } from "./mongo";

export interface TenantFeatures {
  calendar: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
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
    return {
      calendar: (features as { calendar?: boolean }).calendar ?? defaultFeatures.calendar,
      emailNotifications: (features as { emailNotifications?: boolean }).emailNotifications ?? defaultFeatures.emailNotifications,
      whatsappNotifications: (features as { whatsappNotifications?: boolean }).whatsappNotifications ?? defaultFeatures.whatsappNotifications,
    };
  } catch (error) {
    console.error("Error fetching tenant features:", error);
    return defaultFeatures;
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
