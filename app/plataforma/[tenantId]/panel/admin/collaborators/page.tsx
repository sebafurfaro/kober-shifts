"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Avatar, Button, Spinner, Card, CardBody, Divider } from "@heroui/react";
import { Edit, Trash2 } from "lucide-react";
import { PanelHeader } from "../../components/PanelHeader";
import Typography from "@/app/components/Typography";
import { useRouter, useParams } from "next/navigation";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { EditUserAside, type EditUserFormData } from "./components/EditUserAside";
import { useTenantLabels } from "@/lib/use-tenant-labels";
import { useTenantSettingsStore } from "@/lib/tenant-settings-store";
import { Section } from "../../components/layout/Section";
import { useTour } from "@/hooks/useTour";
import { TourButton } from "@/app/components/panel/TourButton";

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

  const { startTour, hasSeenTour, TourExitDialog } = useTour("collaborators", [
    {
      element: "#tour-collaborators-create",
      popover: {
        title: "Nuevo Colaborador",
        description: "Desde acá podés invitar a tu equipo de trabajo y asignarles roles.",
        side: "bottom",
        align: "start",
      },
    },
  ]);

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
    const body: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      dni: data.dni || null,
      role: data.role,
    };
    if (data.role === "ADMIN") {
      body.alsoProfessional = data.alsoProfessional ?? false;
    }
    if (data.tempPassword?.trim()) {
      body.tempPassword = data.tempPassword.trim();
    }
    if (editUser) {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/professionals/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
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
        body: JSON.stringify(body),
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
    <Section>
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
                  id: "tour-collaborators-create",
                }
          }
        />

        <Card className="card">
          <CardBody className="p-0">
            <div className="hidden md:block">
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
            </div>

            <div className="flex md:hidden flex-col gap-4 p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner label="Cargando..." />
                </div>
              ) : professionals.length === 0 ? (
                <Typography variant="p" color="gray">No hay colaboradores registrados</Typography>
              ) : (
                professionals.map((pro, index) => {
                  const color = pro.color || pro.professional?.color || "#2196f3";
                  const name = pro.name ?? "";
                  const initials = name
                    .split(" ")
                    .filter((n: string) => n.length > 0)
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const roleLabel =
                    pro.role === "ADMIN"
                      ? "Administrador"
                      : pro.role === "SUPERVISOR"
                        ? "Recepcionista"
                        : "Profesional";
                  return (
                    <div key={pro.id} className="flex flex-col space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={initials}
                          style={{ backgroundColor: color }}
                          className="w-10 h-10 text-sm font-semibold rounded-full text-white shrink-0"
                        />
                        <Typography variant="h6" color="black">{name || "—"}</Typography>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1">
                          <Typography variant="p" color="gray" opacity={50}>Email</Typography>
                          <Typography variant="p">{pro.email ?? "—"}</Typography>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Typography variant="p" color="gray" opacity={50}>Rol</Typography>
                          <Typography variant="p">{roleLabel}</Typography>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 mt-3">
                        <Button
                          size="sm"
                          variant="solid"
                          color="primary"
                          onPress={() => handleEdit(pro)}
                          aria-label="Editar"
                          startContent={<Edit className="w-4 h-4" />}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="solid"
                          color="danger"
                          onPress={() => handleDelete(pro)}
                          aria-label="Eliminar"
                          startContent={<Trash2 className="w-4 h-4" />}
                        >
                          Eliminar
                        </Button>
                      </div>
                      {index < professionals.length - 1 && (
                        <Divider className="my-4" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardBody>
        </Card>

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
        initialData={editUser ? { name: editUser.name, email: editUser.email, dni: editUser.dni ?? "", role: editUser.role, hasProfessionalProfile: !!editUser.professional } : null}
        onSubmit={handleEditUserSubmit}
      />

      <TourExitDialog />
      <div className="fixed bottom-6 right-6 z-50">
        <TourButton onClick={startTour} />
      </div>
    </Section>
  );
}
