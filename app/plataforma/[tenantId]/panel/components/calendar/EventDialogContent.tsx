import {
  Input,
  Select,
  SelectItem,
  Textarea,
  Chip,
} from "@heroui/react";
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{selectedEvent.title || "Turno"}</h3>
        <div>
          <p className="text-xs text-gray-500 mb-1">Estado</p>
          <Chip
            size="sm"
            style={{
              backgroundColor:
                statusColors[selectedEvent.extendedProps?.status || ""] ||
                "#ccc",
              color: "white",
            }}
          >
            {statusLabels[selectedEvent.extendedProps?.status || ""] ||
              selectedEvent.extendedProps?.status ||
              "Desconocido"}
          </Chip>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Paciente</p>
          <p className="text-sm font-medium">{selectedEvent.extendedProps?.patientName || "N/A"}</p>
          {selectedEvent.extendedProps?.patientEmail && (
            <p className="text-xs text-gray-500">{selectedEvent.extendedProps.patientEmail}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Profesional</p>
          <p className="text-sm font-medium">{selectedEvent.extendedProps?.professionalName || "N/A"}</p>
          {selectedEvent.extendedProps?.professionalEmail && (
            <p className="text-xs text-gray-500">{selectedEvent.extendedProps.professionalEmail}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Especialidad</p>
          <p className="text-sm font-medium">{selectedEvent.extendedProps?.specialtyName || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Ubicación</p>
          <p className="text-sm font-medium">{selectedEvent.extendedProps?.locationName || "N/A"}</p>
          {selectedEvent.extendedProps?.locationAddress && (
            <p className="text-xs text-gray-500">{selectedEvent.extendedProps.locationAddress}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Inicio</p>
          <p className="text-sm font-medium">
            {eventDialogData?.start
              ? (() => {
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
                  return formatInBuenosAires(startDate, "PPpp", { locale: es });
                } catch (e) {
                  console.error("Error formatting start date:", e, selectedEvent.start);
                  return String(selectedEvent.start);
                }
              })()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Fin</p>
          <p className="text-sm font-medium">
            {eventDialogData?.end
              ? (() => {
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
                  return formatInBuenosAires(endDate, "PPpp", { locale: es });
                } catch (e) {
                  console.error("Error formatting end date:", e, selectedEvent.end);
                  return String(selectedEvent.end);
                }
              })()}
          </p>
        </div>
        {selectedEvent.extendedProps?.notes && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Notas</p>
            <p className="text-sm">{selectedEvent.extendedProps.notes}</p>
          </div>
        )}
        {selectedEvent.extendedProps?.status === "CANCELLED" &&
          selectedEvent.extendedProps?.cancellationReason && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Motivo de cancelación</p>
              <p className="text-sm">{selectedEvent.extendedProps.cancellationReason}</p>
              {selectedEvent.extendedProps.cancelledBy && (
                <p className="text-xs text-gray-500 mt-1">
                  Cancelado por:{" "}
                  {selectedEvent.extendedProps.cancelledBy === "PATIENT"
                    ? "Paciente"
                    : selectedEvent.extendedProps.cancelledBy === "PROFESSIONAL"
                      ? "Profesional"
                      : "Administrador"}
                </p>
              )}
            </div>
          )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Select
        label="Paciente"
        selectedKeys={eventDialogData?.patientId ? [eventDialogData.patientId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          onDataChange({ ...eventDialogData!, patientId: selected });
        }}
        autoComplete="off"
      >
        {patients.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name} ({p.email})
          </SelectItem>
        ))}
      </Select>
      <Select
        label="Profesional"
        selectedKeys={eventDialogData?.professionalId ? [eventDialogData.professionalId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          const newProfessional = professionals.find(p => p.id === selected);
          const professionalSpecialtyIds = newProfessional?.specialtyIds ||
            (newProfessional?.specialtyId ? [newProfessional.specialtyId] : []);
          const newSpecialtyId = professionalSpecialtyIds.length > 0 ? professionalSpecialtyIds[0] : "";
          onDataChange({
            ...eventDialogData!,
            professionalId: selected,
            specialtyId: newSpecialtyId,
          });
        }}
        autoComplete="off"
      >
        {professionals.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name} ({p.email})
          </SelectItem>
        ))}
      </Select>
      {showSpecialties && (
        <Select
          label="Especialidad"
          selectedKeys={eventDialogData?.specialtyId ? [eventDialogData.specialtyId] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            onDataChange({ ...eventDialogData!, specialtyId: selected });
          }}
          isDisabled={!selectedProfessional || availableSpecialties.length === 0}
          autoComplete="off"
        >
          {availableSpecialties.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </Select>
      )}
      {showLocations && (
        <Select
          label="Ubicación"
          selectedKeys={eventDialogData?.locationId ? [eventDialogData.locationId] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            onDataChange({ ...eventDialogData!, locationId: selected });
          }}
          autoComplete="off"
        >
          {locations.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name} - {l.address}
            </SelectItem>
          ))}
        </Select>
      )}
      <Input
        label="Inicio"
        type="datetime-local"
        value={
          eventDialogData?.start
            ? formatForDateTimeLocal(eventDialogData.start)
            : ""
        }
        onValueChange={(value) => {
          const localDate = parseFromDateTimeLocal(value);
          onDataChange({
            ...eventDialogData!,
            start: localDate,
          });
        }}
        autoComplete="off"
      />
      <Input
        label="Fin"
        type="datetime-local"
        value={
          eventDialogData?.end
            ? formatForDateTimeLocal(eventDialogData.end)
            : ""
        }
        onValueChange={(value) => {
          const localDate = parseFromDateTimeLocal(value);
          onDataChange({
            ...eventDialogData!,
            end: localDate,
          });
        }}
        autoComplete="off"
      />
      <Textarea
        label="Notas"
        minRows={3}
        value={eventDialogData?.notes || ""}
        onValueChange={(value) =>
          onDataChange({ ...eventDialogData!, notes: value })
        }
      />
    </div>
  );
}

