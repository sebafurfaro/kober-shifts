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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Alert,
  Divider,
  Chip,
} from "@heroui/react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PanelHeader } from "../components/PanelHeader";
import Typography from "@/app/components/Typography";
import { useParams, useRouter } from "next/navigation";

interface Appointment {
  id: string;
  professionalName: string;
  locationName: string;
  startAt: string;
  endAt: string;
  status: string;
  cancellationReason: string | null;
  cancelledBy: string | null;
  notes: string | null;
}

export default function PatientPanelPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [patientSelfBookingEnabled, setPatientSelfBookingEnabled] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/plataforma/${tenantId}/features`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPatientSelfBookingEnabled(
          typeof data.patientSelfBookingEnabled === "boolean" ? data.patientSelfBookingEnabled : false
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const loadAppointments = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/patient`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load appointments");
      }
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCancelClick = (appointment: Appointment) => {
    if (appointment.status === "CANCELLED") return;
    setSelectedAppointment(appointment);
    setCancelReason("");
    setCancelError(null);
    setCancelDialogOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!selectedAppointment) return;

    if (!cancelReason || cancelReason.trim().length < 100) {
      setCancelError("El motivo de cancelación debe tener al menos 100 caracteres");
      return;
    }

    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/${selectedAppointment.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
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

  const getStatusLabel = (status: string, cancelledBy: string | null) => {
    if (status === "CANCELLED") {
      if (cancelledBy === "PATIENT") {
        return "Cancelado por ti";
      } else if (cancelledBy === "PROFESSIONAL" || cancelledBy === "ADMIN") {
        return "Cancelado";
      }
      return "Cancelado";
    }
    const statusMap: Record<string, string> = {
      REQUESTED: "Solicitado",
      PENDING_DEPOSIT: "Pendiente de seña",
      CONFIRMED: "Confirmado",
      ATTENDED: "Atendido",
    };
    return statusMap[status] || status;
  };

  const handleCreate = () => {
    router.push(`/plataforma/${tenantId}/panel/patient/nuevo-turno`);
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <PanelHeader
        title="Mis Turnos"
        subtitle="Gestiona tus turnos médicos"
        action={
          patientSelfBookingEnabled
            ? {
                label: "Nuevo Turno",
                onClick: handleCreate,
              }
            : undefined
        }
      />
      <div className="py-8">
        <Card>
          <CardBody className="p-0">
            <div className="hidden md:block">
              <Table aria-label="Tabla de turnos">
                <TableHeader>
                  <TableColumn>Profesional</TableColumn>
                  <TableColumn>Sede</TableColumn>
                  <TableColumn>Fecha</TableColumn>
                  <TableColumn>Hora</TableColumn>
                  <TableColumn>Estado</TableColumn>
                  <TableColumn align="end">Acciones</TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={loading}
                  loadingContent={<Spinner />}
                  emptyContent={loading ? "Cargando..." : "No tienes turnos asignados"}
                >
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{appointment.professionalName}</TableCell>
                      <TableCell>{appointment.locationName}</TableCell>
                      <TableCell>
                        {format(new Date(appointment.startAt), "PPP", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(appointment.startAt), "HH:mm")} - {format(new Date(appointment.endAt), "HH:mm")}
                      </TableCell>
                      <TableCell>{getStatusLabel(appointment.status, appointment.cancelledBy)}</TableCell>
                      <TableCell>
                        {appointment.status !== "CANCELLED" && (
                          <Button
                            size="sm"
                            color="danger"
                            startContent={<X className="w-4 h-4" />}
                            onPress={() => handleCancelClick(appointment)}
                          >
                            Cancelar
                          </Button>
                        )}
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
              ) : appointments.length === 0 ? (
                <Typography variant="p" color="gray">No tienes turnos asignados</Typography>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="flex flex-col space-y-3">
                    <Typography variant="h6" color="black">{apt.professionalName ?? "—"}</Typography>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <Typography variant="p" color="gray" opacity={50}>Fecha</Typography>
                        <Typography variant="p">{format(new Date(apt.startAt), "PPP", { locale: es })}</Typography>
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
                          {getStatusLabel(apt.status, apt.cancelledBy)}
                        </Chip>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <Typography variant="p" color="gray" opacity={50}>Sede</Typography>
                        <Typography variant="p">{apt.locationName ?? "—"}</Typography>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Typography variant="p" color="gray" opacity={50}>Hora</Typography>
                        <Typography variant="p">
                          {format(new Date(apt.startAt), "HH:mm")} - {format(new Date(apt.endAt), "HH:mm")}
                        </Typography>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-3">
                      {apt.status !== "CANCELLED" && (
                        <Button
                          size="sm"
                          variant="solid"
                          color="danger"
                          onPress={() => handleCancelClick(apt)}
                          aria-label="Cancelar"
                          startContent={<X className="w-4 h-4" />}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                    <Divider className="my-4" />
                  </div>
                ))
              )}
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
                Por favor, indica el motivo de la cancelación (mínimo 100 caracteres):
              </p>
              <Textarea
                label="Motivo de cancelación"
                placeholder="Escribe el motivo de cancelación..."
                value={cancelReason}
                onValueChange={(value) => {
                  setCancelReason(value);
                  setCancelError(null);
                }}
                isInvalid={!!cancelError}
                errorMessage={cancelError || `${cancelReason.length}/100 caracteres mínimo`}
                isRequired
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
                isDisabled={cancelLoading || cancelReason.trim().length < 100}
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
