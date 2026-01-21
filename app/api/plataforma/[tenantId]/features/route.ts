import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTenantFeatures } from "@/lib/tenant-features";

/**
 * GET /api/plataforma/[tenantId]/features
 * Get tenant feature flags
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

  try {
    const features = await getTenantFeatures(tenantId);
    return NextResponse.json(features);
  } catch (error: any) {
    console.error("Error fetching tenant features:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}
