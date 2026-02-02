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
import { Pencil, Trash2, Eye } from "lucide-react";
import { ServiceFormDialog } from "../components/ServiceFormDialog";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { PanelHeader } from "../../components/PanelHeader";
import { useParams } from "next/navigation";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  marginMinutes: number;
  price: number;
  seniaPercent: number;
}

export default function ServiciosPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [viewingService, setViewingService] = React.useState<Service | null>(null);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: "", onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = React.useState<{
    open: boolean;
    message: string;
    type: "error" | "info" | "success" | "warning";
  }>({ open: false, message: "", type: "error" });

  const loadServices = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/plataforma/${tenantId}/admin/services`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar servicios");
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading services:", error);
      setAlertDialog({
        open: true,
        message: "Error al cargar servicios",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleCreate = () => {
    setEditingService(null);
    setViewingService(null);
    setDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setViewingService(null);
    setDialogOpen(true);
  };

  const handleView = (service: Service) => {
    setViewingService(service);
    setEditingService(null);
    setDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    setConfirmationDialog({
      open: true,
      message: `¿Estás seguro de que deseas eliminar el servicio "${service.name}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/plataforma/${tenantId}/admin/services/${service.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Error al eliminar servicio");
          }
          await loadServices();
        } catch (err: unknown) {
          setAlertDialog({
            open: true,
            message: err instanceof Error ? err.message : "Error al eliminar servicio",
            type: "error",
          });
        }
      },
    });
  };

  const handleSubmit = async (data: {
    name: string;
    description: string;
    durationMinutes: number;
    marginMinutes: number;
    price: number;
    seniaPercent: number;
  }) => {
    setSubmitLoading(true);
    try {
      if (editingService) {
        const res = await fetch(
          `/api/plataforma/${tenantId}/admin/services/${editingService.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = err.detail ? `${err.error}: ${err.detail}` : (err.error || "Error al actualizar servicio");
          throw new Error(msg);
        }
      } else {
        const res = await fetch(`/api/plataforma/${tenantId}/admin/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = err.detail ? `${err.error}: ${err.detail}` : (err.error || "Error al crear servicio");
          throw new Error(msg);
        }
      }
      await loadServices();
      setDialogOpen(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const dialogOpenForForm = dialogOpen && (editingService || !viewingService);
  const dialogOpenForView = dialogOpen && !!viewingService && !editingService;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <PanelHeader
        title="Servicios"
        subtitle="Gestiona los servicios y precios de tu centro"
        action={{
          label: "Crear servicio",
          onClick: handleCreate,
        }}
      />

      <Card>
        <CardBody className="p-0">
          <Table aria-label="Tabla de servicios" className="text-slate-800">
            <TableHeader>
              <TableColumn className="text-slate-800 text-base">Nombre</TableColumn>
              <TableColumn className="text-slate-800 text-base">Descripción</TableColumn>
              <TableColumn className="text-slate-800 text-base">Duración</TableColumn>
              <TableColumn className="text-slate-800 text-base">Margen</TableColumn>
              <TableColumn className="text-slate-800 text-base">Precio</TableColumn>
              <TableColumn className="text-slate-800 text-base">Seña %</TableColumn>
              <TableColumn className="text-slate-800 text-base" align="end">
                Acciones
              </TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner />}
              emptyContent={
                loading ? "Cargando..." : "No hay servicios. Creá uno para comenzar."
              }
            >
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {service.description || "—"}
                  </TableCell>
                  <TableCell>{service.durationMinutes} min</TableCell>
                  <TableCell>{service.marginMinutes} min</TableCell>
                  <TableCell>
                    ${typeof service.price === "number" ? service.price.toFixed(2) : service.price}
                  </TableCell>
                  <TableCell>{service.seniaPercent}%</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleView(service)}
                        aria-label="ver"
                        title="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => handleEdit(service)}
                        aria-label="editar"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDelete(service)}
                        aria-label="eliminar"
                        title="Eliminar"
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

      <ServiceFormDialog
        open={dialogOpenForForm || dialogOpenForView}
        onClose={() => {
          setDialogOpen(false);
          setEditingService(null);
          setViewingService(null);
        }}
        onSubmit={handleSubmit}
        mode={dialogOpenForView ? "view" : editingService ? "edit" : "create"}
        initialData={editingService ?? viewingService ?? undefined}
        loading={submitLoading}
      />

      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={() => setConfirmationDialog((p) => ({ ...p, open: false }))}
        onConfirm={confirmationDialog.onConfirm}
        message={confirmationDialog.message}
        title="Eliminar servicio"
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="warning"
      />

      <AlertDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog((p) => ({ ...p, open: false }))}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
