"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Avatar, Button, Spinner, Card } from "@heroui/react";
import { Edit, Trash2 } from "lucide-react";
import { PanelHeader } from "../../components/PanelHeader";
import { useRouter, useParams } from "next/navigation";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { EditUserAside, type EditUserFormData } from "./components/EditUserAside";
import { useTenantLabels } from "@/lib/use-tenant-labels";
import { useTenantSettingsStore } from "@/lib/tenant-settings-store";

interface Professional {
  id: string;
  name: string;
  email: string;
  role: string;
  dni?: string | null;
  color?: string | null;
  professional?: {
    color?: string | null;
  } | null;
}

export default function AdminProfessionalsPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [maxUsers, setMaxUsers] = React.useState<number | null>(null);
  const pageTitle = "Colaboradores";
  const loadTranslations = useTenantSettingsStore((state) => state.loadTranslations);
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
  const [editAsideOpen, setEditAsideOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<Professional | null>(null);

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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/plataforma/${tenantId}/features`, { credentials: "include" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setMaxUsers(typeof data.maxUsers === "number" ? data.maxUsers : null);
        }
      } catch {
        if (!cancelled) setMaxUsers(null);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  // Load translations when component mounts
  React.useEffect(() => {
    if (tenantId) {
      loadTranslations(tenantId);
    }
  }, [tenantId, loadTranslations]);

  const atUserLimit = maxUsers !== null && professionals.length >= maxUsers;

  const handleCreate = () => {
    if (atUserLimit) return;
    setEditUser(null);
    setEditAsideOpen(true);
  };

  const handleEdit = (professional: Professional) => {
    setEditUser(professional);
    setEditAsideOpen(true);
  };

  const handleEditUserSubmit = async (data: EditUserFormData) => {
    if (editUser) {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/professionals/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          dni: data.dni || null,
          role: data.role,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar");
      }
    } else {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/professionals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          dni: data.dni || null,
          role: data.role,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear usuario");
      }
    }
    await loadData();
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
          title={pageTitle}
          subtitle={atUserLimit ? `Límite de ${maxUsers} usuario(s) alcanzado. No se pueden agregar más.` : undefined}
          action={
            atUserLimit
              ? undefined
              : {
                  label: "Agregar colaborador",
                  color: "primary",
                  onClick: handleCreate,
                }
          }
        />

        <Card className="card">
          <Table aria-label="Tabla de colaboradores">
            <TableHeader>
              <TableColumn key="color" className="rounded-tl-lg rounded-bl-lg text-slate-800 text-base">Color</TableColumn>
              <TableColumn key="name" className="text-slate-800 text-base">Nombre</TableColumn>
              <TableColumn key="email" className="text-slate-800 text-base">Email</TableColumn>
              <TableColumn key="role" className="text-slate-800 text-base">Rol</TableColumn>
              <TableColumn key="actions" className="text-right rounded-tr-lg rounded-br-lg text-slate-800 text-base">Acciones</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner label="Cargando..." />}
              emptyContent={loading ? null : "No hay colaboradores registrados"}
            >
              {professionals.map((professional) => {
                const color = professional.color || professional.professional?.color || "#2196f3";
                const name = professional.name ?? "";
                const initials = name
                  .split(" ")
                  .filter((n: string) => n.length > 0)
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const roleLabel =
                  professional.role === "ADMIN"
                    ? "Administrador"
                    : professional.role === "SUPERVISOR"
                      ? "Recepcionista"
                      : "Profesional";

                const actionCell = (
                  <TableCell key="actions">
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
                );
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
                        {name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">
                        {professional.email ?? ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700">
                        {roleLabel}
                      </p>
                    </TableCell>
                    {actionCell}
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
        title="Eliminar colaborador"
        message={
          deleteDialog.professional
            ? `¿Estás seguro de que deseas eliminar a ${deleteDialog.professional.name}? Esta acción no se puede deshacer.`
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

      <EditUserAside
        open={editAsideOpen}
        onClose={() => { setEditAsideOpen(false); setEditUser(null); }}
        mode={editUser ? "edit" : "create"}
        initialData={editUser ? { name: editUser.name, email: editUser.email, dni: editUser.dni ?? "", role: editUser.role } : null}
        onSubmit={handleEditUserSubmit}
      />
    </div>
  );
}
