import { redirect } from "next/navigation";
import { findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getTenantFeatures } from "@/lib/tenant-features";
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

  // Check if calendar feature is enabled
  const features = await getTenantFeatures(tenantId);
  if (!features.calendar) {
    // Redirect to admin page if calendar is disabled
    if (user.role === Role.ADMIN) {
      redirect(`/plataforma/${tenantId}/panel/admin`);
    } else if (user.role === Role.PROFESSIONAL) {
      redirect(`/plataforma/${tenantId}/panel/professional`);
    } else {
      redirect(`/plataforma/${tenantId}/panel/patient`);
    }
  }

  return <Calendar />;
}


