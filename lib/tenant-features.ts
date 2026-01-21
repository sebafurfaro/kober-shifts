import { mongoClientPromise } from "./mongo";

export interface TenantFeatures {
  calendar: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

const defaultFeatures: TenantFeatures = {
  calendar: true,
  emailNotifications: false,
  whatsappNotifications: false,
};

/**
 * Get tenant feature flags from MongoDB
 */
export async function getTenantFeatures(tenantId: string): Promise<TenantFeatures> {
  try {
    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("tenant_features");

    const features = await collection.findOne({ tenantId });

    return features?.features || defaultFeatures;
  } catch (error) {
    console.error("Error fetching tenant features:", error);
    // Return default features on error
    return defaultFeatures;
  }
}
