"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Switch,
} from "@heroui/react";
import { Trash2, Plus, LogOut } from "lucide-react";
import { ConfirmationDialog } from "../../plataforma/[tenantId]/panel/components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../plataforma/[tenantId]/panel/components/alerts/AlertDialog";
import { TenantFormDialog } from "../components/TenantFormDialog";
import { useRouter } from "next/navigation";

interface TenantFeatures {
  calendar: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

interface Tenant {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  features?: TenantFeatures;
}

export default function StoreTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    message: "",
    onConfirm: () => {},
  });
  const [alertDialog, setAlertDialog] = React.useState<{
    open: boolean;
    message: string;
    type: "error" | "info" | "success" | "warning";
  }>({ open: false, message: "", type: "error" });

  const loadTenants = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/store/tenants`, {
        credentials: "include", // Important: include cookies
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/store/login";
          return;
        }
        throw new Error("Failed to load tenants");
      }
      const data = await res.json();
      const tenantsList = Array.isArray(data) ? data : [];
      
      // Load features for each tenant
      const tenantsWithFeatures = await Promise.all(
        tenantsList.map(async (tenant: Tenant) => {
          try {
            const featuresRes = await fetch(`/api/store/tenants/${tenant.id}/features`, {
              credentials: "include",
            });
            if (featuresRes.ok) {
              const features = await featuresRes.json();
              return { ...tenant, features };
            }
          } catch (error) {
            console.error(`Error loading features for tenant ${tenant.id}:`, error);
          }
          return tenant;
        })
      );
      
      setTenants(tenantsWithFeatures);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleCreate = () => {
    setDialogOpen(true);
  };

  const handleDelete = (tenant: Tenant) => {
    setConfirmationDialog({
      open: true,
      message: `¿Estás seguro de que deseas eliminar el tenant "${tenant.name}" (${tenant.id})? Esta acción eliminará todos los datos asociados y no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/store/tenants/${tenant.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Error al eliminar tenant");
          }
          await loadTenants();
        } catch (error: any) {
          setAlertDialog({
            open: true,
            message: error.message || "Error al eliminar tenant",
            type: "error",
          });
        }
      },
    });
  };

  const handleSubmit = async (data: { name: string; id?: string; logoUrl?: string }) => {
    try {
      const res = await fetch(`/api/store/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Error al crear tenant");
      }
      await loadTenants();
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/store/auth/logout", { method: "POST" });
      router.push("/store/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      router.push("/store/login");
    }
  };

  const handleFeatureToggle = async (
    tenantId: string,
    featureKey: keyof TenantFeatures,
    value: boolean
  ) => {
    try {
      const currentFeatures = tenants.find((t) => t.id === tenantId)?.features || {
        calendar: true,
        emailNotifications: false,
        whatsappNotifications: false,
      };

      const updatedFeatures = {
        ...currentFeatures,
        [featureKey]: value,
      };

      const res = await fetch(`/api/store/tenants/${tenantId}/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ features: updatedFeatures }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar feature flag");
      }

      // Update local state
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenantId
            ? { ...tenant, features: updatedFeatures }
            : tenant
        )
      );
    } catch (error: any) {
      setAlertDialog({
        open: true,
        message: error.message || "Error al actualizar feature flag",
        type: "error",
      });
    }
  };

  return (
    <div className="w-full mx-auto mt-8 px-4 py-8 min-h-screen bg-nodo space-y-4">
      <Card className="max-w-5xl card mx-auto !shadow-lg">
        <CardBody>
          <div className="flex justify-between items-center text-slate-800">
            <div>
              <h2 className="text-xl font-semibold">Gestión de Tenants</h2>
              <p className="text-sm text-gray-500">Administra los tenants de la plataforma</p>
            </div>
            <div className="flex gap-2">
              <Button
                color="primary"
                onPress={handleCreate}
                isIconOnly
                title="Agregar tenant"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                color="danger"
                onPress={handleLogout}
                isIconOnly
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="max-w-5xl mx-auto !shadow-lg card">
        <CardBody>
          <Table aria-label="Tabla de tenants" classNames={{base: "text-slate-800"}}>
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Nombre</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn>Calendario</TableColumn>
              <TableColumn>Email</TableColumn>
              <TableColumn>WhatsApp</TableColumn>
              <TableColumn>Fecha de Creación</TableColumn>
              <TableColumn align="end">Acciones</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner />}
              emptyContent={tenants.length === 0 ? "No hay tenants registrados" : undefined}
            >
              {tenants.map((tenant) => {
                const features = tenant.features || {
                  calendar: true,
                  emailNotifications: false,
                  whatsappNotifications: false,
                };

                return (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <code className="text-sm">{tenant.id}</code>
                    </TableCell>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>
                      <Chip
                        color={tenant.isActive ? "success" : "default"}
                        size="sm"
                      >
                        {tenant.isActive ? "Activo" : "Inactivo"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Switch
                        size="sm"
                        isSelected={features.calendar}
                        onValueChange={(value) =>
                          handleFeatureToggle(tenant.id, "calendar", value)
                        }
                        aria-label="Calendario"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        size="sm"
                        isSelected={features.emailNotifications}
                        onValueChange={(value) =>
                          handleFeatureToggle(tenant.id, "emailNotifications", value)
                        }
                        aria-label="Notificaciones por Email"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        size="sm"
                        isSelected={features.whatsappNotifications}
                        onValueChange={(value) =>
                          handleFeatureToggle(tenant.id, "whatsappNotifications", value)
                        }
                        aria-label="Notificaciones por WhatsApp"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onPress={() => handleDelete(tenant)}
                          isIconOnly
                          color="danger"
                          aria-label="eliminar"
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
        </CardBody>
      </Card>

        <TenantFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
        />

        <ConfirmationDialog
          open={confirmationDialog.open}
          onClose={() => setConfirmationDialog({ ...confirmationDialog, open: false })}
          onConfirm={confirmationDialog.onConfirm}
          message={confirmationDialog.message}
          title="Eliminar Tenant"
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
