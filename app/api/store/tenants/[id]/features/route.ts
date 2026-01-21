import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/store-session";
import { mongoClientPromise } from "@/lib/mongo";

const ALLOWED_EMAIL = "seba.furfaro@gmail.com";

async function validateStoreAccess() {
  const session = await getStoreSession();
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  if (session.email.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    return { error: "Forbidden", status: 403 };
  }

  return { session };
}

/**
 * GET /api/store/tenants/[id]/features
 * Get tenant feature flags from MongoDB
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
    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("tenant_features");

    const features = await collection.findOne({ tenantId });

    // Return default features if none exist
    const defaultFeatures = {
      calendar: true,
      emailNotifications: false,
      whatsappNotifications: false,
    };

    return NextResponse.json(features?.features || defaultFeatures);
  } catch (error: any) {
    console.error("Error fetching feature flags:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/store/tenants/[id]/features
 * Update tenant feature flags in MongoDB
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

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const features = body.features as {
      calendar?: boolean;
      emailNotifications?: boolean;
      whatsappNotifications?: boolean;
    } | undefined;

    if (!features) {
      return NextResponse.json(
        { error: "Invalid features format" },
        { status: 400 }
      );
    }

    const client = await mongoClientPromise;
    const db = client.db();
    const collection = db.collection("tenant_features");

    const featureFlags = {
      calendar: features.calendar ?? true,
      emailNotifications: features.emailNotifications ?? false,
      whatsappNotifications: features.whatsappNotifications ?? false,
    };

    await collection.updateOne(
      { tenantId },
      { $set: { tenantId, features: featureFlags, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, features: featureFlags });
  } catch (error: any) {
    console.error("Error updating feature flags:", error);
    return NextResponse.json(
      { error: "Failed to update feature flags" },
      { status: 500 }
    );
  }
}
