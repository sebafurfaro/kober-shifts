import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTenantFeatureFlagsAndLimits } from "@/lib/tenant-features";

export default async function AdminServiciosLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    redirect(`/plataforma/${tenantId}/login`);
  }
  const flags = await getTenantFeatureFlagsAndLimits(tenantId);
  if (!flags.show_servicios) {
    redirect(`/plataforma/${tenantId}/panel`);
  }
  return <>{children}</>;
}
