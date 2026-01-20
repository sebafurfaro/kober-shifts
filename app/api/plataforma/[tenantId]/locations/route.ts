import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findAllLocations } from "@/lib/db";

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
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await findAllLocations(tenantId);
  return NextResponse.json(items);
}
