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
  Divider,
} from "@heroui/react";
import { CircleX, Hand } from "lucide-react";
import { PanelHeader } from "../components/PanelHeader";
import Typography from "@/app/components/Typography";
import { useParams } from "next/navigation";
import { Section } from "../components/layout/Section";

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
  const [attendedLoadingId, setAttendedLoadingId] = React.useState<string | null>(null);

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

  const handleMarkAttended = async (appointment: Appointment) => {
    setAttendedLoadingId(appointment.id);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "ATTENDED" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al marcar como atendido");
      }
      await loadAppointments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al marcar como atendido";
      setLoadError(message);
    } finally {
      setAttendedLoadingId(null);
    }
  };

  const isCancellable = (status: string) =>
    status === "REQUESTED" || status === "PENDING_DEPOSIT" || status === "CONFIRMED";

  return (
    <Section>
      
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

            <div className="hidden md:block">
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
                  {(mounted ? filteredAppointments : []).map((appointment) => (
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
                          <Tooltip content={appointment.status === "CONFIRMED" ? "Marcar como atendido" : "Solo para turnos confirmados"} placement="top">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              isDisabled={appointment.status !== "CONFIRMED" || attendedLoadingId === appointment.id}
                              isLoading={attendedLoadingId === appointment.id}
                              onPress={() => appointment.status === "CONFIRMED" && handleMarkAttended(appointment)}
                              aria-label="Atendido"
                            >
                              <Hand className="w-4 h-4" />
                            </Button>
                          </Tooltip>
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex md:hidden flex-col gap-4">
              {(mounted ? filteredAppointments : []).map((apt) => (
                <div key={apt.id} className="flex flex-col space-y-3">
                  <Typography variant="h6" color="black">{apt.patientName ?? "—"}</Typography>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Fecha</Typography>
                      <Typography variant="p" suppressHydrationWarning>{formatDateTime(apt.startAt)}</Typography>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Estado</Typography>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          apt.status === "CONFIRMED" ? "success" :
                          apt.status === "CANCELLED" ? "danger" :
                          apt.status === "ATTENDED" ? "primary" : "warning"
                        }
                      >
                        {STATUS_LABELS[apt.status] ?? apt.status}
                      </Chip>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Sucursal</Typography>
                      <Typography variant="p">{apt.locationName ?? "—"}</Typography>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Typography variant="p" color="gray" opacity={50}>Email</Typography>
                      <Typography variant="p">{apt.patientEmail ?? "—"}</Typography>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-3">
                    <Button
                      size="sm"
                      variant="solid"
                      color="primary"
                      isDisabled={apt.status !== "CONFIRMED" || attendedLoadingId === apt.id}
                      isLoading={attendedLoadingId === apt.id}
                      onPress={() => apt.status === "CONFIRMED" && handleMarkAttended(apt)}
                      aria-label="Atendido"
                      startContent={<Hand className="w-4 h-4" />}
                    >
                      Atendido
                    </Button>
                    {isCancellable(apt.status) && (
                      <Button
                        size="sm"
                        variant="solid"
                        color="danger"
                        onPress={() => handleCancelClick(apt)}
                        aria-label="Cancelar"
                        startContent={<CircleX className="w-4 h-4" />}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                  <Divider className="my-4" />
                </div>
              ))}
            </div>
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
    </Section>
  );
}
