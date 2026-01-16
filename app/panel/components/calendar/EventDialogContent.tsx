import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Chip,
  Stack,
  DialogContent,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatForDateTimeLocal, parseFromDateTimeLocal, formatInBuenosAires, localDateToFullCalendar } from "@/lib/timezone";

interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  extendedProps: {
    patientId?: string;
    patientName?: string;
    patientEmail?: string;
    professionalId?: string;
    professionalName?: string;
    professionalEmail?: string;
    locationId?: string;
    locationName?: string;
    locationAddress?: string;
    specialtyId?: string;
    specialtyName?: string;
    status?: string;
    notes?: string | null;
    googleEventId?: string | null;
    cancellationReason?: string | null;
    cancelledBy?: string | null;
  };
  backgroundColor?: string;
  borderColor?: string;
}

interface EventDialogData {
  id?: string;
  start: Date;
  end: Date;
  patientId?: string;
  professionalId?: string;
  locationId?: string;
  specialtyId?: string;
  notes?: string;
}

interface EventDialogContentProps {
  mode: "create" | "edit" | "view";
  selectedEvent: CalendarEvent | null;
  eventDialogData: EventDialogData | null;
  onDataChange: (data: EventDialogData) => void;
  patients: any[];
  professionals: any[];
  locations: any[];
  specialties: any[];
  timezone: string;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

export function EventDialogContent({
  mode,
  selectedEvent,
  eventDialogData,
  onDataChange,
  patients,
  professionals,
  locations,
  specialties,
  timezone,
  statusColors,
  statusLabels,
}: EventDialogContentProps) {
  const showLocations = true;
  const showSpecialties = true;

  // Filter specialties based on selected professional
  const selectedProfessional = professionals.find(p => p.id === eventDialogData?.professionalId);
  // Get specialty IDs from professional (support both single and multiple specialties)
  const professionalSpecialtyIds = selectedProfessional?.specialtyIds ||
    (selectedProfessional?.specialtyId ? [selectedProfessional.specialtyId] : []);
  const availableSpecialties = professionalSpecialtyIds.length > 0
    ? specialties.filter(s => professionalSpecialtyIds.includes(s.id))
    : specialties;
  if (mode === "view" && selectedEvent) {
    return (
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="h6">{selectedEvent.title || "Turno"}</Typography>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Estado
            </Typography>
            <Chip
              label={
                statusLabels[selectedEvent.extendedProps?.status || ""] ||
                selectedEvent.extendedProps?.status ||
                "Desconocido"
              }
              size="small"
              sx={{
                bgcolor:
                  statusColors[selectedEvent.extendedProps?.status || ""] ||
                  "#ccc",
                color: "white",
                ml: 1,
              }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Paciente
            </Typography>
            <Typography>
              {selectedEvent.extendedProps?.patientName || "N/A"}
            </Typography>
            {selectedEvent.extendedProps?.patientEmail && (
              <Typography variant="body2" color="text.secondary">
                {selectedEvent.extendedProps.patientEmail}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Profesional
            </Typography>
            <Typography>
              {selectedEvent.extendedProps?.professionalName || "N/A"}
            </Typography>
            {selectedEvent.extendedProps?.professionalEmail && (
              <Typography variant="body2" color="text.secondary">
                {selectedEvent.extendedProps.professionalEmail}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Especialidad
            </Typography>
            <Typography>
              {selectedEvent.extendedProps?.specialtyName || "N/A"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Ubicación
            </Typography>
            <Typography>
              {selectedEvent.extendedProps?.locationName || "N/A"}
            </Typography>
            {selectedEvent.extendedProps?.locationAddress && (
              <Typography variant="body2" color="text.secondary">
                {selectedEvent.extendedProps.locationAddress}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Inicio
            </Typography>
            <Typography>
              {eventDialogData?.start
                ? (() => {
                  // eventDialogData.start has BA time components stored as UTC components
                  // We need to convert it to actual UTC first, then format in BA timezone
                  const utcDate = localDateToFullCalendar(eventDialogData.start);
                  return formatInBuenosAires(utcDate, "PPpp", { locale: es });
                })()
                : (() => {
                  try {
                    const startDate =
                      typeof selectedEvent.start === "string"
                        ? parseISO(selectedEvent.start)
                        : selectedEvent.start instanceof Date
                          ? selectedEvent.start
                          : new Date(selectedEvent.start);
                    // Convert to BA timezone for display
                    return formatInBuenosAires(startDate, "PPpp", { locale: es });
                  } catch (e) {
                    console.error("Error formatting start date:", e, selectedEvent.start);
                    return String(selectedEvent.start);
                  }
                })()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Fin
            </Typography>
            <Typography>
              {eventDialogData?.end
                ? (() => {
                  // eventDialogData.end has BA time components stored as UTC components
                  // We need to convert it to actual UTC first, then format in BA timezone
                  const utcDate = localDateToFullCalendar(eventDialogData.end);
                  return formatInBuenosAires(utcDate, "PPpp", { locale: es });
                })()
                : (() => {
                  try {
                    const endDate =
                      typeof selectedEvent.end === "string"
                        ? parseISO(selectedEvent.end)
                        : selectedEvent.end instanceof Date
                          ? selectedEvent.end
                          : new Date(selectedEvent.end);
                    // Convert to BA timezone for display
                    return formatInBuenosAires(endDate, "PPpp", { locale: es });
                  } catch (e) {
                    console.error("Error formatting end date:", e, selectedEvent.end);
                    return String(selectedEvent.end);
                  }
                })()}
            </Typography>
          </Box>
          {selectedEvent.extendedProps?.notes && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Notas
              </Typography>
              <Typography>{selectedEvent.extendedProps.notes}</Typography>
            </Box>
          )}
          {selectedEvent.extendedProps?.status === "CANCELLED" &&
            selectedEvent.extendedProps?.cancellationReason && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Motivo de cancelación
                </Typography>
                <Typography>
                  {selectedEvent.extendedProps.cancellationReason}
                </Typography>
                {selectedEvent.extendedProps.cancelledBy && (
                  <Typography variant="body2" color="text.secondary">
                    Cancelado por:{" "}
                    {selectedEvent.extendedProps.cancelledBy === "PATIENT"
                      ? "Paciente"
                      : selectedEvent.extendedProps.cancelledBy === "PROFESSIONAL"
                        ? "Profesional"
                        : "Administrador"}
                  </Typography>
                )}
              </Box>
            )}
        </Stack>
      </DialogContent>
    );
  }

  return (
    <DialogContent>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Paciente"
          select
          fullWidth
          value={eventDialogData?.patientId || ""}
          onChange={(e) =>
            onDataChange({ ...eventDialogData!, patientId: e.target.value })
          }
          autoComplete="off"
        >
          {patients.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} ({p.email})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Profesional"
          select
          fullWidth
          value={eventDialogData?.professionalId || ""}
          onChange={(e) => {
            const newProfessionalId = e.target.value;
            const newProfessional = professionals.find(p => p.id === newProfessionalId);
            // If professional has specialties, auto-select the first one; otherwise clear specialty
            const professionalSpecialtyIds = newProfessional?.specialtyIds ||
              (newProfessional?.specialtyId ? [newProfessional.specialtyId] : []);
            const newSpecialtyId = professionalSpecialtyIds.length > 0 ? professionalSpecialtyIds[0] : "";
            onDataChange({
              ...eventDialogData!,
              professionalId: newProfessionalId,
              specialtyId: newSpecialtyId,
            });
          }}
          autoComplete="off"
        >
          {professionals.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} ({p.email})
            </MenuItem>
          ))}
        </TextField>
        {showSpecialties && (
          <TextField
            label="Especialidad"
            select
            fullWidth
            value={eventDialogData?.specialtyId || ""}
            onChange={(e) =>
              onDataChange({ ...eventDialogData!, specialtyId: e.target.value })
            }
            disabled={!selectedProfessional || availableSpecialties.length === 0}
            autoComplete="off"
          >
            {availableSpecialties.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {showLocations && (
          <TextField
            label="Ubicación"
            select
            fullWidth
            value={eventDialogData?.locationId || ""}
            onChange={(e) =>
              onDataChange({ ...eventDialogData!, locationId: e.target.value })
            }
            autoComplete="off"
          >
            {locations.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.name} - {l.address}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          label="Inicio"
          type="datetime-local"
          fullWidth
          value={
            eventDialogData?.start
              ? formatForDateTimeLocal(eventDialogData.start)
              : ""
          }
          onChange={(e) => {
            const localDate = parseFromDateTimeLocal(e.target.value);
            onDataChange({
              ...eventDialogData!,
              start: localDate,
            });
          }}
          InputLabelProps={{ shrink: true }}
          autoComplete="off"
        />
        <TextField
          label="Fin"
          type="datetime-local"
          fullWidth
          value={
            eventDialogData?.end
              ? formatForDateTimeLocal(eventDialogData.end)
              : ""
          }
          onChange={(e) => {
            const localDate = parseFromDateTimeLocal(e.target.value);
            onDataChange({
              ...eventDialogData!,
              end: localDate,
            });
          }}
          InputLabelProps={{ shrink: true }}
          autoComplete="off"
        />
        <TextField
          label="Notas"
          multiline
          rows={3}
          fullWidth
          value={eventDialogData?.notes || ""}
          onChange={(e) =>
            onDataChange({ ...eventDialogData!, notes: e.target.value })
          }
        />
      </Stack>
    </DialogContent>
  );
}

