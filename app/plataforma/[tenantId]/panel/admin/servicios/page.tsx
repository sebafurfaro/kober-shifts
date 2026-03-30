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
  Divider,
  Alert,
} from "@heroui/react";
import { Pencil, Trash2, Eye } from "lucide-react";
import Typography from "@/app/components/Typography";
import { ServiceFormDialog } from "../components/ServiceFormDialog";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { PanelHeader } from "../../components/PanelHeader";
import { useParams } from "next/navigation";
import { Section } from "../../components/layout/Section";
import { useFeatureGate } from "@/lib/use-feature-gate";
import { useMercadoPagoAccount } from "@/hooks/useMercadoPagoAccount";
import { MP_OAUTH_ERROR_MESSAGES } from "@/lib/mercadopago-oauth-messages";
import { Suspense } from "react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  marginMinutes: number;
  price: number;
  seniaPercent: number;
}

function MercadoPagoBanner({ tenantId }: { tenantId: string }) {
  const {
    isLinked,
    isLoading,
    isDisconnecting,
    connect,
    disconnect,
    mpErrorParam,
    mpSuccessParam,
  } = useMercadoPagoAccount(tenantId);

  return (
    <Card className="mb-6 shadow-sm border border-divider">
      <CardBody className="flex flex-col gap-4 py-4 px-6 bg-slate-50">
        {mpErrorParam ? (
          <Alert color="danger" variant="flat">
            {MP_OAUTH_ERROR_MESSAGES[mpErrorParam] || "Error al vincular con Mercado Pago."}
          </Alert>
        ) : null}
        {mpSuccessParam === "1" ? (
          <Alert color="success" variant="flat">
            Cuenta vinculada correctamente con Mercado Pago.
          </Alert>
        ) : null}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#009ee3] p-2.5 rounded-full flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
          <div>
            <Typography variant="h6" color="black" className="!mb-0">Cobros con Mercado Pago</Typography>
            <Typography variant="p" color="gray" opacity={50} className="text-sm mt-0.5 max-w-[500px]">
              Recibí pagos o señas (%) para asegurar turnos. Vinculá tu cuenta para habilitarlo en tus servicios con costo.
            </Typography>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          {isLoading ? (
            <Spinner size="sm" />
          ) : isLinked ? (
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Cuenta activa
              </div>
              <Button 
                 size="sm" 
                 variant="bordered" 
                 color="danger"
                 onPress={disconnect}
                 isLoading={isDisconnecting}
              >
                Desvincular
              </Button>
            </div>
          ) : (
            <Button 
              onPress={connect}
              className="bg-[#009ee3] text-white font-medium w-full md:w-auto"
            >
              Vincular Mercado Pago
            </Button>
          )}
        </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function ServiciosPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const { isLoading: featureGateLoading } = useFeatureGate("show_servicios");
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

  const dialogOpenForForm = dialogOpen && (!!editingService || !viewingService);
  const dialogOpenForView = dialogOpen && !!viewingService && !editingService;

  return (
    <Section>
      <PanelHeader
        title="Servicios"
        subtitle="Gestiona los servicios y precios de tu centro"
        action={{
          label: "Crear servicio",
          onClick: handleCreate,
        }}
      />

      <Suspense fallback={null}>
        <MercadoPagoBanner tenantId={tenantId} />
      </Suspense>

      <Card>
        <CardBody className="p-0">
          <div className="hidden md:block">
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
          </div>

          <div className="flex md:hidden flex-col gap-4 p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : services.length === 0 ? (
              <Typography variant="p" color="gray">No hay servicios. Creá uno para comenzar.</Typography>
            ) : (
              services.map((svc) => (
                <div key={svc.id} className="flex flex-col space-y-3">
                  <Typography variant="h6" color="black">{svc.name}</Typography>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Descripción</Typography>
                      <Typography variant="p">{svc.description || "—"}</Typography>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Duración</Typography>
                      <Typography variant="p">{svc.durationMinutes} min</Typography>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Margen</Typography>
                      <Typography variant="p">{svc.marginMinutes} min</Typography>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Precio</Typography>
                      <Typography variant="p">
                        ${typeof svc.price === "number" ? svc.price.toFixed(2) : svc.price}
                      </Typography>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Seña %</Typography>
                      <Typography variant="p">{svc.seniaPercent}%</Typography>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-3">
                    <Button
                      size="sm"
                      variant="solid"
                      color="default"
                      onPress={() => handleView(svc)}
                      aria-label="Ver"
                      startContent={<Eye className="w-4 h-4" />}
                    >
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="solid"
                      color="primary"
                      onPress={() => handleEdit(svc)}
                      aria-label="Editar"
                      startContent={<Pencil className="w-4 h-4" />}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="solid"
                      color="danger"
                      onPress={() => handleDelete(svc)}
                      aria-label="Eliminar"
                      startContent={<Trash2 className="w-4 h-4" />}
                    >
                      Eliminar
                    </Button>
                  </div>
                  <Divider className="my-4" />
                </div>
              ))
            )}
          </div>
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
    </Section>
  );
}
