"use client";

import { PanelHeader } from "../panel/components/PanelHeader";
import {
  Select,
  SelectItem,
  Spinner,
  Alert,
  Button,
  Card,
  CardBody,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Divider,
} from "@heroui/react";
import { AlertDialog } from "../panel/components/alerts/AlertDialog";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Role } from "@/lib/types";

type StepId = 1 | 2 | 3;

interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
}

interface Professional {
  id: string;
  name: string;
  email: string;
  color?: string | null;
}

interface AvailableSlot {
  date: string;
  time: string;
  datetime: string;
}

interface Location {
  id: string;
  name: string;
}

export type NewAppointmentBookingProps = {
  tenantId: string;
  variant: "public" | "panel";
};

interface MeUser {
  id: string;
  role: string;
}

export function NewAppointmentBooking({ tenantId, variant }: NewAppointmentBookingProps) {
  const router = useRouter();

  /**
   * Panel: comprobamos /features (paciente puede tener sesión con flag distinto).
   * Público (/reservar): el servidor ya validó getPatientSelfBookingEnabled; no redirigir acá
   * a login (evita loop login ↔ reservar si la API devuelve otro resultado que la página RSC).
   */
  const [bookingAllowed, setBookingAllowed] = useState<boolean | null>(() =>
    variant === "public" ? true : null
  );
  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const [showServiciosFlag, setShowServiciosFlag] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  /** Catálogo de servicios resuelto (o no aplica) para no mostrar pasos intermedios incorrectos. */
  const [servicesCatalogReady, setServicesCatalogReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/plataforma/${tenantId}/features`, { credentials: "include" });
      if (cancelled) return;
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      if (cancelled) return;
      setShowServiciosFlag(data.show_servicios === true);
      if (variant === "panel") {
        const enabled = data.patientSelfBookingEnabled === true;
        if (!enabled) {
          router.replace(`/plataforma/${tenantId}/panel/patient`);
          return;
        }
        setBookingAllowed(true);
      }
      setFeaturesLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, router, variant]);

  // Step flow
  const [currentStep, setCurrentStep] = useState<StepId>(1);

  // Step 1: Professional
  const [professional, setProfessional] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  // Step 2: Slots
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const slotsPerPage = 10;

  // Confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const [error, setError] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchMe = useCallback(async (): Promise<MeUser | null> => {
    const res = await fetch(`/api/plataforma/${tenantId}/auth/me`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data as MeUser;
  }, [tenantId]);

  // Load professionals when booking is allowed
  useEffect(() => {
    if (bookingAllowed !== true) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingProfessionals(true);
        const res = await fetch(`/api/plataforma/${tenantId}/professionals`, { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar profesionales");
        const data = await res.json();
        if (!cancelled) setProfessionals(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar profesionales");
      } finally {
        if (!cancelled) setLoadingProfessionals(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, bookingAllowed]);

  useEffect(() => {
    if (bookingAllowed !== true || !featuresLoaded) return;
    if (!showServiciosFlag) {
      setServices([]);
      setLoadingServices(false);
      setServicesCatalogReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingServices(true);
        setServicesCatalogReady(false);
        const res = await fetch(`/api/plataforma/${tenantId}/admin/services`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setServices([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setServices(
            list.map((s: { id: string; name: string; durationMinutes?: number }) => ({
              id: s.id,
              name: s.name,
              durationMinutes: typeof s.durationMinutes === "number" ? s.durationMinutes : 30,
            }))
          );
        }
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) {
          setLoadingServices(false);
          setServicesCatalogReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, bookingAllowed, featuresLoaded, showServiciosFlag]);

  const includeServicesStep = Boolean(
    featuresLoaded && showServiciosFlag && services.length > 0
  );
  const slotsStepId: StepId = includeServicesStep ? 3 : 2;

  const catalogReady = featuresLoaded && servicesCatalogReady;

  const stepperSteps = useMemo(() => {
    if (includeServicesStep) {
      return [
        { id: 1 as const, title: "Profesional" },
        { id: 2 as const, title: "Servicio" },
        { id: 3 as const, title: "Fecha y hora" },
      ];
    }
    return [
      { id: 1 as const, title: "Profesional" },
      { id: 2 as const, title: "Fecha y hora" },
    ];
  }, [includeServicesStep]);

  useEffect(() => {
    if (!includeServicesStep && currentStep === 3) {
      setCurrentStep(2);
    }
  }, [includeServicesStep, currentStep]);

  // Load slots when fecha step is active and professional is selected (and service if aplica)
  const loadAvailableSlots = useCallback(
    async (professionalId: string, serviceId?: string) => {
    try {
      setLoadingSlots(true);
      setError(null);
      const now = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
      const startDateStr = now.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      const qs = new URLSearchParams({
        professionalId,
        startDate: startDateStr,
        endDate: endDateStr,
      });
      if (serviceId) qs.set("serviceId", serviceId);
      const res = await fetch(
        `/api/plataforma/${tenantId}/appointments/available-slots?${qs.toString()}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al cargar turnos (${res.status})`);
      }
      const data = await res.json();
      setAvailableSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar turnos");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (bookingAllowed !== true) return;
    const needService = includeServicesStep && !selectedServiceId;
    if (currentStep === slotsStepId && professional && !needService) {
      void loadAvailableSlots(professional, selectedServiceId || undefined);
    } else if (currentStep !== slotsStepId) setAvailableSlots([]);
  }, [
    bookingAllowed,
    currentStep,
    professional,
    selectedServiceId,
    includeServicesStep,
    slotsStepId,
    loadAvailableSlots,
  ]);

  // Load locations for confirm dialog
  useEffect(() => {
    if (bookingAllowed !== true) return;
    if (!tenantId) return;
    (async () => {
      try {
        setLoadingLocations(true);
        const locationsRes = await fetch(`/api/plataforma/${tenantId}/locations`, { credentials: "include" });
        if (locationsRes.ok) {
          const data = await locationsRes.json();
          setLocations(Array.isArray(data) ? data.map((l: { id: string; name: string }) => ({ id: l.id, name: l.name })) : []);
        }
      } catch {
        // ignore
      } finally {
        setLoadingLocations(false);
      }
    })();
  }, [tenantId, bookingAllowed]);

  const handleProfessionalChange = (professionalId: string) => {
    setProfessional(professionalId);
    setSelectedServiceId("");
    setCurrentPage(1);
    if (!professionalId) setAvailableSlots([]);
  };

  const handleSlotClick = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    if (locations.length === 1) setSelectedLocation(locations[0].id);
    else setSelectedLocation("");
    setConfirmDialogOpen(true);
  };

  const handleConfirmAppointment = async () => {
    if (!selectedSlot || !professional || !selectedLocation) {
      setError("Por favor completa todos los campos");
      return;
    }
    if (includeServicesStep && !selectedServiceId) {
      setError("Seleccioná un servicio para continuar.");
      return;
    }
    const selectedProfessionalObj = professionals.find((p) => p.id === professional);
    if (!selectedProfessionalObj) return;

    if (variant === "public") {
      const current = await fetchMe();
      if (!current) {
        setAuthModalOpen(true);
        return;
      }
      if (current.role !== Role.PATIENT) {
        setError(
          "Para confirmar un turno necesitás una cuenta de paciente. Si sos staff, ingresá desde el panel."
        );
        return;
      }
    } else {
      const current = await fetchMe();
      if (!current) {
        setError("Sesión no válida. Iniciá sesión de nuevo.");
        return;
      }
    }

    try {
      setConfirming(true);
      setError(null);
      // Slot datetime is in local time (e.g. "2025-02-02T13:00:00" = 1pm local). Interpret as local
      // so that toISOString() produces the correct UTC instant (e.g. 13:00 Argentina → 16:00 UTC).
      const [datePart, timePart] = selectedSlot.datetime.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = (timePart || "00:00").split(":").map(Number);
      const startAt = new Date(year, month - 1, day, hours, minutes, 0);
      const selectedServiceObj = selectedServiceId
        ? services.find((s) => s.id === selectedServiceId)
        : undefined;
      const durationMinutes = selectedServiceObj
        ? Math.max(5, selectedServiceObj.durationMinutes || 30)
        : 30;
      const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

      const response = await fetch(`/api/plataforma/${tenantId}/appointments/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          professionalId: selectedProfessionalObj.id,
          locationId: selectedLocation,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          ...(selectedServiceId ? { serviceId: selectedServiceId } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Error al crear el turno (${response.status})`);
      }

      await response.json();

      setConfirmDialogOpen(false);
      setSelectedSlot(null);
      setSelectedLocation("");
      if (professional) await loadAvailableSlots(professional, selectedServiceId || undefined);
      setError(null);

      setSuccessDialog({ open: true, message: "Turno creado exitosamente" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el turno");
    } finally {
      setConfirming(false);
    }
  };

  const handleAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setAuthError(json.error ?? "Error al iniciar sesión");
        return;
      }
      setAuthModalOpen(false);
      setLoginPassword("");
      await handleConfirmAppointment();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: regEmail.trim().toLowerCase(),
          firstName: regFirstName.trim(),
          lastName: regLastName.trim(),
          password: regPassword,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setAuthError(json.error ?? "Error al registrarse");
        return;
      }
      setAuthModalOpen(false);
      setRegPassword("");
      await handleConfirmAppointment();
    } finally {
      setAuthLoading(false);
    }
  };

  const canGoToSlots = Boolean(professional);
  const canLeaveServiceStep = Boolean(professional && selectedServiceId);

  const goNext = () => {
    if (currentStep === 1 && canGoToSlots) {
      setCurrentPage(1);
      setCurrentStep(2);
    } else if (currentStep === 2 && includeServicesStep && canLeaveServiceStep) {
      setCurrentPage(1);
      setCurrentStep(3);
    }
  };

  const goBack = () => {
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const isStepCircleDisabled = (stepId: number) => {
    if (stepId === 1) return false;
    if (includeServicesStep) {
      if (stepId === 2) return !professional;
      if (stepId === 3) return !professional || !selectedServiceId;
    }
    return stepId === 2 && !canGoToSlots;
  };

  const totalPages = Math.ceil(availableSlots.length / slotsPerPage);
  const startIndex = (currentPage - 1) * slotsPerPage;
  const endIndex = startIndex + slotsPerPage;
  const paginatedSlots = availableSlots.slice(startIndex, endIndex);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const weekdays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${weekdays[date.getDay()]} ${day} de ${months[date.getMonth()]} de ${year}`;
  };

  const selectedProfessional = professionals.find((p) => p.id === professional);
  const selectedService = services.find((s) => s.id === selectedServiceId);

  if (bookingAllowed === null || !catalogReady) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center">
        <Spinner size="lg" label="Cargando…" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      {variant === "panel" ? (
        <PanelHeader
          title="Nuevo Turno"
          subtitle="Elegí profesional y horario. Para confirmar el turno te pediremos iniciar sesión si hace falta."
        />
      ) : (
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Reservar turno</h1>
          <p className="mt-2 text-default-600 max-w-2xl">
            Elegí profesional y horario. Para confirmar el turno te pediremos iniciar sesión o crear una cuenta de
            paciente.
          </p>
          <p className="mt-3 text-small text-default-500">
            ¿Querés iniciar sesión?{" "}
            <Link href={`/plataforma/${tenantId}/login`} className="text-primary underline">
              Ingresá al panel
            </Link>
          </p>
        </div>
      )}
      {error && (
        <Alert color="danger" className="mb-6 animate-fade-in" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {stepperSteps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isDisabled = isStepCircleDisabled(step.id);
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border-2 font-semibold text-sm
                  ${isActive ? "border-primary bg-primary text-primary-foreground" : ""}
                  ${isCompleted ? "border-primary bg-primary text-primary-foreground" : ""}
                  ${!isActive && !isCompleted ? (isDisabled ? "border-default-300 text-default-400" : "border-default-300") : ""}`}
              >
                {isCompleted ? "✓" : step.id}
              </div>
              <span className={`font-medium ${isActive ? "text-foreground" : isDisabled ? "text-default-400" : "text-default-600"}`}>
                {step.title}
              </span>
              {index < stepperSteps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${isCompleted ? "bg-primary" : "bg-default-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Profesional */}
      {currentStep === 1 && (
        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seleccioná el profesional</h3>
            {loadingProfessionals ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <>
                <Select
                  label="Profesional"
                  placeholder="Elegí un profesional"
                  selectedKeys={professional ? [professional] : []}
                  onSelectionChange={(keys) => handleProfessionalChange((Array.from(keys)[0] as string) || "")}
                  classNames={{ value: "text-slate-800", trigger: "min-h-12" }}
                >
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} textValue={prof.name}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </Select>
                <div className="flex justify-end mt-6">
                  <Button color="primary" onPress={goNext} isDisabled={!canGoToSlots}>
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Step 2: Servicio (solo con feature + catálogo con al menos un servicio) */}
      {currentStep === 2 && includeServicesStep && (
        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seleccioná el servicio</h3>
            {loadingServices ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <>
                <Select
                  label="Servicio"
                  placeholder="Elegí un servicio"
                  selectedKeys={selectedServiceId ? [selectedServiceId] : []}
                  onSelectionChange={(keys) =>
                    setSelectedServiceId((Array.from(keys)[0] as string) || "")
                  }
                  classNames={{ value: "text-slate-800", trigger: "min-h-12" }}
                >
                  {services.map((svc) => (
                    <SelectItem key={svc.id} textValue={svc.name}>
                      {svc.name}
                    </SelectItem>
                  ))}
                </Select>
                <div className="flex justify-between mt-6 gap-2">
                  <Button variant="light" onPress={goBack}>
                    Anterior
                  </Button>
                  <Button color="primary" onPress={goNext} isDisabled={!canLeaveServiceStep}>
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Fecha y hora (paso 2 sin servicios, o paso 3 con servicios) */}
      {currentStep === slotsStepId && (
        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seleccioná fecha y hora</h3>
            {!professional ? (
              <p className="text-default-500">Seleccioná un profesional en el paso anterior.</p>
            ) : includeServicesStep && !selectedServiceId ? (
              <p className="text-default-500">Seleccioná un servicio en el paso anterior.</p>
            ) : loadingSlots ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-default-500">No hay turnos disponibles para este profesional en los próximos 30 días.</p>
            ) : (
              <>
                <p className="text-sm text-default-500 mb-4">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, availableSlots.length)} de {availableSlots.length} turnos
                </p>
                <div className="space-y-2">
                  {paginatedSlots.map((slot, index) => (
                    <div
                      key={`${slot.date}-${slot.time}-${index}`}
                      onClick={() => handleSlotClick(slot)}
                      className="border border-gray-300 rounded-lg p-4 cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-400 active:scale-[0.98]"
                    >
                      <p className="font-medium text-gray-800">{formatDate(slot.date)}</p>
                      <p className="text-sm text-gray-600">{slot.time}</p>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      total={totalPages}
                      page={currentPage}
                      onChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      color="primary"
                    />
                  </div>
                )}
                <div className="flex justify-start mt-6">
                  <Button variant="light" onPress={goBack}>
                    Anterior
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmDialogOpen}
        onClose={() => !confirming && setConfirmDialogOpen(false)}
        size="md"
        scrollBehavior="inside"
        classNames={{ wrapper: "z-[99999]" }}
      >
        <ModalContent>
          <ModalHeader className="text-xl font-semibold text-gray-800">Confirmar Turno</ModalHeader>
          <ModalBody>
            {selectedSlot && selectedProfessional && (
              <div className="py-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Turno</h4>
                <div className="border-t border-gray-200 my-4" />
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Profesional</p>
                  <p className="font-medium text-gray-800">{selectedProfessional.name}</p>
                </div>
                {selectedService && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Servicio</p>
                    <p className="font-medium text-gray-800">{selectedService.name}</p>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Fecha y Hora</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(selectedSlot.date)} a las {selectedSlot.time}
                  </p>
                </div>
                <div className="mb-4">
                  <Select
                    label="Ubicación"
                    selectedKeys={selectedLocation ? [selectedLocation] : []}
                    onSelectionChange={(keys) => setSelectedLocation((Array.from(keys)[0] as string) || "")}
                    isRequired
                    isDisabled={confirming || loadingLocations}
                    classNames={{ value: "text-slate-800" }}
                  >
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} textValue={loc.name}>{loc.name}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => !confirming && setConfirmDialogOpen(false)} isDisabled={confirming}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleConfirmAppointment}
              isDisabled={confirming || !selectedLocation}
              isLoading={confirming}
            >
              Confirmar Turno
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={authModalOpen}
        onClose={() => {
          if (!authLoading) {
            setAuthModalOpen(false);
            setAuthError(null);
          }
        }}
        size="md"
        scrollBehavior="inside"
        classNames={{ wrapper: "z-[99999]" }}
        isDismissable={!authLoading}
      >
        <ModalContent>
          <ModalHeader className="text-xl font-semibold text-gray-800">
            Iniciá sesión o registrate
          </ModalHeader>
          <ModalBody>
            <p className="text-small text-default-600 mb-4">
              Para confirmar el turno necesitamos tu cuenta de paciente en este consultorio.
            </p>
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant={authTab === "login" ? "solid" : "bordered"}
                color={authTab === "login" ? "primary" : "default"}
                onPress={() => {
                  setAuthTab("login");
                  setAuthError(null);
                }}
              >
                Iniciar sesión
              </Button>
              <Button
                size="sm"
                variant={authTab === "register" ? "solid" : "bordered"}
                color={authTab === "register" ? "primary" : "default"}
                onPress={() => {
                  setAuthTab("register");
                  setAuthError(null);
                }}
              >
                Crear cuenta
              </Button>
            </div>
            <Divider className="mb-4" />
            {authError && (
              <Alert color="danger" className="mb-4" onClose={() => setAuthError(null)}>
                {authError}
              </Alert>
            )}
            {authTab === "login" ? (
              <form className="flex flex-col gap-4" onSubmit={handleAuthLogin}>
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onValueChange={setLoginEmail}
                  isRequired
                />
                <Input
                  label="Contraseña"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onValueChange={setLoginPassword}
                  isRequired
                />
                <Button type="submit" color="primary" isLoading={authLoading}>
                  Ingresar y confirmar turno
                </Button>
              </form>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleAuthRegister}>
                <Input
                  label="Nombre"
                  value={regFirstName}
                  onValueChange={setRegFirstName}
                  isRequired
                />
                <Input
                  label="Apellido"
                  value={regLastName}
                  onValueChange={setRegLastName}
                  isRequired
                />
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onValueChange={setRegEmail}
                  isRequired
                />
                <Input
                  label="Contraseña (mín. 6 caracteres)"
                  type="password"
                  autoComplete="new-password"
                  value={regPassword}
                  onValueChange={setRegPassword}
                  isRequired
                />
                <Button type="submit" color="primary" isLoading={authLoading}>
                  Registrarme y confirmar turno
                </Button>
              </form>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                if (!authLoading) {
                  setAuthModalOpen(false);
                  setAuthError(null);
                }
              }}
            >
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, message: "" })}
        message={successDialog.message}
        type="success"
        title="Éxito"
      />
    </div>
  );
}
