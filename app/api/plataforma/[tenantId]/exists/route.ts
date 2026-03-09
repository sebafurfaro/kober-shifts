import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/db";

/**
 * GET /api/plataforma/[tenantId]/exists
 * Returns whether the tenant exists (no auth required).
 * Used by login and layout to redirect to 404 when tenant is invalid.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  if (!tenantId || typeof tenantId !== "string") {
    return NextResponse.json({ exists: false });
  }
  try {
    const tenant = await findTenantById(tenantId.trim());
    return NextResponse.json({ exists: !!tenant });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
