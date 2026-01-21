import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/store-session";
import { findAllTenants, createTenant } from "@/lib/db";
import { mongoClientPromise } from "@/lib/mongo";
import { randomUUID } from "crypto";

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

export async function GET(req: Request) {
  const validation = await validateStoreAccess();
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const tenants = await findAllTenants();
  return NextResponse.json(tenants);
}

export async function POST(req: Request) {
  const validation = await validateStoreAccess();
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() : null;
  const features = body.features as {
    calendar?: boolean;
    emailNotifications?: boolean;
    whatsappNotifications?: boolean;
  } | undefined;

  if (!name) return NextResponse.json({ error: "Invalid input: name is required" }, { status: 400 });

  // Generate tenant ID from name (slug-like) or use provided id
  const id = typeof body.id === "string" && body.id.trim()
    ? body.id.trim()
    : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || randomUUID();

  try {
    const created = await createTenant({ id, name, logoUrl });
    
    // Save feature flags to MongoDB
    if (features) {
      try {
        const client = await mongoClientPromise;
        const db = client.db();
        const collection = db.collection("tenant_features");

        const featureFlags = {
          calendar: features.calendar ?? true,
          emailNotifications: features.emailNotifications ?? false,
          whatsappNotifications: features.whatsappNotifications ?? false,
        };

        await collection.insertOne({
          tenantId: id,
          features: featureFlags,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (mongoError) {
        console.error("Error saving feature flags:", mongoError);
        // Don't fail the tenant creation if feature flags fail
      }
    }
    
    return NextResponse.json(created);
  } catch (error: any) {
    if (error.message?.includes('Duplicate') || error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "Tenant ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}
