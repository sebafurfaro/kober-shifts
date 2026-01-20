import { redirect } from "next/navigation";
import { findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Calendar } from "./components/Calendar";
import { Role } from "@/lib/types";

export default async function PanelPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await findUserById(session.userId, tenantId);
  if (!user) redirect("/login");

  // Redirect patients to their appointments page instead of showing calendar
  if (user.role === Role.PATIENT) {
    redirect(`/plataforma/${tenantId}/panel/patient`);
  }

  return <Calendar />;
}


