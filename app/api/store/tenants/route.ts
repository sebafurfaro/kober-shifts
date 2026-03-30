import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/store-session";
import {
  findAllTenants,
  createTenant,
  createUser,
  findUserByEmail,
  findStaffUsersWithEmail,
  STAFF_EMAIL_ALREADY_EXISTS_MESSAGE,
} from "@/lib/db";
import { upsertTenantFeatures } from "@/lib/settings-db";
import { randomUUID } from "crypto";
import { hashPassword } from "@/lib/auth";
import { Role } from "@/lib/types";

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
    show_coverage?: boolean;
    show_mercado_pago?: boolean;
    show_servicios?: boolean;
    show_pagos?: Boolean;
    calendar?: boolean;
    payment_enabled?: boolean;
  } | undefined;
  const limits = body.limits as {
    maxUsers?: number;
    whatsappRemindersLimit?: number;
  } | undefined;
  const adminEmail = typeof body.adminEmail === "string" ? body.adminEmail.trim().toLowerCase() : "";
  const adminPassword = typeof body.adminPassword === "string" ? body.adminPassword : "";

  if (!name) return NextResponse.json({ error: "Invalid input: name is required" }, { status: 400 });

  if (adminEmail && adminPassword) {
    const staffWithEmail = await findStaffUsersWithEmail(adminEmail);
    if (staffWithEmail.length > 0) {
      return NextResponse.json({ error: STAFF_EMAIL_ALREADY_EXISTS_MESSAGE }, { status: 409 });
    }
  }

  // Generate tenant ID from name (slug-like) or use provided id
  const id = typeof body.id === "string" && body.id.trim()
    ? body.id.trim()
    : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || randomUUID();

  try {
    const created = await createTenant({ id, name, logoUrl });

    const featureFlags = {
      show_coverage: features?.show_coverage ?? true,
      show_mercado_pago: features?.show_mercado_pago ?? true,
      show_pagos: features?.show_pagos ?? false,
      show_servicios: features?.show_servicios ?? false,
      calendar: features?.calendar ?? true,
      payment_enabled: features?.payment_enabled ?? true,
    };

    const limitsData = {
      maxUsers: typeof limits?.maxUsers === "number" && limits.maxUsers >= 0 ? limits.maxUsers : 1,
      whatsappRemindersLimit: typeof limits?.whatsappRemindersLimit === "number" && limits.whatsappRemindersLimit >= 0 ? limits.whatsappRemindersLimit : 0,
    };

    try {
      await upsertTenantFeatures(id, { features: featureFlags, limits: limitsData });
    } catch (err) {
      console.error("Error saving tenant features:", err);
    }

    if (adminEmail && adminPassword) {
      const existingAdmin = await findUserByEmail(adminEmail, id);
      if (!existingAdmin) {
        await createUser({
          id: randomUUID(),
          tenantId: id,
          email: adminEmail,
          name: adminEmail.split("@")[0] || "Admin",
          passwordHash: hashPassword(adminPassword),
          role: Role.ADMIN,
        });
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
