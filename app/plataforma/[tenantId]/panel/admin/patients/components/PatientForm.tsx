import { Tabs, Tab, Card, CardBody, Accordion, AccordionItem } from "@heroui/react";
import { HistoryTab } from "./HistoryTab";
import { ContactTab } from "./ContactTab";
import { NotepadTab } from "./NotepadTab";
import { ArchiveTab } from "./ArchiveTab";
import { AditionalTab } from "./AditionalTab";

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

interface Appointment {
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

interface PatientFormProps {
  patient: Patient;
  appointments: Appointment[];
  loadingAppointments: boolean;
  tenantId: string;
  onPatientUpdated: (patient: Patient) => void;
}

export const PatientForm = ({ patient, appointments, loadingAppointments, tenantId, onPatientUpdated }: PatientFormProps) => {
  const saveField = async (field: string, value: unknown) => {
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: patient.firstName ?? "",
          lastName: patient.lastName ?? "",
          [field]: value,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const updated = await res.json();
      onPatientUpdated(updated);
    } catch (error) {
      console.error("Error saving patient data:", error);
      throw error;
    }
  };

  return (
    <>
      <div className="hidden md:flex w-full flex-col card">
        <Tabs
          aria-label="Tabs del formulario de paciente"
          className="w-full"
          classNames={{
            base: "w-full",
            tabList: "gap-2 md:gap-6 w-full relative bg-gray-100 rounded-lg p-1",
            cursor: "bg-white rounded-lg transition-all duration-300 ease-in-out font-medium",
            tab: "md:max-w-fit px-2 md:px-4 h-12 rounded-md text-slate-800",
            tabContent: "group-data-[selected=true]:text-primary",
            panel: "p-0",
          }}
        >
          <Tab key="datos-generales" title="Datos generales">
            <Card>
              <CardBody>
                <ContactTab patient={patient} />
              </CardBody>
            </Card>
          </Tab>
          <Tab key="historial" title="Historial">
            <Card>
              <CardBody>
                <HistoryTab appointments={appointments} loading={loadingAppointments} />
              </CardBody>
            </Card>
          </Tab>
          <Tab key="notas" title="Notas">
            <Card>
              <CardBody>
                <NotepadTab
                  notes={patient.notes ?? []}
                  onSave={(notes) => saveField("notes", notes)}
                />
              </CardBody>
            </Card>
          </Tab>
          <Tab key="archivos" title="Archivos">
            <Card>
              <CardBody>
                <ArchiveTab
                  archives={patient.archives ?? []}
                  onSave={(archives) => saveField("archives", archives)}
                />
              </CardBody>
            </Card>
          </Tab>
          <Tab key="informacion-adicional" title="Información adicional">
            <Card>
              <CardBody>
                <AditionalTab
                  items={patient.additionalInfo ?? []}
                  onSave={(items) => saveField("additionalInfo", items)}
                />
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
      <div className="block md:hidden">
        <Accordion variant="splitted" className="space-y-4">
          <AccordionItem key="Detalles" title="Detalles">
            <ContactTab patient={patient} />
          </AccordionItem>
          <AccordionItem key="Historial de turnos" title="Historial de turnos">
            <HistoryTab appointments={appointments} loading={loadingAppointments} />
          </AccordionItem>
          <AccordionItem key="Notas" title="Notas">
            <NotepadTab
              notes={patient.notes ?? []}
              onSave={(notes) => saveField("notes", notes)}
            />
          </AccordionItem>
          <AccordionItem key="Archivos" title="Archivos">
            <ArchiveTab
              archives={patient.archives ?? []}
              onSave={(archives) => saveField("archives", archives)}
            />
          </AccordionItem>
          <AccordionItem key="Informacion Adicional" title="Informacion Adicional">
            <AditionalTab
              items={patient.additionalInfo ?? []}
              onSave={(items) => saveField("additionalInfo", items)}
            />
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
};
