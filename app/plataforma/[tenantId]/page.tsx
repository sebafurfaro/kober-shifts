import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findTenantById } from "@/lib/db";
import { TenantNotFound } from "./components/TenantNotFound";

export default async function TenantEntryPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  const tenant = await findTenantById(tenantId);
  if (!tenant || !tenant.isActive) {
    return <TenantNotFound />;
  }

  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    redirect(`/plataforma/${tenantId}/login`);
  }

  redirect(`/plataforma/${tenantId}/panel`);
}