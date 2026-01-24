import { redirect } from "next/navigation";
import { findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Role } from "@/lib/types";
import AnalyticsPageClient from "./AnalyticsPageClient";

export default async function AnalyticsPage({
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

  // Only ADMIN and PROFESSIONAL can access analytics
  if (user.role !== Role.ADMIN && user.role !== Role.PROFESSIONAL) {
    redirect(`/plataforma/${tenantId}/panel`);
  }

  return <AnalyticsPageClient />;
}
