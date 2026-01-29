"use client"

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
    Input,
} from "@heroui/react";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

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

    const [professional, setProfessional] = useState("");
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loadingProfessionals, setLoadingProfessionals] = useState(true);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const slotsPerPage = 10;
    
    // Dialog state
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

    // Load professionals on mount
    useEffect(() => {
        const loadProfessionals = async () => {
            try {
                setLoadingProfessionals(true);
                const res = await fetch(`/api/plataforma/${tenantId}/professionals`);
                if (!res.ok) {
                    throw new Error("Error al cargar profesionales");
                }
                const data = await res.json();
                setProfessionals(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                setLoadingProfessionals(false);
            }
        };
        loadProfessionals();
    }, [tenantId]);

    // Load available slots when professional is selected
    const loadAvailableSlots = useCallback(async (professionalId: string) => {
        try {
            setLoadingSlots(true);
            setError(null);
            const now = new Date();
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
            const startDateStr = now.toISOString().split("T")[0];
            const endDateStr = endDate.toISOString().split("T")[0];

            const res = await fetch(
                `/api/plataforma/${tenantId}/appointments/available-slots?professionalId=${professionalId}&startDate=${startDateStr}&endDate=${endDateStr}`
            );
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Error al cargar turnos disponibles (${res.status})`);
            }
            const data = await res.json();
            if (!Array.isArray(data)) {
                throw new Error("Formato de respuesta inválido");
            }
            setAvailableSlots(data);
        } catch (err) {
            console.error("Error loading available slots:", err);
            setError(err instanceof Error ? err.message : "Error desconocido al cargar turnos disponibles");
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }, [tenantId]);

    // Load locations and specialties
    useEffect(() => {
        const loadData = async () => {
            if (!tenantId) return;
            try {
                setLoadingLocations(true);
                setLoadingSpecialties(true);
                
                // Load locations
                const locationsRes = await fetch(`/api/plataforma/${tenantId}/locations`);
                if (locationsRes.ok) {
                    const locationsData = await locationsRes.json();
                    setLocations(Array.isArray(locationsData) ? locationsData.map((l: any) => ({ id: l.id, name: l.name })) : []);
                }
                
                // Load specialties
                const specialtiesRes = await fetch(`/api/plataforma/${tenantId}/specialties`);
                if (specialtiesRes.ok) {
                    const specialtiesData = await specialtiesRes.json();
                    setSpecialties(Array.isArray(specialtiesData) ? specialtiesData.map((s: any) => ({ id: s.id, name: s.name })) : []);
                }
            } catch (err) {
                console.error("Error loading locations/specialties:", err);
            } finally {
                setLoadingLocations(false);
                setLoadingSpecialties(false);
            }
        };
        loadData();
    }, [tenantId]);

    // Handle professional selection
    const handleProfessionalChange = (professionalId: string) => {
        setProfessional(professionalId);
        setCurrentPage(1); // Reset to first page when changing professional
        if (professionalId) {
            loadAvailableSlots(professionalId);
        } else {
            setAvailableSlots([]);
        }
    };

    // Handle slot selection
    const handleSlotClick = (slot: AvailableSlot) => {
        setSelectedSlot(slot);
        
        // Pre-select specialty if professional has only one
        if (selectedProfessional && selectedProfessional.specialties.length === 1) {
            setSelectedSpecialty(selectedProfessional.specialties[0].id);
        } else {
            setSelectedSpecialty("");
        }
        
        // Pre-select location if there's only one
        if (locations.length === 1) {
            setSelectedLocation(locations[0].id);
        } else {
            setSelectedLocation("");
        }
        
        setConfirmDialogOpen(true);
    };

    // Handle appointment confirmation
    const handleConfirmAppointment = async () => {
        if (!selectedSlot || !selectedProfessional || !selectedLocation || !selectedSpecialty) {
            setError("Por favor completa todos los campos");
            return;
        }

        try {
            setConfirming(true);
            setError(null);

            // Parse datetime string (format: YYYY-MM-DDTHH:mm:ss)
            const [datePart, timePart] = selectedSlot.datetime.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);
            
            // Create start date (local time)
            const startAt = new Date(year, month - 1, day, hours, minutes, 0);
            // End date is 45 minutes later (default appointment duration)
            const endAt = new Date(startAt.getTime() + 45 * 60 * 1000);

            const response = await fetch(`/api/plataforma/${tenantId}/appointments/request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Ensure cookies are sent
                body: JSON.stringify({
                    professionalId: selectedProfessional.id,
                    locationId: selectedLocation,
                    specialtyId: selectedSpecialty,
                    startAt: startAt.toISOString(),
                    endAt: endAt.toISOString(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.details || `Error al crear el turno (${response.status})`;
                console.error("Appointment creation error:", {
                    status: response.status,
                    error: errorData
                });
                throw new Error(errorMessage);
            }

            // Success - close dialog and reload slots
            setConfirmDialogOpen(false);
            setSelectedSlot(null);
            setSelectedLocation("");
            setSelectedSpecialty("");
            
            // Reload available slots to reflect the new appointment
            if (selectedProfessional.id) {
                await loadAvailableSlots(selectedProfessional.id);
            }
            
            // Show success message
            setError(null);
            setSuccessDialog({
                open: true,
                message: "Turno creado exitosamente",
            });
        } catch (err) {
            console.error("Error creating appointment:", err);
            setError(err instanceof Error ? err.message : "Error desconocido al crear el turno");
        } finally {
            setConfirming(false);
        }
    };

    // Calculate pagination
    const totalPages = Math.ceil(availableSlots.length / slotsPerPage);
    const startIndex = (currentPage - 1) * slotsPerPage;
    const endIndex = startIndex + slotsPerPage;
    const paginatedSlots = availableSlots.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top of slots list
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Format date for display
    // Parse date as local date to avoid timezone issues
    const formatDate = (dateStr: string) => {
        // Parse YYYY-MM-DD format as local date
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        // Use a consistent format that works the same on server and client
        const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const weekday = weekdays[date.getDay()];
        const monthName = months[date.getMonth()];
        
        return `${weekday} ${day} de ${monthName} de ${year}`;
    };

    const selectedProfessional = professionals.find((p) => p.id === professional);

    return (
        <div className="max-w-7xl mx-auto mt-8 px-4">
            <PanelHeader
                title="Nuevo Turno"
                subtitle="Para crear un nuevo turno, debes seleccionar las opciones"
            />
            {error && (
                <Alert color="danger" className="mb-6 animate-fade-in" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr_2fr] gap-6">
                <div className="py-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Selecciona el profesional
                    </h3>
                    {loadingProfessionals ? (
                        <div className="flex justify-center items-center py-16">
                            <Spinner />
                        </div>
                    ) : (
                        <Select
                            label="Profesional"
                            selectedKeys={professional ? [professional] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                handleProfessionalChange(selected);
                            }}
                            className="w-full"
                        >
                            {professionals.map((prof) => (
                                <SelectItem key={prof.id} value={prof.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{prof.name}</span>
                                        {prof.specialty && (
                                            <Chip size="sm" className="ml-2">
                                                {prof.specialty.name}
                                            </Chip>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </Select>
                    )}
                </div>
                <div></div>
                <div className="py-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Selecciona el turno de acuerdo a la disponibilidad
                    </h3>
                    {!professional ? (
                        <Card className="p-6 text-center border border-gray-200 bg-gray-50">
                            <CardBody>
                                <p className="text-gray-600">
                                    Selecciona un profesional para ver los turnos disponibles
                                </p>
                            </CardBody>
                        </Card>
                    ) : loadingSlots ? (
                        <div className="flex justify-center items-center py-16">
                            <Spinner />
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <Card className="p-6 text-center border border-gray-200 bg-gray-50">
                            <CardBody>
                                <p className="text-gray-600">
                                    No hay turnos disponibles para este profesional en los próximos 30 días
                                </p>
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="animate-fade-in">
                            <p className="text-sm text-gray-600 mb-4">
                                Mostrando {startIndex + 1}-{Math.min(endIndex, availableSlots.length)} de {availableSlots.length} turnos disponibles
                            </p>
                            <div className="space-y-2">
                                {paginatedSlots.map((slot, index) => (
                                    <div
                                        key={`${slot.date}-${slot.time}-${index}`}
                                        onClick={() => handleSlotClick(slot)}
                                        className="border border-gray-300 rounded-lg mb-2 p-4 cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
                                    >
                                        <p className="font-medium text-gray-800">
                                            {formatDate(slot.date)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {slot.time}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        color="primary"
                                        size="lg"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Modal
                isOpen={confirmDialogOpen}
                onClose={() => !confirming && setConfirmDialogOpen(false)}
                size="md"
                scrollBehavior="inside"
                className="animate-fade-in"
                classNames={{
                    wrapper: "z-[99999]"
                }}
            >
                <ModalContent>
                    <ModalHeader className="text-xl font-semibold text-gray-800">Confirmar Turno</ModalHeader>
                    <ModalBody>
                        {selectedSlot && selectedProfessional && (
                            <div className="py-4">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                    Detalles del Turno
                                </h4>
                                <div className="border-t border-gray-200 my-4" />
                                
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-1">
                                        Profesional
                                    </p>
                                    <p className="font-medium text-gray-800">
                                        {selectedProfessional.name}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-1">
                                        Fecha y Hora
                                    </p>
                                    <p className="font-medium text-gray-800">
                                        {formatDate(selectedSlot.date)} a las {selectedSlot.time}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <Select
                                        label="Especialidad"
                                        selectedKeys={selectedSpecialty ? [selectedSpecialty] : []}
                                        onSelectionChange={(keys) => {
                                            const selected = Array.from(keys)[0] as string;
                                            setSelectedSpecialty(selected);
                                        }}
                                        isRequired
                                        isDisabled={confirming || loadingSpecialties}
                                        className="w-full"
                                    >
                                        {selectedProfessional.specialties.length > 0 ? (
                                            selectedProfessional.specialties.map((spec) => (
                                                <SelectItem key={spec.id} value={spec.id}>
                                                    {spec.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            specialties.map((spec) => (
                                                <SelectItem key={spec.id} value={spec.id}>
                                                    {spec.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </Select>
                                </div>

                                <div className="mb-4">
                                    <Select
                                        label="Ubicación"
                                        selectedKeys={selectedLocation ? [selectedLocation] : []}
                                        onSelectionChange={(keys) => {
                                            const selected = Array.from(keys)[0] as string;
                                            setSelectedLocation(selected);
                                        }}
                                        isRequired
                                        isDisabled={confirming || loadingLocations}
                                        className="w-full"
                                    >
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {error && (
                                    <Alert color="danger" className="mt-4 animate-fade-in" onClose={() => setError(null)}>
                                        {error}
                                    </Alert>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onPress={() => {
                                setConfirmDialogOpen(false);
                                setSelectedSlot(null);
                                setSelectedLocation("");
                                setSelectedSpecialty("");
                                setError(null);
                            }}
                            isDisabled={confirming}
                            variant="light"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onPress={handleConfirmAppointment}
                            color="primary"
                            isDisabled={confirming || !selectedLocation || !selectedSpecialty}
                            isLoading={confirming}
                        >
                            Confirmar Turno
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Success Dialog */}
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
