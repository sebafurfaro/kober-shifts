import { redirect } from "next/navigation";
import { findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { PanelLayoutShell } from "./components/PanelLayoutShell";

export default async function PanelLayout({
  children,
  params
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
  if (!user) {
    redirect(`/plataforma/${tenantId}/login`);
  }

  return (
    <PanelLayoutShell role={user.role} userName={user.name} tenantId={tenantId}>
      {children}
    </PanelLayoutShell>
  );
}


