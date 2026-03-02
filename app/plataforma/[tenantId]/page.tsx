import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function TenantEntryPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session || session.tenantId !== tenantId) {
    redirect(`/plataforma/${tenantId}/login`);
  }

  redirect(`/plataforma/${tenantId}/panel`);
}

