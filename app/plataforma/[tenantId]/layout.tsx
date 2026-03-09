import { notFound } from "next/navigation";
import { findTenantById } from "@/lib/db";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  if (!tenantId || typeof tenantId !== "string") {
    notFound();
    return null;
  }
  const tenant = await findTenantById(tenantId.trim());
  if (!tenant) {
    notFound();
    return null;
  }
  return <>{children}</>;
}
