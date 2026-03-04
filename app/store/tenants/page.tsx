"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from "@heroui/react";
import { Trash2, Settings } from "lucide-react";
import { ConfirmationDialog } from "../../plataforma/[tenantId]/panel/components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../plataforma/[tenantId]/panel/components/alerts/AlertDialog";
import { useRouter } from "next/navigation";
import type { TenantFeatureFlags, TenantLimits } from "../components/TenantConfigDialog";

interface TenantConfig {
  features: TenantFeatureFlags;
  limits: TenantLimits;
}

interface Tenant {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  config?: TenantConfig;
}

export default function StoreTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
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

      const tenantsWithConfig = await Promise.all(
        tenantsList.map(async (tenant: Tenant) => {
          try {
            const configRes = await fetch(`/api/store/tenants/${tenant.id}/features`, {
              credentials: "include",
            });
            if (configRes.ok) {
              const config = await configRes.json();
              return { ...tenant, config };
            }
          } catch (error) {
            console.error(`Error loading config for tenant ${tenant.id}:`, error);
          }
          return tenant;
        })
      );

      setTenants(tenantsWithConfig);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTenants();
  }, [loadTenants]);

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

  const tableHeader = [
    { label: "ID", key: "id" },
    { label: "Nombre", key: "name" },
    { label: "Estado", key: "status" },
    { label: "Max usuarios", key: "maxUsers" },
    { label: "Recordatorios WhatsApp", key: "whatsappRemindersLimit" },
    { label: "Fecha de Creación", key: "createdAt" },
    { label: "Acciones", key: "actions" },
  ];

  return (
    <div className="w-full mx-auto px-4 py-8 space-y-4">
      <Card className="max-w-5xl mx-auto shadow-lg card">
        <CardHeader className="flex items-center justify-between gap-3 text-slate-800">
          <div className="text-base font-semibold">Tenants</div>
        </CardHeader>
        <CardBody>
          <Table aria-label="Tabla de tenants" classNames={{base: "text-slate-800"}}>
            <TableHeader columns={tableHeader}>
              {(header) => (
                <TableColumn key={header.key} align={header.key === "actions" ? "end" : "start"}>
                  {header.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner />}
              emptyContent={tenants.length === 0 ? "No hay tenants registrados" : undefined}
            >
              {tenants.map((tenant) => {
                const config = tenant.config || {
                  features: {
                    show_coverage: true,
                    show_mercado_pago: true,
                    payment_enabled: true,
                  },
                  limits: { maxUsers: 1, whatsappRemindersLimit: 0 },
                };
                const feats = config.features as { payment_enabled?: boolean; disabled_payment?: boolean };
                const paymentEnabled =
                  feats.payment_enabled ??
                  (typeof feats.disabled_payment === "boolean" ? !feats.disabled_payment : true);
                const statusLabel = paymentEnabled === false ? "Suspendido" : tenant.isActive ? "Activo" : "Inactivo";
                const statusColor = paymentEnabled === false ? "warning" : tenant.isActive ? "success" : "default";

                return (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <code className="text-sm">{tenant.id}</code>
                    </TableCell>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>
                      <Chip
                        color={statusColor}
                        size="sm"
                      >
                        {statusLabel}
                      </Chip>
                    </TableCell>
                    <TableCell>{config.limits.maxUsers}</TableCell>
                    <TableCell>{config.limits.whatsappRemindersLimit}</TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => router.push(`/store/tenants/${tenant.id}`)}
                          isIconOnly
                          aria-label="Configurar"
                          title="Configurar límites y feature flags"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
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
