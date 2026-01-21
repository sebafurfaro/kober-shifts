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
import { Pencil, Trash2 } from "lucide-react";
import { SpecialtyFormDialog } from "../components/SpecialtyFormDialog";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { PanelHeader } from "../../components/PanelHeader";
import { useParams } from "next/navigation";

interface Specialty {
  id: string;
  name: string;
  professionalCount?: number;
}

export default function AdminSpecialtiesPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingSpecialty, setEditingSpecialty] = React.useState<Specialty | null>(null);
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    message: "",
    onConfirm: () => { },
  });
  const [alertDialog, setAlertDialog] = React.useState<{
    open: boolean;
    message: string;
    type: "error" | "info" | "success" | "warning";
  }>({ open: false, message: "", type: "error" });

  const loadSpecialties = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/specialties`);
      if (!res.ok) throw new Error("Failed to load specialties");
      const data = await res.json();
      setSpecialties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading specialties:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  const handleCreate = () => {
    setEditingSpecialty(null);
    setDialogOpen(true);
  };

  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setDialogOpen(true);
  };

  const handleDelete = (specialty: Specialty) => {
    setConfirmationDialog({
      open: true,
      message: `¿Estás seguro de que deseas eliminar la especialidad "${specialty.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/plataforma/${tenantId}/admin/specialties/${specialty.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Error al eliminar especialidad");
          }
          await loadSpecialties();
        } catch (error: any) {
          setAlertDialog({
            open: true,
            message: error.message || "Error al eliminar especialidad",
            type: "error",
          });
        }
      },
    });
  };

  const handleSubmit = async (data: { name: string }) => {
    try {
      if (editingSpecialty) {
        // Update
        const res = await fetch(`/api/plataforma/${tenantId}/admin/specialties/${editingSpecialty.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al actualizar especialidad");
        }
      } else {
        // Create
        const res = await fetch(`/api/plataforma/${tenantId}/admin/specialties`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Error al crear especialidad");
        }
      }
      await loadSpecialties();
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div>
        <PanelHeader
          title="Especialidades"
          subtitle="Agrega todas las especialidades disponibles en tu centro"
          action={{
            label: "Agregar Especialidad",
            onClick: handleCreate,
          }}
        />

        <Card>
          <CardBody className="p-0">
            <Table aria-label="Tabla de especialidades">
              <TableHeader>
                <TableColumn className="text-slate-800 text-base">Nombre</TableColumn>
                <TableColumn className="text-slate-800 text-base" align="end">Profesionales Asociados</TableColumn>
                <TableColumn className="text-slate-800 text-base" align="end">Acciones</TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                loadingContent={<Spinner />}
                emptyContent={
                  loading ? "Cargando..." : "No hay especialidades registradas"
                }
              >
                {specialties.map((specialty) => (
                  <TableRow key={specialty.id}>
                    <TableCell>{specialty.name}</TableCell>
                    <TableCell className="text-right">
                      {specialty.professionalCount ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => handleEdit(specialty)}
                          aria-label="editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(specialty)}
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
          </CardBody>
        </Card>

        <SpecialtyFormDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingSpecialty(null);
          }}
          onSubmit={handleSubmit}
          mode={editingSpecialty ? "edit" : "create"}
          initialData={editingSpecialty || undefined}
        />

        <ConfirmationDialog
          open={confirmationDialog.open}
          onClose={() => setConfirmationDialog({ ...confirmationDialog, open: false })}
          onConfirm={confirmationDialog.onConfirm}
          message={confirmationDialog.message}
          title="Eliminar Especialidad"
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


