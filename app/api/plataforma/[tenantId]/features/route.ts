import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTenantFeatures, getTenantFeatureFlagsAndLimits } from "@/lib/tenant-features";

/**
 * GET /api/plataforma/[tenantId]/features
 * Get tenant feature flags (legacy + store: show_specialties, show_coverage, maxUsers)
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
    const [legacyFeatures, flagsAndLimits] = await Promise.all([
      getTenantFeatures(tenantId),
      getTenantFeatureFlagsAndLimits(tenantId),
    ]);
    return NextResponse.json({
      ...legacyFeatures,
      show_specialties: flagsAndLimits.show_specialties,
      show_coverage: flagsAndLimits.show_coverage,
      maxUsers: flagsAndLimits.maxUsers,
    });
  } catch (error: unknown) {
    console.error("Error fetching tenant features:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}
