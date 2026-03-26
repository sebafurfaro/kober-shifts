"use client";

import { useParams } from "next/navigation";
import { NewAppointmentBooking } from "../../../components/NewAppointmentBooking";

export default function NuevoTurnoPage() {
  const params = useParams();
  return <NewAppointmentBooking tenantId={params.tenantId as string} variant="panel" />;
}
