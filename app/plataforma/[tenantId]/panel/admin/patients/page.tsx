"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Spinner } from "@heroui/react";
import { Edit, Trash2 } from "lucide-react";
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
}

export default function AdminPatientsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const { patientLabel } = useTenantLabels();
  const loadTranslations = useTenantSettingsStore((state) => state.loadTranslations);
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
          throw new Error(error.error || "Error al actualizar paciente");
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
          const errorMessage = error.error || error.message || "Error al crear paciente";
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
              <TableColumn>Apellido</TableColumn>
              <TableColumn>Email</TableColumn>
              <TableColumn>Teléfono</TableColumn>
              <TableColumn align="end">Acciones</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner label="Cargando..." />}
              emptyContent={loading ? null : `No hay ${patientLabel.toLowerCase()} registrados`}
            >
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>{patient.firstName || patient.name}</TableCell>
                  <TableCell>{patient.lastName || ""}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

