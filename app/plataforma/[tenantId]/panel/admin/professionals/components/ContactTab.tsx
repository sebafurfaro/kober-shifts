"use client";

import * as React from "react";
import { Grid, TextField, Typography } from "@mui/material";
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
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Nombre y Apellido"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                    disabled={mode === "edit"}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label={mode === "create" ? "Contraseña" : "Nueva Contraseña (opcional)"}
                    type="password"
                    value={formData.tempPassword}
                    onChange={(e) => handleChange("tempPassword", e.target.value)}
                    error={!!errors.tempPassword}
                    helperText={errors.tempPassword}
                    required={mode === "create"}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Matrícula"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Color en Calendario
                </Typography>
                <ColorPicker
                    value={formData.color}
                    onChange={(color) => handleChange("color", color)}
                />
            </Grid>
        </Grid>
    );
}
