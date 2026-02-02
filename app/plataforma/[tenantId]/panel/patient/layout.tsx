import { redirect } from "next/navigation";
import { findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function PatientPanelLayout({
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
  const user = await findUserById(session.userId, tenantId);
  if (!user || user.role !== "PATIENT") {
    redirect(`/plataforma/${tenantId}/panel`);
  }
  return <>{children}</>;
}
