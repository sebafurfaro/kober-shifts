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
  Chip,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Alert,
} from "@heroui/react";
import { CircleX } from "lucide-react";
import { PanelHeader } from "../components/PanelHeader";
import { useParams } from "next/navigation";

type Filter = "hoy" | "proximos" | "todos";

const AR_TZ = "America/Argentina/Buenos_Aires";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AR_TZ,
  });
}

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  locationName: string;
  startAt: string;
  endAt: string;
  status: string;
  cancellationReason: string | null;
  cancelledBy: string | null;
  notes: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Solicitado",
  PENDING_DEPOSIT: "Pendiente de seña",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  ATTENDED: "Atendido",
};

export default function ProfessionalPanelPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [todayAppointments, setTodayAppointments] = React.useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("todos");
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const allAppointments = React.useMemo(
    () => [...todayAppointments, ...upcomingAppointments].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    ),
    [todayAppointments, upcomingAppointments]
  );

  const filteredAppointments = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    if (filter === "hoy") {
      return allAppointments.filter((a) => {
        const t = new Date(a.startAt).getTime();
        return t >= todayStart.getTime() && t <= todayEnd.getTime();
      });
    }
    if (filter === "proximos") {
      return allAppointments.filter((a) => new Date(a.startAt).getTime() > todayEnd.getTime());
    }
    return allAppointments;
  }, [allAppointments, filter]);

  const loadAppointments = React.useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/professional`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "No se pudieron cargar los turnos");
      }
      setTodayAppointments(Array.isArray(data.today) ? data.today : []);
      setUpcomingAppointments(Array.isArray(data.upcoming) ? data.upcoming : []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar los turnos";
      setLoadError(message);
      setTodayAppointments([]);
      setUpcomingAppointments([]);
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) loadAppointments();
  }, [mounted, loadAppointments]);

  const handleCancelClick = (appointment: Appointment) => {
    if (appointment.status === "CANCELLED") return;
    setSelectedAppointment(appointment);
    setCancelReason("");
    setCancelError(null);
    setCancelDialogOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!selectedAppointment) return;

    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/${selectedAppointment.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() || null }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Error al cancelar el turno");
      }
      setCancelDialogOpen(false);
      await loadAppointments();
    } catch (error: any) {
      setCancelError(error?.message || "Error al cancelar el turno");
    } finally {
      setCancelLoading(false);
    }
  };

  const isCancellable = (status: string) =>
    status === "REQUESTED" || status === "PENDING_DEPOSIT" || status === "CONFIRMED";

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="py-8">
        <PanelHeader title="Mis Turnos" subtitle="Gestiona tus turnos" />

        {loadError && (
          <Alert color="danger" onClose={() => setLoadError(null)} className="mb-4">
            {loadError}
          </Alert>
        )}

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-slate-800 p-4">
          <CardBody className="p-0">
            <div className="flex flex-wrap gap-2 mb-4">
              {(
                [
                  { key: "hoy" as const, label: "Hoy" },
                  { key: "proximos" as const, label: "Próximos" },
                  { key: "todos" as const, label: "Todos" },
                ] as const
              ).map(({ key, label }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={filter === key ? "solid" : "bordered"}
                  color="primary"
                  onPress={() => setFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <Table aria-label="Mis turnos" removeWrapper>
              <TableHeader>
                <TableColumn>Sucursal</TableColumn>
                <TableColumn>Cliente</TableColumn>
                <TableColumn>Fecha y hora</TableColumn>
                <TableColumn>Estado</TableColumn>
                <TableColumn align="end">Acciones</TableColumn>
              </TableHeader>
              <TableBody
                isLoading={!mounted || loading}
                loadingContent={<Spinner label="Cargando..." />}
                emptyContent={!mounted || loading ? null : "No hay turnos"}
              >
                {mounted ? filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.locationName ?? "—"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-gray-500">{appointment.patientEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell suppressHydrationWarning>{formatDateTime(appointment.startAt)}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          appointment.status === "CONFIRMED"
                            ? "success"
                            : appointment.status === "CANCELLED"
                              ? "danger"
                              : appointment.status === "ATTENDED"
                                ? "primary"
                                : "warning"
                        }
                      >
                        {STATUS_LABELS[appointment.status] ?? appointment.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {isCancellable(appointment.status) && (
                          <Tooltip content="Cancelar" placement="top">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleCancelClick(appointment)}
                              aria-label="Cancelar"
                            >
                              <CircleX className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : null}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Cancel Dialog */}
        <Modal 
          isOpen={cancelDialogOpen} 
          onClose={() => setCancelDialogOpen(false)} 
          size="md"
          classNames={{
            wrapper: "z-[99999]"
          }}
        >
          <ModalContent>
            <ModalHeader>Cancelar Turno</ModalHeader>
            <ModalBody>
              {cancelError && (
                <Alert color="danger" onClose={() => setCancelError(null)} className="mb-4">
                  {cancelError}
                </Alert>
              )}
              <p className="text-sm text-gray-600 mb-4">
                Puedes indicar un motivo de cancelación (opcional):
              </p>
              <Textarea
                label="Motivo de cancelación (opcional)"
                placeholder="Escribe el motivo de cancelación..."
                value={cancelReason}
                onValueChange={(value) => {
                  setCancelReason(value);
                  setCancelError(null);
                }}
                isInvalid={!!cancelError}
                errorMessage={cancelError || "El motivo es opcional para profesionales"}
                minRows={4}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => setCancelDialogOpen(false)}
                isDisabled={cancelLoading}
              >
                Cerrar
              </Button>
              <Button
                color="danger"
                onPress={handleCancelSubmit}
                isDisabled={cancelLoading}
                isLoading={cancelLoading}
              >
                {cancelLoading ? "Cancelando..." : "Confirmar Cancelación"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
