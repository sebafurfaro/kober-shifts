import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllLocations } from "@/lib/db";
import { ensureBookingCatalogAccess } from "@/lib/patient-self-booking";

/**
 * GET /api/plataforma/[tenantId]/locations
 * Get list of locations (accessible to all authenticated users)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const session = await getSession();
  const gate = await ensureBookingCatalogAccess(session, tenantId);
  if (gate) return gate;

  const items = await findAllLocations(tenantId);
  return NextResponse.json(items);
}
