"use client";

import * as React from "react";
import { Container, Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from "@mui/material";
import { Cancel as CancelIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PanelHeader } from "../components/PanelHeader";

interface Appointment {
  id: string;
  professionalName: string;
  locationName: string;
  specialtyName: string;
  startAt: string;
  endAt: string;
  status: string;
  cancellationReason: string | null;
  cancelledBy: string | null;
  notes: string | null;
}

export default function PatientPanelPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const loadAppointments = React.useCallback(async () => {
    try {
      const res = await fetch("/api/appointments/patient");
      if (!res.ok) throw new Error("Failed to load appointments");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const res = await fetch(`/api/appointments/${selectedAppointment.id}/cancel`, {
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
      CONFIRMED: "Confirmado",
      ATTENDED: "Atendido",
    };
    return statusMap[status] || status;
  };

  return (
    <Container maxWidth="lg">
      <PanelHeader title="Mis Turnos" subtitle="Gestiona tus turnos médicos" />
      <Box sx={{ py: 4 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Profesional</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No tienes turnos asignados
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
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
                    <TableCell align="right">
                      {appointment.status !== "CANCELLED" && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelClick(appointment)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Cancel Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cancelar Turno</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {cancelError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCancelError(null)}>
                  {cancelError}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Por favor, indica el motivo de la cancelación (mínimo 100 caracteres):
              </Typography>
              <TextField
                autoComplete="off"
                label="Motivo de cancelación"
                multiline
                rows={4}
                fullWidth
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelError(null);
                }}
                error={!!cancelError}
                helperText={`${cancelReason.length}/100 caracteres mínimo`}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
              Cerrar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleCancelSubmit}
              disabled={cancelLoading || cancelReason.trim().length < 100}
            >
              {cancelLoading ? "Cancelando..." : "Confirmar Cancelación"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
