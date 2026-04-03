import { redirect } from "next/navigation";
import { findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import { getTenantFeatureFlagsAndLimits } from "@/lib/tenant-features";
import EgresosPageDynamic from "./EgresosPageDynamic";

export default async function EgresosPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await getSession();

  if (!session || session.tenantId !== tenantId) {
    redirect(`/plataforma/${tenantId}/login`);
  }

  const user = await findUserById(session.userId, tenantId);
  if (!user) {
    redirect(`/plataforma/${tenantId}/login`);
  }

  if (user.role !== Role.ADMIN) {
    redirect(`/plataforma/${tenantId}/panel`);
  }

  const flags = await getTenantFeatureFlagsAndLimits(tenantId);
  if (!flags.show_pagos) {
    redirect(`/plataforma/${tenantId}/panel`);
  }

  return <EgresosPageDynamic />;
}
