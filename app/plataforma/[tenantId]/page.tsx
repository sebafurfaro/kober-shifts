import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findTenantById } from "@/lib/db";
import { getPatientSelfBookingEnabled } from "@/lib/patient-self-booking";
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
    const selfBooking = await getPatientSelfBookingEnabled(tenantId);
    if (selfBooking) {
      redirect(`/plataforma/${tenantId}/reservar`);
    }
    redirect(`/plataforma/${tenantId}/login`);
  }

  redirect(`/plataforma/${tenantId}/panel`);
}