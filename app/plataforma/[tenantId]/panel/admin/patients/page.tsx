"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Spinner, Tooltip } from "@heroui/react";
import { Edit, Trash2, MessageCircle } from "lucide-react";
import { PatientFormDialog } from "../components/PatientFormDialog";
import { PanelHeader } from "../../components/PanelHeader";
import { useParams } from "next/navigation";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useTenantLabels } from "@/lib/use-tenant-labels";
import { useTenantSettingsStore } from "@/lib/tenant-settings-store";

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
  dateOfBirth?: Date | string | null;
  admissionDate?: Date | string | null;
  gender?: string | null;
  nationality?: string | null;
  totalAppointments?: number;
  cancelledAppointments?: number;
}

function whatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone || !phone.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const withCountry = digits.startsWith("54") ? digits : digits.startsWith("0") ? "54" + digits.slice(1) : "54" + digits;
  return `https://wa.me/${withCountry}`;
}

export default function AdminPatientsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const { patientLabel } = useTenantLabels();
  const loadTranslations = useTenantSettingsStore((state) => state.loadTranslations);
  const patientLabelSingular = patientLabel.slice(-1) === "s" ? patientLabel.slice(0, -1) : patientLabel;
  const toTranslatedMessage = (msg: string) =>
    msg.replace(/\bpaciente\b/gi, (m) => (m[0] === "P" ? patientLabelSingular : patientLabelSingular.toLowerCase()));
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });
  const [alertDialog, setAlertDialog] = React.useState<{
    open: boolean;
    message: string;
    type: "error" | "info" | "success" | "warning";
  }>({ open: false, message: "", type: "error" });
  const [seniasEnabled, setSeniasEnabled] = React.useState(false);
  const [reservasEnabled, setReservasEnabled] = React.useState(true);

  const loadPatients = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/patients`);
      if (!res.ok) throw new Error("Failed to load patients");
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  React.useEffect(() => {
    if (!tenantId) return;
    fetch(`/api/plataforma/${tenantId}/admin/payments`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.paymentConfig?.mode === "deposit" || data?.paymentConfig?.mode === "full") {
          setSeniasEnabled(true);
        } else {
          setSeniasEnabled(false);
        }
      })
      .catch(() => {});
  }, [tenantId]);

  // Load translations when component mounts
  React.useEffect(() => {
    if (tenantId) {
      loadTranslations(tenantId);
    }
  }, [tenantId, loadTranslations]);

  const handleCreate = () => {
    setEditingPatient(null);
    setDialogOpen(true);
  };

  const handleEdit = async (patient: Patient) => {
    try {
      // Load full patient data
      const res = await fetch(`/api/plataforma/${tenantId}/admin/patients/${patient.id}`);
      if (!res.ok) throw new Error("Failed to load patient");
      const data = await res.json();
      setEditingPatient(data);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error loading patient:", error);
    }
  };

  const handleSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    dni: string;
    coverage: string;
    plan: string;
    dateOfBirth: string;
    admissionDate: string;
    gender: string;
    nationality: string;
    tempPassword?: string;
  }) => {
    try {
      if (editingPatient) {
        // Update
        const res = await fetch(`/api/plataforma/${tenantId}/admin/patients/${editingPatient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(toTranslatedMessage(error.error || `Error al actualizar ${patientLabelSingular.toLowerCase()}`));
        }
      } else {
        // Create
        const res = await fetch(`/api/plataforma/${tenantId}/admin/patients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          const errorMessage = toTranslatedMessage(error.error || error.message || `Error al crear ${patientLabelSingular.toLowerCase()}`);
          console.error("Error creating patient:", error);
          throw new Error(errorMessage);
        }
      }
      await loadPatients();
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDelete = (patient: Patient) => {
    setDeleteDialog({ open: true, patient });
  };

  const confirmDelete = async () => {
    const patientToDelete = deleteDialog.patient;
    if (!patientToDelete) return;

    // Cerrar el diálogo inmediatamente
    setDeleteDialog({ open: false, patient: null });

    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/patients/${patientToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Error al eliminar paciente");
      }

      await loadPatients();
    } catch (error: any) {
      setAlertDialog({
        open: true,
        message: error.message || "Error al eliminar paciente",
        type: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="py-8">
        <PanelHeader
          title={patientLabel}
          action={{
            label: `Agregar ${patientLabel.slice(0, -1)}`, // Remove 's' for singular
            onClick: handleCreate,
          }}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-slate-800">
          <Table aria-label="Tabla de pacientes">
            <TableHeader>
              <TableColumn>Nombre</TableColumn>
              <TableColumn>Turnos</TableColumn>
              <TableColumn>Cancelaciones</TableColumn>
              <TableColumn>Señas</TableColumn>
              <TableColumn>Reservas</TableColumn>
              <TableColumn align="end">Acciones</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner label="Cargando..." />}
              emptyContent={loading ? null : `No hay ${patientLabel.toLowerCase()} registrados`}
            >
              {patients.map((patient) => {
                const total = patient.totalAppointments ?? 0;
                const cancelled = patient.cancelledAppointments ?? 0;
                const scheduled = total - cancelled;
                const waUrl = whatsAppUrl(patient.phone);
                return (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {(patient.firstName ?? patient.name ?? "").trim()} {(patient.lastName ?? "").trim()}
                        </span>
                        <span className="text-sm text-gray-500">{patient.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{scheduled}</TableCell>
                    <TableCell>{cancelled}</TableCell>
                    <TableCell>{seniasEnabled ? "Habilitada" : "Deshabilitada"}</TableCell>
                    <TableCell>{reservasEnabled ? "Habilitada" : "Deshabilitada"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip content="Editar">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleEdit(patient)}
                            aria-label="editar"
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Eliminar">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(patient)}
                            aria-label="eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        {waUrl ? (
                          <Tooltip content="WhatsApp">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              as="a"
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="WhatsApp"
                              className="text-green-600 hover:text-green-700"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <PatientFormDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingPatient(null);
          }}
          onSubmit={handleSubmit}
          mode={editingPatient ? "edit" : "create"}
          initialData={editingPatient || undefined}
        />

        <ConfirmationDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, patient: null })}
          onConfirm={confirmDelete}
          title={`Eliminar ${patientLabel.slice(0, -1)}`}
          message={
            deleteDialog.patient
              ? `¿Estás seguro de que deseas eliminar al ${patientLabel.slice(0, -1).toLowerCase()} ${deleteDialog.patient.firstName || ""} ${deleteDialog.patient.lastName || ""}? Esta acción no se puede deshacer.`
              : ""
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="warning"
        />

        <AlertDialog
          open={alertDialog.open}
          onClose={() => setAlertDialog({ open: false, message: "", type: "error" })}
          message={alertDialog.message}
          type={alertDialog.type}
        />
      </div>
    </div>
  );
}

