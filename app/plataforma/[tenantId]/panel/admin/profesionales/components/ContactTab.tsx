"use client";

import * as React from "react";
import { Input } from "@heroui/react";
import { ProfessionalFormData } from "./types";
import { ColorPicker } from "../../components/ColorPicker";

interface ContactTabProps {
    formData: ProfessionalFormData;
    handleChange: (field: keyof ProfessionalFormData, value: any) => void;
    errors: Record<string, string>;
    mode: "create" | "edit";
}

export function ContactTab({ formData, handleChange, errors, mode }: ContactTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
                label="Nombre y Apellido"
                value={formData.name}
                onValueChange={(value) => handleChange("name", value)}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
                isRequired
                classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                }}
            />
            <Input
                label="Email"
                type="email"
                value={formData.email}
                onValueChange={(value) => handleChange("email", value)}
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                isRequired
                isDisabled={mode === "edit"}
                classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                }}
            />
            <Input
                label="DNI"
                type="number"
                value={formData.dni ?? ""}
                onValueChange={(value) => handleChange("dni", value)}
                isInvalid={!!errors.dni}
                errorMessage={errors.dni}
                description={mode === "create" ? "Opcional. Si lo ingresás, será la clave temporal para el primer acceso (el profesional ingresa con email y DNI)." : undefined}
                classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                }}
            />
            {mode === "create" && (
                <Input
                    label="Contraseña (opcional si completás DNI)"
                    type="password"
                    value={formData.tempPassword ?? ""}
                    onValueChange={(value) => handleChange("tempPassword", value)}
                    isInvalid={!!errors.tempPassword}
                    errorMessage={errors.tempPassword}
                    description="Si no la completás, se usará el DNI como clave (debe cumplir los mismos requisitos). Mínimo 8 caracteres, una mayúscula, un número y un carácter especial."
                    autoComplete="new-password"
                    classNames={{
                        input: "text-slate-800",
                        inputWrapper: "text-slate-800",
                    }}
                />
            )}
            {mode === "edit" && (
                <Input
                    label="Nueva Contraseña (opcional)"
                    type="password"
                    value={formData.tempPassword ?? ""}
                    onValueChange={(value) => handleChange("tempPassword", value)}
                    isInvalid={!!errors.tempPassword}
                    errorMessage={errors.tempPassword}
                    description="Dejar en blanco para mantener la contraseña actual"
                    autoComplete="new-password"
                    classNames={{
                        input: "text-slate-800",
                        inputWrapper: "text-slate-800",
                    }}
                />
            )}
            <Input
                label="Teléfono"
                value={formData.phone || ""}
                onValueChange={(value) => handleChange("phone", value)}
                classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                }}
            />
            <Input
                label="Matrícula"
                value={formData.licenseNumber || ""}
                onValueChange={(value) => handleChange("licenseNumber", value)}
                classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                }}
            />
            <div className="">
                <p className="text-sm font-medium mb-2 text-gray-700">
                    Color en Calendario
                </p>
                <ColorPicker
                    value={formData.color}
                    onChange={(color) => handleChange("color", color)}
                />
            </div>
        </div>
    );
}
