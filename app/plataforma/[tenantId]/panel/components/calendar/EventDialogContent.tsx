import {
  Select,
  SelectItem,
  Textarea,
  Chip,
  DatePicker,
} from "@heroui/react";
import { CalendarDateTime } from "@internationalized/date";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInBuenosAires, localDateToFullCalendar } from "@/lib/timezone";
import { useMemo } from "react";
import {
  getProfessionalAvailableDayNumbers,
  createIsDateUnavailableForProfessional,
} from "@/lib/professional-availability";

function dateToCalendarDateTime(d: Date): CalendarDateTime {
  return new CalendarDateTime(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    0
  );
}

function calendarDateTimeToDate(c: CalendarDateTime): Date {
  return new Date(Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, 0));
}

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
    isHoliday?: boolean;
    professionalHoliday?: boolean; // Key to identify professional holiday events
    holidayDescription?: string;
    holidayId?: string;
    holidayStartDate?: string;
    holidayEndDate?: string;
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
  const selectedProfessional = professionals.find(p => String(p.id) === String(eventDialogData?.professionalId));
  // Get specialty IDs from professional (support both single and multiple specialties)
  const professionalSpecialtyIds = selectedProfessional?.specialtyIds ||
    (selectedProfessional?.specialtyId ? [selectedProfessional.specialtyId] : []);
  const availableSpecialties = professionalSpecialtyIds.length > 0
    ? specialties.filter(s => professionalSpecialtyIds.some((id: string | number) => String(id) === String(s.id)))
    : specialties;

  // Memoize selectedKeys to prevent unnecessary re-renders
  const patientSelectedKeys = useMemo(() => {
    return eventDialogData?.patientId ? [String(eventDialogData.patientId)] : [];
  }, [eventDialogData?.patientId]);

  const professionalSelectedKeys = useMemo(() => {
    return eventDialogData?.professionalId ? [String(eventDialogData.professionalId)] : [];
  }, [eventDialogData?.professionalId]);

  const specialtySelectedKeys = useMemo(() => {
    return eventDialogData?.specialtyId ? [String(eventDialogData.specialtyId)] : [];
  }, [eventDialogData?.specialtyId]);

  const locationSelectedKeys = useMemo(() => {
    return eventDialogData?.locationId ? [String(eventDialogData.locationId)] : [];
  }, [eventDialogData?.locationId]);

  const selectedProfessionalForAvailability = useMemo(
    () =>
      eventDialogData?.professionalId
        ? professionals.find((p) => String(p.id) === String(eventDialogData.professionalId))
        : null,
    [eventDialogData?.professionalId, professionals]
  );
  const availableDayNumbers = useMemo(
    () => getProfessionalAvailableDayNumbers(selectedProfessionalForAvailability ?? undefined),
    [selectedProfessionalForAvailability]
  );
  const isDateUnavailable = useMemo(
    () => createIsDateUnavailableForProfessional(availableDayNumbers),
    [availableDayNumbers]
  );

  if (mode === "view" && selectedEvent) {
    // Show holiday event information
    if (selectedEvent.extendedProps?.professionalHoliday || selectedEvent.extendedProps?.isHoliday) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🏖️ Período Vacacional</h3>
          <div>
            <p className="text-xs text-gray-500 mb-1">Profesional</p>
            <p className="text-sm font-medium">{selectedEvent.extendedProps?.professionalName || "N/A"}</p>
            {selectedEvent.extendedProps?.professionalEmail && (
              <p className="text-xs text-gray-500">{selectedEvent.extendedProps.professionalEmail}</p>
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
          {selectedEvent.extendedProps?.holidayDescription && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Descripción</p>
              <p className="text-sm">{selectedEvent.extendedProps.holidayDescription}</p>
            </div>
          )}
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-xs text-orange-800">
              <strong>Nota:</strong> No se pueden crear turnos durante este período vacacional.
            </p>
          </div>
        </div>
      );
    }

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
        key={`patient-${eventDialogData?.patientId || 'none'}`}
        label="Paciente"
        selectedKeys={patientSelectedKeys}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          if (selected) {
            onDataChange({ ...eventDialogData!, patientId: selected });
          } else {
            onDataChange({ ...eventDialogData!, patientId: undefined });
          }
        }}
        autoComplete="off"
      >
        {patients.map((p) => (
          <SelectItem key={String(p.id)}>
            {p.name}
          </SelectItem>
        ))}
      </Select>
      <Select
        key={`professional-${eventDialogData?.professionalId || 'none'}`}
        label="Profesional"
        selectedKeys={professionalSelectedKeys}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          if (selected) {
            const newProfessional = professionals.find(p => String(p.id) === String(selected));
            const professionalSpecialtyIds = newProfessional?.specialtyIds ||
              (newProfessional?.specialtyId ? [newProfessional.specialtyId] : []);
            const newSpecialtyId = professionalSpecialtyIds.length > 0 ? String(professionalSpecialtyIds[0]) : "";
            onDataChange({
              ...eventDialogData!,
              professionalId: selected,
              specialtyId: newSpecialtyId,
            });
          } else {
            onDataChange({
              ...eventDialogData!,
              professionalId: undefined,
              specialtyId: undefined,
            });
          }
        }}
        autoComplete="off"
      >
        {professionals.map((p) => (
          <SelectItem key={String(p.id)}>
            {p.name}
          </SelectItem>
        ))}
      </Select>
      {showSpecialties && (
        <Select
          key={`specialty-${eventDialogData?.specialtyId || 'none'}`}
          label="Especialidad"
          selectedKeys={specialtySelectedKeys}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            if (selected) {
              onDataChange({ ...eventDialogData!, specialtyId: selected });
            } else {
              onDataChange({ ...eventDialogData!, specialtyId: undefined });
            }
          }}
          isDisabled={!selectedProfessional || availableSpecialties.length === 0}
          autoComplete="off"
        >
          {availableSpecialties.map((s) => (
            <SelectItem key={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
        </Select>
      )}
      {showLocations && (
        <Select
          key={`location-${eventDialogData?.locationId || 'none'}`}
          label="Ubicación"
          selectedKeys={locationSelectedKeys}
          renderValue={() => {
            const selectedLocation = locations.find(
              (l) => String(l.id) === String(eventDialogData?.locationId)
            );
            return selectedLocation
              ? `${selectedLocation.name} - ${selectedLocation.address}`
              : "";
          }}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            if (selected) {
              onDataChange({ ...eventDialogData!, locationId: selected });
            } else {
              onDataChange({ ...eventDialogData!, locationId: undefined });
            }
          }}
          autoComplete="off"
        >
          {locations.map((l) => (
            <SelectItem key={String(l.id)}>
              {l.name} - {l.address}
            </SelectItem>
          ))}
        </Select>
      )}
      <DatePicker
        label="Inicio"
        granularity="minute"
        value={eventDialogData?.start ? dateToCalendarDateTime(eventDialogData.start) : undefined}
        onChange={(value) => {
          if (value && eventDialogData) {
            onDataChange({
              ...eventDialogData,
              start: calendarDateTimeToDate(value as CalendarDateTime),
            });
          }
        }}
        isDateUnavailable={isDateUnavailable}
        hideTimeZone
      />
      <DatePicker
        label="Fin"
        granularity="minute"
        value={eventDialogData?.end ? dateToCalendarDateTime(eventDialogData.end) : undefined}
        onChange={(value) => {
          if (value && eventDialogData) {
            onDataChange({
              ...eventDialogData,
              end: calendarDateTimeToDate(value as CalendarDateTime),
            });
          }
        }}
        isDateUnavailable={isDateUnavailable}
        hideTimeZone
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

