"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardBody,
  Spinner,
} from "@heroui/react";
import { Pencil } from "lucide-react";
import { PatientFormDialog } from "../../admin/components/PatientFormDialog";
import { PanelHeader } from "../../components/PanelHeader";
import { useParams } from "next/navigation";

interface Patient {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: Date | string | null;
  admissionDate?: Date | string | null;
  gender?: string | null;
  nationality?: string | null;
}

export default function ProfessionalPatientsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);

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
          throw new Error(error.error || "Error al crear paciente");
        }
      }
      await loadPatients();
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <div className="py-8">
        <PanelHeader
          title="Pacientes"
          action={{
            label: "Crear Paciente",
            onClick: handleCreate,
          }}
        />

        <Card>
          <CardBody className="p-0">
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
                loadingContent={<Spinner />}
                emptyContent={loading ? "Cargando..." : "No hay pacientes registrados"}
              >
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.firstName || patient.name}</TableCell>
                    <TableCell>{patient.lastName || ""}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleEdit(patient)}
                          aria-label="editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

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
      </div>
    </div>
  );
}

