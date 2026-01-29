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
} from "@heroui/react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PanelHeader } from "../components/PanelHeader";
import { useParams } from "next/navigation";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  locationName: string;
  specialtyName: string;
  startAt: string;
  endAt: string;
  status: string;
  cancellationReason: string | null;
  cancelledBy: string | null;
  notes: string | null;
}

export default function ProfessionalPanelPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [todayAppointments, setTodayAppointments] = React.useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const loadAppointments = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/professional`);
      if (!res.ok) throw new Error("Failed to load appointments");
      const data = await res.json();
      setTodayAppointments(Array.isArray(data.today) ? data.today : []);
      setUpcomingAppointments(Array.isArray(data.upcoming) ? data.upcoming : []);
    } catch (error) {
      console.error("Error loading appointments:", error);
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

  const getStatusLabel = (status: string, cancelledBy: string | null) => {
    if (status === "CANCELLED") {
      if (cancelledBy === "PATIENT") {
        return "Paciente cancela";
      } else if (cancelledBy === "PROFESSIONAL") {
        return "Cancelado por ti";
      } else if (cancelledBy === "ADMIN") {
        return "Cancelado";
      }
      return "Cancelado";
    }
    const statusMap: Record<string, string> = {
      REQUESTED: "Solicitado",
      CONFIRMED: "Confirmado",
      ATTENDED: "Atendido",
    };
    return statusMap[status] || status;
  };

  const renderTable = (appointments: Appointment[], title: string) => (
    <div className="my-8">
      <h3 className="text-lg font-bold mb-4 text-gray-800">
        {title}
      </h3>
      <Card>
        <CardBody className="p-0">
          <Table aria-label={`Tabla de ${title}`}>
            <TableHeader>
              <TableColumn>Paciente</TableColumn>
              <TableColumn>Sede</TableColumn>
              <TableColumn>Fecha</TableColumn>
              <TableColumn>Hora</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn align="end">Acciones</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<Spinner />}
              emptyContent={loading ? "Cargando..." : "No hay turnos"}
            >
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-gray-500">{appointment.patientEmail}</p>
                    </div>
                  </TableCell>
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
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4">
      <PanelHeader title="Mis Turnos" subtitle="Gestiona tus turnos" />
      <div className="py-8">
        {renderTable(todayAppointments, "Turnos de Hoy")}
        <div className="border-t border-gray-200 my-8" />
        {renderTable(upcomingAppointments, "Próximos Turnos")}

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
