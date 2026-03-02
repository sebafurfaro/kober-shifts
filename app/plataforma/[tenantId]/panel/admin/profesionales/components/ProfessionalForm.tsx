"use client";

import * as React from "react";
import {
    Button,
    Spinner,
    Card,
    CardBody,
    Tabs,
    Tab,
} from "@heroui/react";
import { ProfessionalFormData, INITIAL_AVAILABILITY, Specialty } from "./types";
import { ContactTab } from "./ContactTab";
import { SpecialtiesTab } from "./SpecialtiesTab";
import { CoveragesTab } from "./CoveragesTab";
import { AvailabilityTab } from "./AvailabilityTab";
import { HolidaysTab } from "./HolidaysTab";

interface ProfessionalFormProps {
    initialData?: Partial<ProfessionalFormData>;
    onSubmit: (data: ProfessionalFormData) => Promise<void>;
    loading?: boolean;
    mode: "create" | "edit";
    specialties: Specialty[];
    /** Si false, no se muestra el tab Especialidades (feature flag show_specialties). */
    showSpecialties?: boolean;
    /** Si false, no se muestra el tab Coberturas (feature flag show_coverage). */
    showCoverage?: boolean;
}

export function ProfessionalForm({
    initialData,
    onSubmit,
    loading = false,
    mode,
    specialties,
    showSpecialties = true,
    showCoverage = true,
}: ProfessionalFormProps) {
    const [selectedTab, setSelectedTab] = React.useState<string>("contacto");

    const handleSelectionChange = (key: React.Key) => {
        setSelectedTab(String(key));
    };
    const [formData, setFormData] = React.useState<ProfessionalFormData>({
        name: initialData?.name || "",
        email: initialData?.email || "",
        dni: initialData?.dni ?? "",
        phone: initialData?.phone || "",
        licenseNumber: initialData?.licenseNumber || "",
        tempPassword: "",
        specialtyIds: initialData?.specialtyIds || [],
        medicalCoverages: initialData?.medicalCoverages || [],
        color: initialData?.color || "#2196f3",
        availabilityConfig: initialData?.availabilityConfig || { ...INITIAL_AVAILABILITY },
        holidays: initialData?.holidays || initialData?.availabilityConfig?.holidays || [],
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});

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
        if (mode === "create" && !formData.dni?.trim()) {
            newErrors.dni = "El DNI es requerido (será la clave temporal para el primer acceso)";
        }
        if (showSpecialties && formData.specialtyIds.length === 0) {
            newErrors.specialtyIds = "Selecciona al menos una especialidad";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (validate()) {
            let dataToSubmit = formData;
            if (!showSpecialties && formData.specialtyIds.length === 0 && specialties.length > 0) {
                dataToSubmit = { ...formData, specialtyIds: [specialties[0].id] };
            }
            if (mode === "create" && dataToSubmit.dni?.trim()) {
                dataToSubmit = { ...dataToSubmit, tempPassword: dataToSubmit.dni.trim() };
            }
            onSubmit(dataToSubmit);
        } else {
            setSelectedTab("contacto"); // Go back to first tab if there are core errors
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full flex-col card">
            <Tabs
                selectedKey={selectedTab}
                onSelectionChange={handleSelectionChange}
                aria-label="Tabs del formulario de profesional"
                className="w-full"
                classNames={{
                    base: "w-full",
                    tabList: "gap-2 md:gap-6 w-full relative bg-gray-100 rounded-lg p-1",
                    cursor: "bg-white rounded-lg transition-all duration-300 ease-in-out font-medium",
                    tab: "md:max-w-fit px-2 md:px-4 h-12 rounded-md text-slate-800",
                    tabContent: "group-data-[selected=true]:text-primary",
                    panel: "p-0",
                }}
            >
                <Tab key="contacto" title="Contacto">
                    <Card>
                        <CardBody>
                            <ContactTab
                                formData={formData}
                                handleChange={handleChange}
                                errors={errors}
                                mode={mode}
                            />
                        </CardBody>
                    </Card>
                </Tab>
                {showSpecialties && (
                    <Tab key="especialidades" title="Especialidades">
                        <Card>
                            <CardBody>
                                <SpecialtiesTab
                                    formData={formData}
                                    handleChange={handleChange}
                                    errors={errors}
                                    specialties={specialties}
                                />
                            </CardBody>
                        </Card>
                    </Tab>
                )}
                {showCoverage && (
                    <Tab key="coberturas" title="Coberturas">
                        <Card>
                            <CardBody>
                                <CoveragesTab formData={formData} setFormData={setFormData} />
                            </CardBody>
                        </Card>
                    </Tab>
                )}
                <Tab key="disponibilidad" title="Disponibilidad">
                    <Card>
                        <CardBody>
                            <AvailabilityTab
                                availabilityConfig={formData.availabilityConfig}
                                setFormData={setFormData}
                                onSave={handleSubmit}
                                loading={loading}
                            />
                        </CardBody>
                    </Card>
                </Tab>
                <Tab key="vacaciones" title="Vacaciones">
                    <Card>
                        <CardBody>
                            <HolidaysTab formData={formData} setFormData={setFormData} onSave={handleSubmit} loading={loading} />
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>

            <div className="mt-6 flex justify-end gap-3">
                <Button
                    type="submit"
                    color="success"
                    isDisabled={loading}
                    isLoading={loading}
                    className="button button-success"
                >
                    {loading ? "Guardando..." : "Guardar"}
                </Button>
            </div>
        </form>
    );
}
