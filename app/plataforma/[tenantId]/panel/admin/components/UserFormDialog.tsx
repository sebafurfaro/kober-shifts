"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  OutlinedInput,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
} from "@mui/material";
import { ColorPicker } from "./ColorPicker";

interface UserFormData {
  name: string;
  email: string;
  specialtyId?: string;
  specialtyIds?: string[];
  tempPassword?: string;
  color?: string;
  availableDays?: number[];
  availableHours?: { start: string; end: string };
}

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  mode: "create" | "edit";
  userType: "patient" | "professional";
  initialData?: {
    id?: string;
    name?: string;
    email?: string;
    specialtyId?: string;
    specialtyIds?: string[];
    color?: string | null;
    availableDays?: number[];
    availableHours?: { start: string; end: string } | null;
  };
  specialties?: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export function UserFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  userType,
  initialData,
  specialties = [],
  loading = false,
}: UserFormDialogProps) {
  const [formData, setFormData] = React.useState<UserFormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    specialtyId: initialData?.specialtyId || "",
    specialtyIds: initialData?.specialtyIds || (initialData?.specialtyId ? [initialData.specialtyId] : []),
    tempPassword: "",
    color: initialData?.color || "#2196f3",
    availableDays: initialData?.availableDays || [],
    availableHours: initialData?.availableHours || { start: "09:00", end: "18:00" },
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof UserFormData, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: initialData?.name || "",
        email: initialData?.email || "",
        specialtyId: initialData?.specialtyId || "",
        specialtyIds: initialData?.specialtyIds || (initialData?.specialtyId ? [initialData.specialtyId] : []),
        tempPassword: "",
        color: initialData?.color || "#2196f3",
        availableDays: initialData?.availableDays || [],
        availableHours: initialData?.availableHours || { start: "09:00", end: "18:00" },
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "El formato del email no es válido";
      }
    }

    if (userType === "professional") {
      if (!formData.specialtyIds || formData.specialtyIds.length === 0) {
        newErrors.specialtyIds = "Al menos una especialidad es requerida";
      }

      // Password required only on create, or if provided on edit
      if (mode === "create" && !formData.tempPassword) {
        newErrors.tempPassword = "La contraseña temporal es requerida";
      } else if (mode === "edit" && formData.tempPassword && formData.tempPassword.length < 6) {
        newErrors.tempPassword = "La contraseña debe tener al menos 6 caracteres";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitError(null);
    try {
      // Prepare data for submission
      const submitData: UserFormData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      };

      if (userType === "professional") {
        submitData.specialtyIds = formData.specialtyIds || [];
        submitData.specialtyId = formData.specialtyIds && formData.specialtyIds.length > 0 ? formData.specialtyIds[0] : "";
        submitData.color = formData.color || "#2196f3";
        submitData.availableDays = formData.availableDays && formData.availableDays.length > 0 ? formData.availableDays : undefined;
        submitData.availableHours = formData.availableHours || undefined;
        // Password required on create, optional on edit
        if (mode === "create") {
          submitData.tempPassword = formData.tempPassword || "";
        } else if (formData.tempPassword) {
          submitData.tempPassword = formData.tempPassword;
        }
      }

      await onSubmit(submitData);
      // onClose will be called by parent after successful submission
    } catch (error: any) {
      setSubmitError(error?.message || "Error al guardar");
      throw error;
    }
  };

  const handleChange = (field: keyof UserFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setSubmitError(null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm" 
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === "create"
            ? `Crear ${userType === "professional" ? "Profesional" : "Paciente"}`
            : `Editar ${userType === "professional" ? "Profesional" : "Paciente"}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <TextField
              label="Nombre"
              value={formData.name}
              onChange={handleChange("name")}
              error={!!errors.name}
              helperText={errors.name}
              required
              disabled={loading}
              fullWidth
              autoComplete="off"
            />

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              error={!!errors.email}
              helperText={mode === "edit" ? "El email no se puede modificar" : errors.email}
              required
              disabled={loading || mode === "edit"}
              fullWidth
              autoComplete="off"
            />

            {userType === "professional" && (
              <>
                <FormControl fullWidth error={!!errors.specialtyIds} required disabled={loading}>
                  <InputLabel>Especialidades</InputLabel>
                  <Select
                    multiple
                    value={formData.specialtyIds || []}
                    onChange={(e) => {
                      const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                      setFormData((prev) => ({ ...prev, specialtyIds: value }));
                      if (errors.specialtyIds) {
                        setErrors((prev) => ({ ...prev, specialtyIds: undefined }));
                      }
                      setSubmitError(null);
                    }}
                    input={<OutlinedInput label="Especialidades" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const specialty = specialties.find(s => s.id === value);
                          return (
                            <Chip key={value} label={specialty?.name || value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {specialties.map((specialty) => (
                      <MenuItem key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.specialtyIds && (
                    <FormHelperText>{errors.specialtyIds}</FormHelperText>
                  )}
                </FormControl>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Color para Calendario
                  </Typography>
                  <ColorPicker
                    value={formData.color || "#2196f3"}
                    onChange={(color) => {
                      setFormData((prev) => ({ ...prev, color }));
                      if (errors.color) {
                        setErrors((prev) => ({ ...prev, color: undefined }));
                      }
                    }}
                    disabled={loading}
                    error={!!errors.color}
                  />
                  {errors.color && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                      {errors.color}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Color que se usará para los turnos de este profesional en el calendario
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Días Disponibles
                  </Typography>
                  <FormGroup>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {[
                        { value: 1, label: "Lunes" },
                        { value: 2, label: "Martes" },
                        { value: 3, label: "Miércoles" },
                        { value: 4, label: "Jueves" },
                        { value: 5, label: "Viernes" },
                        { value: 6, label: "Sábado" },
                        { value: 0, label: "Domingo" },
                      ].map((day) => (
                        <FormControlLabel
                          key={day.value}
                          control={
                            <Checkbox
                              checked={formData.availableDays?.includes(day.value) || false}
                              onChange={(e) => {
                                const currentDays = formData.availableDays || [];
                                const newDays = e.target.checked
                                  ? [...currentDays, day.value]
                                  : currentDays.filter((d) => d !== day.value);
                                setFormData((prev) => ({ ...prev, availableDays: newDays }));
                              }}
                              disabled={loading}
                            />
                          }
                          label={day.label}
                        />
                      ))}
                    </Box>
                  </FormGroup>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Selecciona los días de la semana en que el profesional está disponible
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Horarios Disponibles
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Hora Inicio"
                      type="time"
                      value={formData.availableHours?.start || "09:00"}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          availableHours: {
                            start: e.target.value,
                            end: prev.availableHours?.end || "18:00",
                          },
                        }));
                      }}
                      disabled={loading}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      fullWidth
                    />
                    <TextField
                      label="Hora Fin"
                      type="time"
                      value={formData.availableHours?.end || "18:00"}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          availableHours: {
                            start: prev.availableHours?.start || "09:00",
                            end: e.target.value,
                          },
                        }));
                      }}
                      disabled={loading}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      fullWidth
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Define el rango horario de disponibilidad del profesional
                  </Typography>
                </Box>

                <TextField
                  label="Contraseña Temporal"
                  type="password"
                  value={formData.tempPassword}
                  onChange={handleChange("tempPassword")}
                  error={!!errors.tempPassword}
                  helperText={
                    errors.tempPassword ||
                    (mode === "edit"
                      ? "Dejar vacío para mantener la contraseña actual"
                      : "Mínimo 6 caracteres")
                  }
                  required={mode === "create"}
                  disabled={loading}
                  fullWidth
                  autoComplete="new-password"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

