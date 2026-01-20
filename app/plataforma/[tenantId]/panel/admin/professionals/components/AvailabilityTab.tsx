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
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { Theme } from "@mui/material/styles";
import { AvailabilityConfig, Slot } from "./types";

const FIELD_STYLE = {
  "& .MuiInputBase-input::-webkit-calendar-picker-indicator": {
    filter: "invert(39%) sepia(51%) saturate(2878%) hue-rotate(190deg) brightness(101%) contrast(101%)",
    cursor: "pointer",
  },
};

interface AvailabilityTabProps {
  availabilityConfig: AvailabilityConfig;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSave?: () => void;
  loading?: boolean;
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

export function AvailabilityTab({ availabilityConfig, setFormData, onSave, loading }: AvailabilityTabProps) {
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
        const hasSlots = dayConfig.slots.length > 0;

        return (
          <Accordion
            key={day.value}
            sx={{
              mb: 1,
              backgroundColor: hasSlots ? "white" : "#fafafa",
              border: "1px solid",
              borderColor: hasSlots ? "divider" : "transparent",
              "&:before": { display: "none" }
            }}
            elevation={0}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ flexGrow: 1, fontWeight: 600, color: hasSlots ? "text.primary" : "text.secondary" }}>
                {day.label}
              </Typography>
              <Chip
                label={hasSlots ? `${dayConfig.slots.length} ${dayConfig.slots.length === 1 ? 'franja' : 'franjas'}` : "No atiende"}
                size="small"
                color={hasSlots ? "primary" : "default"}
                variant={hasSlots ? "filled" : "outlined"}
                sx={{ fontWeight: 600 }}
              />
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2, pt: 0 }}>
              <Stack spacing={2}>
                {hasSlots ? (
                  dayConfig.slots.map((slot: Slot) => (
                    <Paper
                      key={slot.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        position: "relative",
                        bgcolor: "white",
                        borderRadius: 2,
                        borderColor: "divider"
                      }}
                    >
                      <Grid container spacing={3}>
                        {/* Columna Izquierda: Horarios y Fecha Inicio */}
                        <Grid item xs={12} sm={6}>
                          <Stack spacing={2}>
                            {/* Grupo 1: startTime - endTime */}
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                Horario de Atención
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2 }}>
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
                                  sx={FIELD_STYLE}
                                />
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
                                  sx={FIELD_STYLE}
                                />
                              </Box>
                            </Box>
                            {/* Grupo 2: fromDate */}
                            <TextField
                              fullWidth
                              label="Vigente desde"
                              type="date"
                              size="small"
                              value={slot.fromDate}
                              onChange={(e) =>
                                updateSlot(day.value, slot.id, { fromDate: e.target.value })
                              }
                              InputLabelProps={{ shrink: true }}
                              sx={FIELD_STYLE}
                            />
                          </Stack>
                        </Grid>

                        {/* Columna Derecha: Recurrencia y Fecha Fin */}
                        <Grid item xs={12} sm={6}>
                          <Stack spacing={2}>
                            {/* Grupo 3: repeat */}
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                Recurrencia
                              </Typography>
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
                            </Box>
                            {/* Grupo 4: toDate */}
                            <TextField
                              fullWidth
                              label="Vigente hasta (opcional)"
                              type="date"
                              size="small"
                              value={slot.toDate || ""}
                              onChange={(e) =>
                                updateSlot(day.value, slot.id, { toDate: e.target.value || null })
                              }
                              InputLabelProps={{ shrink: true }}
                              sx={FIELD_STYLE}
                            />
                          </Stack>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          color="primary"
                          variant="text"
                          onClick={() => removeSlot(day.value, slot.id)}
                        >
                          Eliminar
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          onClick={() => onSave?.()}
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                          {loading ? "Guardando..." : "Guardar Franja"}
                        </Button>
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Box sx={{ py: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay franjas horarias configuradas para este día. El profesional no figurará disponible para atención.
                    </Typography>
                  </Box>
                )}
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={() => addSlot(day.value)}
                  sx={{
                    borderStyle: "dashed",
                    py: 1,
                    "&:hover": { borderStyle: "dashed" }
                  }}
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
