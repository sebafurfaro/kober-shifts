"use client"

import { PanelHeader } from "../../components/PanelHeader";
import {
    Box,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Button,
    Paper,
    Chip,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider
} from "@mui/material";
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

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
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
        <Container maxWidth="lg" className="mt-8">
            <PanelHeader
                title="Nuevo Turno"
                subtitle="Para crear un nuevo turno, debes seleccionar las opciones"
            />
            {error && (
                <Alert severity="error" className="mb-6 animate-fade-in" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            <Box className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr_2fr] gap-6">
                <Box className="py-8">
                    <Typography variant="h6" className="mb-4 font-semibold text-gray-800">
                        Selecciona el profesional
                    </Typography>
                    {loadingProfessionals ? (
                        <Box className="flex justify-center items-center py-16">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <FormControl fullWidth>
                            <InputLabel>Profesional</InputLabel>
                            <Select
                                label="Profesional"
                                value={professional}
                                onChange={(e) => handleProfessionalChange(e.target.value)}
                                className="focus:ring-2 focus:ring-blue-500"
                            >
                                {professionals.map((prof) => (
                                    <MenuItem key={prof.id} value={prof.id} className="hover:bg-gray-100">
                                        {prof.name}
                                        {prof.specialty && (
                                            <Chip
                                                label={prof.specialty.name}
                                                size="small"
                                                className="ml-2"
                                            />
                                        )}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>
                <Box></Box>
                <Box className="py-8">
                    <Typography variant="h6" className="mb-4 font-semibold text-gray-800">
                        Selecciona el turno de acuerdo a la disponibilidad
                    </Typography>
                    {!professional ? (
                        <Paper className="p-6 text-center rounded-lg border border-gray-200 bg-gray-50">
                            <Typography color="text.secondary" className="text-gray-600">
                                Selecciona un profesional para ver los turnos disponibles
                            </Typography>
                        </Paper>
                    ) : loadingSlots ? (
                        <Box className="flex justify-center items-center py-16">
                            <CircularProgress />
                        </Box>
                    ) : availableSlots.length === 0 ? (
                        <Paper className="p-6 text-center rounded-lg border border-gray-200 bg-gray-50">
                            <Typography color="text.secondary" className="text-gray-600">
                                No hay turnos disponibles para este profesional en los próximos 30 días
                            </Typography>
                        </Paper>
                    ) : (
                        <Box className="animate-fade-in">
                            <Typography variant="body2" color="text.secondary" className="mb-4 text-gray-600">
                                Mostrando {startIndex + 1}-{Math.min(endIndex, availableSlots.length)} de {availableSlots.length} turnos disponibles
                            </Typography>
                            <List className="space-y-2">
                                {paginatedSlots.map((slot, index) => (
                                    <ListItem
                                        key={`${slot.date}-${slot.time}-${index}`}
                                        onClick={() => handleSlotClick(slot)}
                                        className="border border-gray-300 rounded-lg mb-2 cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography variant="body1" fontWeight={500} className="text-gray-800">
                                                    {formatDate(slot.date)}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary" className="text-gray-600">
                                                    {slot.time}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            {totalPages > 1 && (
                                <Box className="flex justify-center mt-6">
                                    <Pagination
                                        count={totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        color="primary"
                                        size="large"
                                        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                    />
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => !confirming && setConfirmDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                className="animate-fade-in"
            >
                <DialogTitle className="text-xl font-semibold text-gray-800">Confirmar Turno</DialogTitle>
                <DialogContent>
                    {selectedSlot && selectedProfessional && (
                        <Box className="py-4">
                            <Typography variant="h6" className="mb-4 font-semibold text-gray-800">
                                Detalles del Turno
                            </Typography>
                            <Divider className="my-4" />
                            
                            <Box className="mb-4">
                                <Typography variant="body2" color="text.secondary" className="text-gray-600 mb-1">
                                    Profesional
                                </Typography>
                                <Typography variant="body1" fontWeight={500} className="text-gray-800">
                                    {selectedProfessional.name}
                                </Typography>
                            </Box>

                            <Box className="mb-4">
                                <Typography variant="body2" color="text.secondary" className="text-gray-600 mb-1">
                                    Fecha y Hora
                                </Typography>
                                <Typography variant="body1" fontWeight={500} className="text-gray-800">
                                    {formatDate(selectedSlot.date)} a las {selectedSlot.time}
                                </Typography>
                            </Box>

                            <Box className="mb-4">
                                <FormControl fullWidth required>
                                    <InputLabel>Especialidad</InputLabel>
                                    <Select
                                        value={selectedSpecialty}
                                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                                        label="Especialidad"
                                        disabled={confirming || loadingSpecialties}
                                        className="focus:ring-2 focus:ring-blue-500"
                                    >
                                        {selectedProfessional.specialties.length > 0 ? (
                                            selectedProfessional.specialties.map((spec) => (
                                                <MenuItem key={spec.id} value={spec.id} className="hover:bg-gray-100">
                                                    {spec.name}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            specialties.map((spec) => (
                                                <MenuItem key={spec.id} value={spec.id} className="hover:bg-gray-100">
                                                    {spec.name}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box className="mb-4">
                                <FormControl fullWidth required>
                                    <InputLabel>Ubicación</InputLabel>
                                    <Select
                                        value={selectedLocation}
                                        onChange={(e) => setSelectedLocation(e.target.value)}
                                        label="Ubicación"
                                        disabled={confirming || loadingLocations}
                                        className="focus:ring-2 focus:ring-blue-500"
                                    >
                                        {locations.map((loc) => (
                                            <MenuItem key={loc.id} value={loc.id} className="hover:bg-gray-100">
                                                {loc.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {error && (
                                <Alert severity="error" className="mt-4 animate-fade-in" onClose={() => setError(null)}>
                                    {error}
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions className="px-6 py-4 gap-2">
                    <Button
                        onClick={() => {
                            setConfirmDialogOpen(false);
                            setSelectedSlot(null);
                            setSelectedLocation("");
                            setSelectedSpecialty("");
                            setError(null);
                        }}
                        disabled={confirming}
                        className="px-4 py-2 hover:bg-gray-100 transition-colors duration-150"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmAppointment}
                        variant="contained"
                        disabled={confirming || !selectedLocation || !selectedSpecialty}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {confirming ? <CircularProgress size={24} /> : "Confirmar Turno"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Dialog */}
            <AlertDialog
                open={successDialog.open}
                onClose={() => setSuccessDialog({ open: false, message: "" })}
                message={successDialog.message}
                type="success"
                title="Éxito"
            />
        </Container>
    );
}
