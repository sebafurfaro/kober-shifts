"use client";

import { PanelHeader } from "../../components/PanelHeader";
import {
  Select,
  SelectItem,
  Spinner,
  Alert,
  Button,
  Card,
  CardBody,
  Chip,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

const STEPS = [
  { id: 1, title: "Servicio" },
  { id: 2, title: "Profesional" },
  { id: 3, title: "Fecha y hora" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  marginMinutes: number;
  price: number;
  seniaPercent: number;
}

interface Professional {
  id: string;
  name: string;
  email: string;
  specialty?: { id: string; name: string } | null;
  specialties: Array<{ id: string; name: string }>;
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

interface Specialty {
  id: string;
  name: string;
}

export default function NewAppointment() {
  const params = useParams();
  const tenantId = params.tenantId as string;

  // Step flow
  const [currentStep, setCurrentStep] = useState<StepId>(1);

  // Step 1: Service
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Step 2: Professional
  const [professional, setProfessional] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);

  // Step 3: Slots
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const slotsPerPage = 10;

  // Confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [successWithCheckout, setSuccessWithCheckout] = useState<{
    open: boolean;
    appointmentId: string;
  }>({ open: false, appointmentId: "" });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Load services on mount (Step 1)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingServices(true);
        const res = await fetch(`/api/plataforma/${tenantId}/admin/services`, { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar servicios");
        const data = await res.json();
        if (!cancelled) setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar servicios");
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  // Load professionals when step 2 is active or when step 1 is complete (for enabling next)
  useEffect(() => {
    if (currentStep < 2 || !selectedService) return;
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
    return () => { cancelled = true; };
  }, [tenantId, currentStep, selectedService]);

  // Load slots when step 3 is active and professional is selected
  const loadAvailableSlots = useCallback(async (professionalId: string) => {
    try {
      setLoadingSlots(true);
      setError(null);
      const now = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
      const startDateStr = now.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      const res = await fetch(
        `/api/plataforma/${tenantId}/appointments/available-slots?professionalId=${professionalId}&startDate=${startDateStr}&endDate=${endDateStr}`,
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
    if (currentStep === 3 && professional) loadAvailableSlots(professional);
    else if (currentStep !== 3) setAvailableSlots([]);
  }, [currentStep, professional, loadAvailableSlots]);

  // Load locations and specialties for confirm dialog
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        setLoadingLocations(true);
        setLoadingSpecialties(true);
        const [locationsRes, specialtiesRes] = await Promise.all([
          fetch(`/api/plataforma/${tenantId}/locations`, { credentials: "include" }),
          fetch(`/api/plataforma/${tenantId}/specialties`, { credentials: "include" }),
        ]);
        if (locationsRes.ok) {
          const data = await locationsRes.json();
          setLocations(Array.isArray(data) ? data.map((l: { id: string; name: string }) => ({ id: l.id, name: l.name })) : []);
        }
        if (specialtiesRes.ok) {
          const data = await specialtiesRes.json();
          setSpecialties(Array.isArray(data) ? data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })) : []);
        }
      } catch {
        // ignore
      } finally {
        setLoadingLocations(false);
        setLoadingSpecialties(false);
      }
    })();
  }, [tenantId]);

  const handleProfessionalChange = (professionalId: string) => {
    setProfessional(professionalId);
    setCurrentPage(1);
    if (professionalId) loadAvailableSlots(professionalId);
    else setAvailableSlots([]);
  };

  const handleSlotClick = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    const selectedProfessionalObj = professionals.find((p) => p.id === professional);
    if (selectedProfessionalObj?.specialties?.length === 1) {
      setSelectedSpecialty(selectedProfessionalObj.specialties[0].id);
    } else {
      setSelectedSpecialty("");
    }
    if (locations.length === 1) setSelectedLocation(locations[0].id);
    else setSelectedLocation("");
    setConfirmDialogOpen(true);
  };

  const handleConfirmAppointment = async () => {
    if (!selectedSlot || !professional || !selectedLocation || !selectedSpecialty) {
      setError("Por favor completa todos los campos");
      return;
    }
    const selectedProfessionalObj = professionals.find((p) => p.id === professional);
    if (!selectedProfessionalObj) return;

    try {
      setConfirming(true);
      setError(null);
      // Slot datetime is in local (e.g. "2025-02-02T09:00:00"). Backend expects BA time as UTC
      // components (same as FullCalendar), so we send Date.UTC(...) so getUTCHours() = 9.
      const [datePart, timePart] = selectedSlot.datetime.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      const startAt = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
      const endAt = new Date(startAt.getTime() + 45 * 60 * 1000);

      const response = await fetch(`/api/plataforma/${tenantId}/appointments/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          professionalId: selectedProfessionalObj.id,
          locationId: selectedLocation,
          specialtyId: selectedSpecialty,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Error al crear el turno (${response.status})`);
      }

      const result = await response.json();
      const appointmentId = result.appointmentId as string | undefined;

      setConfirmDialogOpen(false);
      setSelectedSlot(null);
      setSelectedLocation("");
      setSelectedSpecialty("");
      if (professional) await loadAvailableSlots(professional);
      setError(null);

      if (selectedService && selectedService.price > 0 && appointmentId) {
        setSuccessWithCheckout({ open: true, appointmentId });
      } else {
        setSuccessDialog({ open: true, message: "Turno creado exitosamente" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el turno");
    } finally {
      setConfirming(false);
    }
  };

  const step1Complete = selectedService != null;
  const step2Complete = professional != null;
  const canGoToStep2 = step1Complete;
  const canGoToStep3 = step2Complete;

  const goNext = () => {
    if (currentStep === 1 && canGoToStep2) {
      setProfessional("");
      setAvailableSlots([]);
      setCurrentStep(2);
    } else if (currentStep === 2 && canGoToStep3) {
      setCurrentPage(1);
      setCurrentStep(3);
    }
  };

  const goBack = () => {
    if (currentStep === 2) {
      setProfessional("");
      setAvailableSlots([]);
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
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

  const handleCheckout = async () => {
    if (!successWithCheckout.appointmentId || !selectedService) return;
    try {
      setCheckoutLoading(true);
      setError(null);
      const amount = selectedService.seniaPercent > 0
        ? Math.round(selectedService.price * (selectedService.seniaPercent / 100))
        : selectedService.price;
      const res = await fetch(`/api/plataforma/${tenantId}/payments/mercadopago/preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appointmentId: successWithCheckout.appointmentId,
          amount,
          purpose: "deposit",
          description: `Seña - ${selectedService.name}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error al generar el link de pago");
      }
      const initPoint = data.initPoint || data.sandboxInitPoint;
      if (initPoint) {
        window.location.href = initPoint;
        return;
      }
      throw new Error("No se recibió el link de pago");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al ir al checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const selectedProfessional = professionals.find((p) => p.id === professional);

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <PanelHeader
        title="Nuevo Turno"
        subtitle="Seguí los pasos para elegir servicio, profesional y horario"
      />
      {error && (
        <Alert color="danger" className="mb-6 animate-fade-in" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isDisabled = step.id === 2 && !canGoToStep2 || step.id === 3 && !canGoToStep3;
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
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${isCompleted ? "bg-primary" : "bg-default-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Servicio */}
      {currentStep === 1 && (
        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seleccioná el servicio</h3>
            {loadingServices ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : services.length === 0 ? (
              <p className="text-default-500">No hay servicios disponibles.</p>
            ) : (
              <Select
                label="Servicio"
                placeholder="Elegí un servicio"
                selectedKeys={selectedService ? [selectedService.id] : []}
                onSelectionChange={(keys) => {
                  const id = Array.from(keys)[0] as string;
                  setSelectedService(services.find((s) => s.id === id) ?? null);
                }}
                classNames={{ value: "text-slate-800", trigger: "min-h-12" }}
              >
                {services.map((s) => (
                  <SelectItem key={s.id} textValue={s.name}>
                    <div className="flex flex-col gap-0.5">
                      <span>{s.name}</span>
                      <span className="text-small text-default-500">
                        {s.durationMinutes} min · {s.price > 0 ? `$${s.price}` : "Sin cargo"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            )}
            <div className="flex justify-end mt-6">
              <Button color="primary" onPress={goNext} isDisabled={!canGoToStep2}>
                Siguiente
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2: Profesional */}
      {currentStep === 2 && (
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
                      <div className="flex items-center gap-2">
                        <span>{prof.name}</span>
                        {prof.specialty && <Chip size="sm">{prof.specialty.name}</Chip>}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                <div className="flex justify-between mt-6">
                  <Button variant="light" onPress={goBack}>
                    Anterior
                  </Button>
                  <Button color="primary" onPress={goNext} isDisabled={!canGoToStep3}>
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Step 3: Fecha y hora */}
      {currentStep === 3 && (
        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seleccioná fecha y hora</h3>
            {!professional ? (
              <p className="text-default-500">Seleccioná un profesional en el paso anterior.</p>
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
                {selectedService && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Servicio</p>
                    <p className="font-medium text-gray-800">
                      {selectedService.name} {selectedService.price > 0 ? `($${selectedService.price})` : ""}
                    </p>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Profesional</p>
                  <p className="font-medium text-gray-800">{selectedProfessional.name}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Fecha y Hora</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(selectedSlot.date)} a las {selectedSlot.time}
                  </p>
                </div>
                <div className="mb-4">
                  <Select
                    label="Especialidad"
                    selectedKeys={selectedSpecialty ? [selectedSpecialty] : []}
                    onSelectionChange={(keys) => setSelectedSpecialty((Array.from(keys)[0] as string) || "")}
                    isRequired
                    isDisabled={confirming || loadingSpecialties}
                    classNames={{ value: "text-slate-800" }}
                  >
                    {(selectedProfessional.specialties?.length ? selectedProfessional.specialties : specialties).map((spec) => (
                      <SelectItem key={spec.id} value={spec.id}>{spec.name}</SelectItem>
                    ))}
                  </Select>
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
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
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
              isDisabled={confirming || !selectedLocation || !selectedSpecialty}
              isLoading={confirming}
            >
              Confirmar Turno
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={successWithCheckout.open}
        onClose={() => !checkoutLoading && setSuccessWithCheckout({ open: false, appointmentId: "" })}
        size="md"
        isDismissable={!checkoutLoading}
        classNames={{ wrapper: "z-[99999]" }}
      >
        <ModalContent>
          <ModalHeader className="text-xl font-semibold text-gray-800">Turno creado</ModalHeader>
          <ModalBody>
            <p className="text-default-700">
              Tu turno fue registrado. Para confirmarlo con seña, completá el pago en Mercado Pago.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setSuccessWithCheckout({ open: false, appointmentId: "" })}
              isDisabled={checkoutLoading}
            >
              Cerrar
            </Button>
            <Button
              color="primary"
              onPress={handleCheckout}
              isLoading={checkoutLoading}
              isDisabled={checkoutLoading}
            >
              Ir a Checkout (Mercado Pago)
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
