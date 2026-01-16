"use client";

import * as React from "react";
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Stack,
    Paper,
    IconButton,
    Grid,
    TextField,
    Select,
    MenuItem,
    Button,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import { AvailabilityConfig, Slot } from "./types";

interface AvailabilityTabProps {
    availabilityConfig: AvailabilityConfig;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const DAYS_NAMES = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" },
];

export function AvailabilityTab({ availabilityConfig, setFormData }: AvailabilityTabProps) {
    const addSlot = (dayNum: number) => {
        const newSlot: Slot = {
            id: Math.random().toString(36).substr(2, 9),
            startTime: "09:00",
            endTime: "18:00",
            fromDate: new Date().toISOString().split("T")[0],
            toDate: null,
            repeat: "weekly",
        };

        setFormData((prev: any) => {
            const dayConfig = prev.availabilityConfig.days[dayNum] || { slots: [] };
            return {
                ...prev,
                availabilityConfig: {
                    ...prev.availabilityConfig,
                    days: {
                        ...prev.availabilityConfig.days,
                        [dayNum]: {
                            ...dayConfig,
                            slots: [...dayConfig.slots, newSlot],
                        },
                    },
                },
            };
        });
    };

    const updateSlot = (dayNum: number, slotId: string, updates: Partial<Slot>) => {
        setFormData((prev: any) => {
            const dayConfig = prev.availabilityConfig.days[dayNum];
            return {
                ...prev,
                availabilityConfig: {
                    ...prev.availabilityConfig,
                    days: {
                        ...prev.availabilityConfig.days,
                        [dayNum]: {
                            ...dayConfig,
                            slots: dayConfig.slots.map((s: Slot) => (s.id === slotId ? { ...s, ...updates } : s)),
                        },
                    },
                },
            };
        });
    };

    const removeSlot = (dayNum: number, slotId: string) => {
        setFormData((prev: any) => {
            const dayConfig = prev.availabilityConfig.days[dayNum];
            return {
                ...prev,
                availabilityConfig: {
                    ...prev.availabilityConfig,
                    days: {
                        ...prev.availabilityConfig.days,
                        [dayNum]: {
                            ...dayConfig,
                            slots: dayConfig.slots.filter((s: Slot) => s.id !== slotId),
                        },
                    },
                },
            };
        });
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Configuración de Horarios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configura los rangos horarios para cada día. Si la fecha de fin queda vacía, se considera recurrente indefinidamente.
            </Typography>

            {DAYS_NAMES.map((day) => {
                const dayConfig = availabilityConfig.days[day.value] || { slots: [] };
                return (
                    <Accordion key={day.value} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>{day.label}</Typography>
                            <Chip
                                label={`${dayConfig.slots.length} turnos`}
                                size="small"
                                color={dayConfig.slots.length > 0 ? "primary" : "default"}
                                variant="outlined"
                            />
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                {dayConfig.slots.map((slot: Slot) => (
                                    <Paper
                                        key={slot.id}
                                        variant="outlined"
                                        sx={{ p: 2, position: "relative" }}
                                    >
                                        <IconButton
                                            size="small"
                                            color="error"
                                            sx={{ position: "absolute", top: 8, right: 8 }}
                                            onClick={() => removeSlot(day.value, slot.id)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Desde fecha"
                                                    type="date"
                                                    size="small"
                                                    value={slot.fromDate}
                                                    onChange={(e) =>
                                                        updateSlot(day.value, slot.id, { fromDate: e.target.value })
                                                    }
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Hasta fecha"
                                                    type="date"
                                                    size="small"
                                                    value={slot.toDate || ""}
                                                    onChange={(e) =>
                                                        updateSlot(day.value, slot.id, { toDate: e.target.value || null })
                                                    }
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Inicio"
                                                    type="time"
                                                    size="small"
                                                    value={slot.startTime}
                                                    onChange={(e) =>
                                                        updateSlot(day.value, slot.id, { startTime: e.target.value })
                                                    }
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={2}>
                                                <TextField
                                                    fullWidth
                                                    label="Fin"
                                                    type="time"
                                                    size="small"
                                                    value={slot.endTime}
                                                    onChange={(e) =>
                                                        updateSlot(day.value, slot.id, { endTime: e.target.value })
                                                    }
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={2}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    value={slot.repeat}
                                                    onChange={(e) =>
                                                        updateSlot(day.value, slot.id, {
                                                            repeat: e.target.value as any,
                                                        })
                                                    }
                                                >
                                                    <MenuItem value="weekly">Semanal</MenuItem>
                                                    <MenuItem value="biweekly">Quincenal</MenuItem>
                                                    <MenuItem value="monthly">Mensual</MenuItem>
                                                </Select>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                                <Button
                                    startIcon={<AddIcon />}
                                    variant="text"
                                    onClick={() => addSlot(day.value)}
                                >
                                    Añadir Franja Horaria
                                </Button>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Box>
    );
}
