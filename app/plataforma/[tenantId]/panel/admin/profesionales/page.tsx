"use client";

import * as React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Avatar, Button, Spinner, Card } from "@heroui/react";
import { Edit, Trash2 } from "lucide-react";
import { PanelHeader } from "../../components/PanelHeader";
import { useRouter, useParams } from "next/navigation";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { LinkCollaboratorAside, type LinkCollaboratorFormData } from "./components/LinkCollaboratorAside";
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

export default function AdminProfesionalesPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [maxUsers, setMaxUsers] = React.useState<number | null>(null);
  const { professionalLabel } = useTenantLabels();
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
  const [linkAsideOpen, setLinkAsideOpen] = React.useState(false);
  const [locations, setLocations] = React.useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = React.useState<{ id: string; name: string }[]>([]);

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

  React.useEffect(() => {
    if (tenantId) {
      loadTranslations(tenantId);
    }
  }, [tenantId, loadTranslations]);

  React.useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/plataforma/${tenantId}/admin/locations`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/plataforma/${tenantId}/admin/services`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([locs, srvs]) => {
      if (cancelled) return;
      setLocations(Array.isArray(locs) ? locs : []);
      setServices(Array.isArray(srvs) ? srvs : []);
    });
    return () => { cancelled = true; };
  }, [tenantId]);

  const professionalsWithProfile = React.useMemo(() => professionals.filter((p) => p.professional), [professionals]);
  const linkableCollaborators = React.useMemo(
    () => professionals.filter((p) => !p.professional).map((p) => ({ id: p.id, name: p.name ?? "", email: p.email ?? "" })),
    [professionals]
  );
  const hasNoProfessionals = professionalsWithProfile.length === 0;
  const atUserLimit = maxUsers !== null && professionals.length >= maxUsers;

  const handleCreate = () => {
    if (hasNoProfessionals) {
      setLinkAsideOpen(true);
    } else if (atUserLimit) {
      return;
    } else {
      router.push(`/plataforma/${tenantId}/panel/admin/profesionales/add-new`);
    }
  };

  const handleLinkSubmit = async (data: LinkCollaboratorFormData) => {
    if (!data.linkEmail) return;
    const email = data.email != null ? String(data.email).trim().toLowerCase() : "";
    if (!email) return;
    const res = await fetch(`/api/plataforma/${tenantId}/admin/professionals/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al vincular");
    }
    setLinkAsideOpen(false);
    await loadData();
  };

  const handleEdit = (professional: Professional) => {
    if (!professional.professional) return;
    router.push(`/plataforma/${tenantId}/panel/admin/profesionales/${professional.id}/edit`);
  };

  const handleDelete = (professional: Professional) => {
    setDeleteDialog({ open: true, professional });
  };

  const confirmDelete = async () => {
    const professionalToDelete = deleteDialog.professional;
    if (!professionalToDelete) return;

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
          title={professionalLabel}
          subtitle={
            hasNoProfessionals
              ? "Cree un colaborador con rol Profesional en Colaboradores para que aparezca aquí."
              : atUserLimit
                ? `Límite de ${maxUsers} usuario(s) alcanzado. No se pueden agregar más.`
                : undefined
          }
          action={
            (atUserLimit && !hasNoProfessionals) ? undefined : { label: "Agregar profesional", color: "primary", onClick: handleCreate }
          }
        />

        {hasNoProfessionals && !loading ? (
          <Card className="card p-8 text-center">
            <p className="text-slate-600">
              No hay profesionales. Cree un usuario con rol Profesional en <strong>Colaboradores</strong> para que aparezca aquí.
            </p>
          </Card>
        ) : (
        <Card className="card">
          <Table aria-label="Tabla de profesionales">
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
              emptyContent={loading ? null : `No hay ${professionalLabel.toLowerCase()} registrados`}
            >
              {professionalsWithProfile.map((professional) => {
                const color = professional.color || professional.professional?.color || "#2196f3";
                const name = professional.name ?? "";
                const initials = name
                  .split(" ")
                  .filter((n: string) => n.length > 0)
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const actionCell = (
                  <TableCell key="actions">
                    <div className="flex justify-end gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEdit(professional)}
                        title="Editar (perfil completo)"
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
                        {professional.role === "ADMIN"
                          ? "Administrador"
                          : professional.role === "SUPERVISOR"
                            ? "Recepcionista"
                            : "Profesional"}
                      </p>
                    </TableCell>
                    {actionCell}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        )}
      </div>

      <LinkCollaboratorAside
        open={linkAsideOpen}
        onClose={() => setLinkAsideOpen(false)}
        locations={locations}
        services={services}
        linkableCollaborators={linkableCollaborators}
        onSubmit={handleLinkSubmit}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, professional: null })}
        onConfirm={confirmDelete}
        title={`Eliminar ${professionalLabel.slice(0, -1)}`}
        message={
          deleteDialog.professional
            ? `¿Estás seguro de que deseas eliminar al ${professionalLabel.slice(0, -1).toLowerCase()} ${deleteDialog.professional.name}? Esta acción no se puede deshacer.`
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
