"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Avatar, Chip, Button, Spinner, Card } from "@heroui/react";
import { Edit, Trash2 } from "lucide-react";
import { PanelHeader } from "../../components/PanelHeader";
import { useRouter, useParams } from "next/navigation";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";

interface Professional {
  id: string;
  name: string;
  email: string;
  color?: string | null;
  professional?: {
    specialty?: {
      id: string;
      name: string;
    } | null;
    specialties?: Array<{
      id: string;
      name: string;
    }>;
    color?: string | null;
  } | null;
}

export default function AdminProfessionalsPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    professional: Professional | null;
  }>({ open: false, professional: null });
  const [alertDialog, setAlertDialog] = React.useState<{
    open: boolean;
    message: string;
    type: "error" | "info" | "success" | "warning";
  }>({ open: false, message: "", type: "error" });

  const loadData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/professionals`);
      if (!res.ok) throw new Error("Failed to load professionals");
      const data = await res.json();
      setProfessionals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading professionals:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    router.push(`/plataforma/${tenantId}/panel/admin/professionals/add-new`);
  };

  const handleEdit = (professional: Professional) => {
    router.push(`/plataforma/${tenantId}/panel/admin/professionals/${professional.id}/edit`);
  };

  const handleDelete = (professional: Professional) => {
    setDeleteDialog({ open: true, professional });
  };

  const confirmDelete = async () => {
    const professionalToDelete = deleteDialog.professional;
    if (!professionalToDelete) return;

    // Cerrar el diálogo inmediatamente
    setDeleteDialog({ open: false, professional: null });

    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/professionals/${professionalToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Error al eliminar profesional");
      }

      await loadData();
    } catch (error: any) {
      setAlertDialog({
        open: true,
        message: error.message || "Error al eliminar profesional",
        type: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="py-8">
        <PanelHeader
          title="Profesionales"
          action={{
            label: "Crear Perfil",
            color: "primary",
            onClick: handleCreate,
          }}
        />

        <Card className="card">
          <Table aria-label="Tabla de profesionales">
            <TableHeader>
              <TableColumn className="rounded-tl-lg rounded-bl-lg text-slate-800 text-base">Color</TableColumn>
              <TableColumn className="text-slate-800 text-base">Nombre</TableColumn>
              <TableColumn className="text-slate-800 text-base">Email</TableColumn>
              <TableColumn className="text-slate-800 text-base">Especialidades</TableColumn>
              <TableColumn className="text-right rounded-tr-lg rounded-br-lg text-slate-800 text-base">Acciones</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner label="Cargando..." />}
              emptyContent={loading ? null : "No hay profesionales registrados"}
            >
              {professionals.map((professional) => {
                const color = professional.color || professional.professional?.color || "#2196f3";
                const initials = professional.name
                  .split(" ")
                  .filter(n => n.length > 0)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={professional.id}>
                    <TableCell>
                      <Avatar
                        name={initials}
                        style={{ backgroundColor: color }}
                        className="w-9 h-9 text-xs font-semibold rounded-full text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900">
                        {professional.name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">
                        {professional.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {professional.professional?.specialties && professional.professional.specialties.length > 0 ? (
                          professional.professional.specialties.map((specialty) => (
                            <Chip
                              key={specialty.id}
                              variant="bordered"
                              color="secondary"
                              size="sm"
                              className="text-xs"
                            >
                              {specialty.name}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Sin especialidad</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleEdit(professional)}
                          title="Editar"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(professional)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      <ConfirmationDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, professional: null })}
        onConfirm={confirmDelete}
        title="Eliminar Profesional"
        message={
          deleteDialog.professional
            ? `¿Estás seguro de que deseas eliminar al profesional ${deleteDialog.professional.name}? Esta acción no se puede deshacer.`
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
  );
}
