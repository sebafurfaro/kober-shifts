import { redirect } from "next/navigation";
import { findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { PanelLayoutShell } from "./components/PanelLayoutShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login");

  return (
    <PanelLayoutShell role={user.role} userName={user.name}>
      {children}
    </PanelLayoutShell>
  );
}


