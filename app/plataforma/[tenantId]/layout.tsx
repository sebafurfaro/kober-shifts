import { findTenantById } from "@/lib/db";
import { TenantNotFound } from "./components/TenantNotFound";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  if (!tenantId || typeof tenantId !== "string") {
    return <TenantNotFound />;
  }
  const tenant = await findTenantById(tenantId.trim());
  if (!tenant || !tenant.isActive) {
    return <TenantNotFound />;
  }
  return <>{children}</>;
}
