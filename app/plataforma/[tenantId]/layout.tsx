import { findTenantById } from "@/lib/db";
import { TenantNotFound } from "./components/TenantNotFound";
import { PwaTenantRecorder } from "./components/PwaTenantRecorder";

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
  const trimmed = tenantId.trim();
  const tenant = await findTenantById(trimmed);
  if (!tenant || !tenant.isActive) {
    return <TenantNotFound />;
  }
  return (
    <>
      <PwaTenantRecorder tenantId={trimmed} />
      {children}
    </>
  );
}
