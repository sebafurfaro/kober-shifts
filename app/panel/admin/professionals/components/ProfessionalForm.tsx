"use client";

import * as React from "react";
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Divider,
    Tabs,
    Tab,
} from "@mui/material";
import { ProfessionalFormData, INITIAL_AVAILABILITY, Specialty } from "./types";
import { ContactTab } from "./ContactTab";
import { SpecialtiesTab } from "./SpecialtiesTab";
import { CoveragesTab } from "./CoveragesTab";
import { AvailabilityTab } from "./AvailabilityTab";

interface ProfessionalFormProps {
    initialData?: Partial<ProfessionalFormData>;
    onSubmit: (data: ProfessionalFormData) => Promise<void>;
    loading?: boolean;
    mode: "create" | "edit";
    specialties: Specialty[];
}

export function ProfessionalForm({
    initialData,
    onSubmit,
    loading = false,
    mode,
    specialties,
}: ProfessionalFormProps) {
    const [activeTab, setActiveTab] = React.useState(0);
    const [formData, setFormData] = React.useState<ProfessionalFormData>({
        name: initialData?.name || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        licenseNumber: initialData?.licenseNumber || "",
        tempPassword: "",
        specialtyIds: initialData?.specialtyIds || [],
        medicalCoverages: initialData?.medicalCoverages || [],
        color: initialData?.color || "#2196f3",
        availabilityConfig: initialData?.availabilityConfig || { ...INITIAL_AVAILABILITY },
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleChange = (field: keyof ProfessionalFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
        if (!formData.email.trim()) {
            newErrors.email = "El email es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "El formato del email no es válido";
        }
        if (mode === "create" && !formData.tempPassword) {
            newErrors.tempPassword = "La contraseña es requerida";
        }
        if (formData.specialtyIds.length === 0) {
            newErrors.specialtyIds = "Selecciona al menos una especialidad";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        } else {
            setActiveTab(0); // Go back to first tab if there are core errors
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Paper sx={{ mb: 4 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label="Contacto" />
                    <Tab label="Especialidades" />
                    <Tab label="Coberturas" />
                    <Tab label="Disponibilidad" />
                </Tabs>

                <Box sx={{ p: 4 }}>
                    {activeTab === 0 && (
                        <ContactTab
                            formData={formData}
                            handleChange={handleChange}
                            errors={errors}
                            mode={mode}
                        />
                    )}

                    {activeTab === 1 && (
                        <SpecialtiesTab
                            formData={formData}
                            handleChange={handleChange}
                            errors={errors}
                            specialties={specialties}
                        />
                    )}

                    {activeTab === 2 && (
                        <CoveragesTab formData={formData} setFormData={setFormData} />
                    )}

                    {activeTab === 3 && (
                        <AvailabilityTab
                            availabilityConfig={formData.availabilityConfig}
                            setFormData={setFormData}
                        />
                    )}
                </Box>

                <Divider />
                <Box sx={{ p: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                    <Button variant="outlined" onClick={() => window.history.back()} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {loading ? "Guardando..." : "Guardar"}
                    </Button>
                </Box>
            </Paper>
        </form>
    );
}
