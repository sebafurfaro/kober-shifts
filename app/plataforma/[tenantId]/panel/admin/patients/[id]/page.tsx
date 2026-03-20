"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Spinner, Tooltip } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { Section } from "../../../components/layout/Section";
import { useTenantLabels } from "@/lib/use-tenant-labels";
import { PatientForm } from "../components/PatientForm";

interface Patient {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  dni?: string | null;
  coverage?: string | null;
  plan?: string | null;
  dateOfBirth?: string | null;
  admissionDate?: string | null;
  gender?: string | null;
  nationality?: string | null;
  additionalInfo?: Array<{ id: string; title: string; description: string }> | null;
  archives?: Array<{ id: string; label: string; url: string; createdAt: string }> | null;
  notes?: Array<{ id: string; title: string; content: string; createdAt: string; updatedAt: string }> | null;
}

export interface PatientAppointment {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  notes?: string | null;
  cancellationReason?: string | null;
  professional: { id: string; name: string };
  location: { id: string; name: string; address?: string | null };
  service?: { id: string; name: string; price?: number } | null;
}

export default function PatientProfilePage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const patientId = params.id as string;
  const router = useRouter();
  const { patientLabel } = useTenantLabels();
  const patientLabelSingular = patientLabel.slice(-1) === "s" ? patientLabel.slice(0, -1) : patientLabel;

  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [appointments, setAppointments] = React.useState<PatientAppointment[]>([]);
  const [loadingPatient, setLoadingPatient] = React.useState(true);
  const [loadingAppointments, setLoadingAppointments] = React.useState(true);

  React.useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch(`/api/plataforma/${tenantId}/admin/patients/${patientId}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPatient(data);
      } catch {
        setPatient(null);
      } finally {
        setLoadingPatient(false);
      }
    };
    fetchPatient();
  }, [tenantId, patientId]);

  React.useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(`/api/plataforma/${tenantId}/admin/appointments?patientId=${patientId}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const list: PatientAppointment[] = Array.isArray(data) ? data : (data.appointments ?? []);
        list.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
        setAppointments(list);
      } catch {
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, [tenantId, patientId]);

  const displayName = patient
    ? [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() || patient.name || "—"
    : "—";

  if (loadingPatient) {
    return (
      <Section>
        <div className="flex justify-center py-20">
          <Spinner label="Cargando..." />
        </div>
      </Section>
    );
  }

  if (!patient) {
    return (
      <Section>
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-gray-500">{patientLabelSingular} no encontrado.</p>
          <Button variant="flat" onPress={() => router.back()} startContent={<ArrowLeft className="w-4 h-4" />}>
            Volver
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="relative p-4 my-4">
        <div className="absolute -inset-1 rounded-xl gradient-nodo opacity-20 blur-md" />
        <Card className="p-6 rounded-xl border border-gray-200 duration-200 bg-white relative z-10">
          <div className="flex flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {displayName}
              </h2>
            </div>
            <div className="flex items-center justify-center w-[50px] h-[50px]">
              <Tooltip content="Volver" placement="top">
                <Button
                  variant="solid"
                  color="primary"
                  onPress={() => router.back()}
                  style={{ width: "48px", height: "48px", minWidth: "48px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "7rem" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>
      </div>
      <div>
        <PatientForm
          patient={patient}
          appointments={appointments}
          loadingAppointments={loadingAppointments}
          tenantId={tenantId}
          onPatientUpdated={(updated) => setPatient(updated)}
        />
      </div>
    </Section>
  );
}
