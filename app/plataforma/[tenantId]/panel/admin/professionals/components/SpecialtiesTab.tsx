"use client";

import * as React from "react";
import { Box, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, FormHelperText, Typography } from "@mui/material";
import { ProfessionalFormData, Specialty } from "./types";

interface SpecialtiesTabProps {
    formData: ProfessionalFormData;
    handleChange: (field: keyof ProfessionalFormData, value: any) => void;
    errors: Record<string, string>;
    specialties: Specialty[];
}

export function SpecialtiesTab({ formData, handleChange, errors, specialties }: SpecialtiesTabProps) {
    return (
        <Box>
            <FormControl fullWidth error={!!errors.specialtyIds}>
                <InputLabel>Especialidades</InputLabel>
                <Select
                    multiple
                    value={formData.specialtyIds}
                    onChange={(e) =>
                        handleChange(
                            "specialtyIds",
                            typeof e.target.value === "string" ? [e.target.value] : e.target.value
                        )
                    }
                    input={<OutlinedInput label="Especialidades" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {(selected as string[]).map((id) => {
                                const s = specialties.find((spec) => spec.id === id);
                                return <Chip key={id} label={s?.name || id} size="small" />;
                            })}
                        </Box>
                    )}
                >
                    {specialties.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                            {s.name}
                        </MenuItem>
                    ))}
                </Select>
                {errors.specialtyIds && <FormHelperText>{errors.specialtyIds}</FormHelperText>}
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                El profesional puede tener múltiples especialidades asignadas.
            </Typography>
        </Box>
    );
}
