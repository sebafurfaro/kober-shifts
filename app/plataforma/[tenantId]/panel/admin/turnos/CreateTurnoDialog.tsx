"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Textarea,
  Spinner,
  DatePicker,
} from "@heroui/react";
import { CalendarDateTime } from "@internationalized/date";
import { serializeBATimeAsUTC, parseFromDateTimeLocal } from "@/lib/timezone";
import { useCreateAppointment } from "@/lib/use-create-appointment";
import {
  getProfessionalAvailableDayNumbers,
  createIsDateUnavailableForProfessional,
  type ProfessionalAvailabilitySource,
} from "@/lib/professional-availability";

function datetimeLocalToCalendarDateTime(s: string): CalendarDateTime | null {
  if (!s || !s.trim()) return null;
  const [datePart, timePart] = s.split("T");
  if (!datePart || !timePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [hr, min] = timePart.split(":").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return new CalendarDateTime(y, m, d, Number.isNaN(hr) ? 0 : hr, Number.isNaN(min) ? 0 : min, 0);
}

function calendarDateTimeToDatetimeLocal(c: CalendarDateTime): string {
  const y = c.year;
  const m = String(c.month).padStart(2, "0");
  const d = String(c.day).padStart(2, "0");
  const hr = String(c.hour).padStart(2, "0");
  const min = String(c.minute).padStart(2, "0");
  return `${y}-${m}-${d}T${hr}:${min}`;
}

type Patient = { id: string; name: string };
type Professional = {
  id: string;
  name: string;
  specialtyId?: string | null;
  specialtyIds?: (string | number)[];
  availableDays?: number[] | null;
  availabilityConfig?: ProfessionalAvailabilitySource["availabilityConfig"];
};
type Location = { id: string; name: string; address: string };
type Specialty = { id: string; name: string };
type Service = { id: string; name: string };

interface CreateTurnoDialogProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTurnoDialog({
  tenantId,
  isOpen,
  onClose,
  onSuccess,
}: CreateTurnoDialogProps) {
  const { createAppointment } = useCreateAppointment(tenantId);
  const [loadingData, setLoadingData] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);

  const [patientId, setPatientId] = React.useState<string>("");
  const [professionalId, setProfessionalId] = React.useState<string>("");
  const [specialtyId, setSpecialtyId] = React.useState<string>("");
  const [locationId, setLocationId] = React.useState<string>("");
  const [serviceId, setServiceId] = React.useState<string>("");
  const [startLocal, setStartLocal] = React.useState("");
  const [endLocal, setEndLocal] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const selectedProfessional = professionals.find((p) => String(p.id) === String(professionalId));
  const professionalSpecialtyIds =
    selectedProfessional?.specialtyIds ||
    (selectedProfessional?.specialtyId ? [selectedProfessional.specialtyId] : []);
  const availableSpecialties =
    professionalSpecialtyIds.length > 0
      ? specialties.filter((s) =>
          professionalSpecialtyIds.some((id: string | number) => String(id) === String(s.id))
        )
      : specialties;

  const availableDayNumbers = React.useMemo(
    () => getProfessionalAvailableDayNumbers(selectedProfessional ?? undefined),
    [selectedProfessional]
  );
  const isDateUnavailable = React.useMemo(
    () => createIsDateUnavailableForProfessional(availableDayNumbers),
    [availableDayNumbers]
  );

  const startValue = React.useMemo(
    () => datetimeLocalToCalendarDateTime(startLocal),
    [startLocal]
  );
  const endValue = React.useMemo(
    () => datetimeLocalToCalendarDateTime(endLocal),
    [endLocal]
  );

  React.useEffect(() => {
    if (!isOpen || !tenantId) return;
    setError(null);
    setLoadingData(true);
    Promise.all([
      fetch(`/api/plataforma/${tenantId}/admin/patients`, { credentials: "include" }),
      fetch(`/api/plataforma/${tenantId}/admin/professionals`, { credentials: "include" }),
      fetch(`/api/plataforma/${tenantId}/admin/locations`, { credentials: "include" }),
      fetch(`/api/plataforma/${tenantId}/admin/specialties`, { credentials: "include" }),
      fetch(`/api/plataforma/${tenantId}/admin/services`, { credentials: "include" }),
    ])
      .then(async ([pRes, profRes, locRes, specRes, servRes]) => {
        const [pData, profData, locData, specData, servData] = await Promise.all([
          pRes.ok ? pRes.json() : [],
          profRes.ok ? profRes.json() : [],
          locRes.ok ? locRes.json() : [],
          specRes.ok ? specRes.json() : [],
          servRes.ok ? servRes.json() : [],
        ]);
        setPatients(Array.isArray(pData) ? pData : []);
        const normalizedProfessionals = Array.isArray(profData)
          ? profData.map((p: any) => ({
              id: p.id,
              name: p.name,
              specialtyId: p.professional?.specialtyId ?? p.specialtyId ?? null,
              specialtyIds: p.professional?.specialtyIds ?? (p.professional?.specialtyId ? [p.professional.specialtyId] : p.specialtyId ? [p.specialtyId] : []),
              availableDays: p.professional?.availableDays ?? p.availableDays ?? null,
              availabilityConfig: p.professional?.availabilityConfig ?? p.availabilityConfig ?? null,
            }))
          : [];
        setProfessionals(normalizedProfessionals);
        setLocations(Array.isArray(locData) ? locData : []);
        setSpecialties(Array.isArray(specData) ? specData : []);
        setServices(Array.isArray(servData) ? servData : []);
      })
      .catch((e) => {
        console.error(e);
        setError("Error al cargar datos");
      })
      .finally(() => setLoadingData(false));
  }, [isOpen, tenantId]);

  const handleProfessionalChange = (keys: "all" | Set<string | number>) => {
    const selected = typeof keys === "string" ? "" : Array.from(keys)[0] as string;
    setProfessionalId(selected || "");
    if (selected) {
      const prof = professionals.find((p) => String(p.id) === selected);
      const ids = prof?.specialtyIds || (prof?.specialtyId ? [prof.specialtyId] : []);
      setSpecialtyId(ids.length ? String(ids[0]) : "");
    } else {
      setSpecialtyId("");
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!patientId || !professionalId || !locationId || !startLocal || !endLocal) {
      setError("Completá paciente, profesional, ubicación, inicio y fin.");
      return;
    }
    const startDate = parseFromDateTimeLocal(startLocal);
    const endDate = parseFromDateTimeLocal(endLocal);
    if (endDate.getTime() <= startDate.getTime()) {
      setError("La fecha de fin debe ser posterior al inicio.");
      return;
    }
    setSubmitting(true);
    try {
      await createAppointment(
        {
          patientId,
          professionalId,
          locationId,
          specialtyId: specialtyId || null,
          serviceId: serviceId || null,
          startAt: serializeBATimeAsUTC(startDate),
          endAt: serializeBATimeAsUTC(endDate),
          notes: notes.trim() || null,
        },
        {
          onSuccess: () => {
            onSuccess();
            onClose();
            setPatientId("");
            setProfessionalId("");
            setSpecialtyId("");
            setLocationId("");
            setServiceId("");
            setStartLocal("");
            setEndLocal("");
            setNotes("");
          },
        }
      );
    } catch (e: any) {
      setError(e?.message || "Error al crear el turno");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>Agregar turno</ModalHeader>
        <ModalBody>
          {loadingData ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              )}
              <Select
                label="Paciente"
                selectedKeys={patientId ? [patientId] : []}
                onSelectionChange={(keys) => setPatientId((Array.from(keys)[0] as string) || "")}
                autoComplete="off"
              >
                {patients.map((p) => (
                  <SelectItem key={String(p.id)}>{p.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Profesional"
                selectedKeys={professionalId ? [professionalId] : []}
                onSelectionChange={handleProfessionalChange}
                autoComplete="off"
              >
                {professionals.map((p) => (
                  <SelectItem key={String(p.id)}>{p.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Especialidad"
                selectedKeys={specialtyId ? [specialtyId] : []}
                onSelectionChange={(keys) => setSpecialtyId((Array.from(keys)[0] as string) || "")}
                isDisabled={!selectedProfessional || availableSpecialties.length === 0}
                autoComplete="off"
              >
                {availableSpecialties.map((s) => (
                  <SelectItem key={String(s.id)}>{s.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Ubicación"
                selectedKeys={locationId ? [locationId] : []}
                onSelectionChange={(keys) => setLocationId((Array.from(keys)[0] as string) || "")}
                renderValue={(items) => {
                  const id = items?.[0]?.key;
                  const loc = locations.find((l) => String(l.id) === id);
                  return loc ? `${loc.name} - ${loc.address}` : "";
                }}
                autoComplete="off"
              >
                {locations.map((l) => (
                  <SelectItem key={String(l.id)}>
                    {l.name} - {l.address}
                  </SelectItem>
                ))}
              </Select>
              {services.length > 0 && (
                <Select
                  label="Servicio (opcional)"
                  selectedKeys={serviceId ? [serviceId] : []}
                  onSelectionChange={(keys) => setServiceId((Array.from(keys)[0] as string) || "")}
                  autoComplete="off"
                  description="Opcional"
                >
                  {services.map((s) => (
                    <SelectItem key={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </Select>
              )}
              <DatePicker
                label="Inicio"
                granularity="minute"
                value={startValue ?? undefined}
                onChange={(value) => setStartLocal(value ? calendarDateTimeToDatetimeLocal(value as CalendarDateTime) : "")}
                isDateUnavailable={isDateUnavailable}
                hideTimeZone
              />
              <DatePicker
                label="Fin"
                granularity="minute"
                value={endValue ?? undefined}
                onChange={(value) => setEndLocal(value ? calendarDateTimeToDatetimeLocal(value as CalendarDateTime) : "")}
                isDateUnavailable={isDateUnavailable}
                hideTimeZone
              />
              <Textarea
                label="Notas"
                minRows={2}
                value={notes}
                onValueChange={setNotes}
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={submitting}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={submitting} isDisabled={loadingData}>
            Crear turno
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
