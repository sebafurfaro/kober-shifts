import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTenantFeatures, getTenantFeatureFlagsAndLimits } from "@/lib/tenant-features";
import { countStaffUsers, findTenantById } from "@/lib/db";
import { getPatientSelfBookingEnabled } from "@/lib/patient-self-booking";

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
    const tenant = await findTenantById(tenantId);
    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const [patientSelfBookingEnabled, flagsAndLimits] = await Promise.all([
      getPatientSelfBookingEnabled(tenantId),
      getTenantFeatureFlagsAndLimits(tenantId),
    ]);
    return NextResponse.json({
      patientSelfBookingEnabled,
      show_servicios: flagsAndLimits.show_servicios,
    });
  }

  try {
    const [legacyFeatures, flagsAndLimits, usedUsers, patientSelfBookingEnabled] = await Promise.all([
      getTenantFeatures(tenantId),
      getTenantFeatureFlagsAndLimits(tenantId),
      countStaffUsers(tenantId),
      getPatientSelfBookingEnabled(tenantId),
    ]);
    return NextResponse.json({
      ...legacyFeatures,
      show_coverage: flagsAndLimits.show_coverage,
      show_servicios: flagsAndLimits.show_servicios,
      show_pagos: flagsAndLimits.show_pagos,
      show_mercado_pago: flagsAndLimits.show_mercado_pago,
      maxUsers: flagsAndLimits.maxUsers,
      usedUsers,
      patientSelfBookingEnabled,
    });
  } catch (error: unknown) {
    console.error("Error fetching tenant features:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}
