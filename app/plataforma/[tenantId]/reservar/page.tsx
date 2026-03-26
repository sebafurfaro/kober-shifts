import { redirect } from "next/navigation";
import { getPatientSelfBookingEnabled } from "@/lib/patient-self-booking";
import { NewAppointmentBooking } from "../components/NewAppointmentBooking";

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  if (!(await getPatientSelfBookingEnabled(tenantId))) {
    redirect(`/plataforma/${tenantId}/login`);
  }
  return <NewAppointmentBooking tenantId={tenantId} variant="public" />;
}
