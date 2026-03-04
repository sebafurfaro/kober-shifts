import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTenantFeatures, getTenantFeatureFlagsAndLimits } from "@/lib/tenant-features";
import { countStaffUsers } from "@/lib/db";

/**
 * GET /api/plataforma/[tenantId]/features
 * Get tenant feature flags (legacy + store: show_coverage, maxUsers, usedUsers)
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
    const [legacyFeatures, flagsAndLimits, usedUsers] = await Promise.all([
      getTenantFeatures(tenantId),
      getTenantFeatureFlagsAndLimits(tenantId),
      countStaffUsers(tenantId),
    ]);
    return NextResponse.json({
      ...legacyFeatures,
      show_coverage: flagsAndLimits.show_coverage,
      maxUsers: flagsAndLimits.maxUsers,
      usedUsers,
    });
  } catch (error: unknown) {
    console.error("Error fetching tenant features:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}
