"use client";

import * as React from "react";
import { Select, SelectItem, Chip } from "@heroui/react";
import { ProfessionalFormData, Specialty } from "./types";

interface SpecialtiesTabProps {
    formData: ProfessionalFormData;
    handleChange: (field: keyof ProfessionalFormData, value: any) => void;
    errors: Record<string, string>;
    specialties: Specialty[];
}

export function SpecialtiesTab({ formData, handleChange, errors, specialties }: SpecialtiesTabProps) {
    return (
        <div>
            <Select
                label="Especialidades"
                selectionMode="multiple"
                selectedKeys={formData.specialtyIds}
                onSelectionChange={(keys) => {
                    const selectedArray = Array.from(keys) as string[];
                    handleChange("specialtyIds", selectedArray);
                }}
                isInvalid={!!errors.specialtyIds}
                errorMessage={errors.specialtyIds}
                isRequired
                labelPlacement="outside-top"
                classNames={{
                    base: "mb-4",
                    trigger: "h-11 border-2 border-gray-200 bg-white data-[hover=true]:bg-white",
                    value: "px-4 text-sm text-gray-800",
                    label: "text-sm font-medium text-gray-500",
                    popoverContent: "bg-white border-2 border-gray-200 text-slate-800",
                    listbox: "p-2",
                    listboxWrapper: "max-h-[300px]",
                }}
                renderValue={(items) => {
                    return (
                        <div className="flex flex-wrap gap-1 px-4 py-2">
                            {items.map((item) => {
                                const s = specialties.find((spec) => spec.id === item.key);
                                return (
                                    <Chip key={item.key} size="md" variant="flat" className="text-md">
                                        {s?.name || item.key}
                                    </Chip>
                                );
                            })}
                        </div>
                    );
                }}
            >
                {specialties.map((s) => (
                    <SelectItem key={s.id}>
                        {s.name}
                    </SelectItem>
                ))}
            </Select>
            <p className="text-xs text-gray-500 mt-3">
                El profesional puede tener múltiples especialidades asignadas.
            </p>
        </div>
    );
}
