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
  Grid,
} from "@mui/material";
import { format, differenceInYears, parseISO } from "date-fns";

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  admissionDate: string;
  gender: string;
  nationality: string;
  tempPassword?: string;
}

interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PatientFormData) => Promise<void>;
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
    phone?: string | null;
    address?: string | null;
    dateOfBirth?: Date | string | null;
    admissionDate?: Date | string | null;
    gender?: string | null;
    nationality?: string | null;
  };
  loading?: boolean;
}

export function PatientFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialData,
  loading = false,
}: PatientFormDialogProps) {
  const [formData, setFormData] = React.useState<PatientFormData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    dateOfBirth: initialData?.dateOfBirth
      ? typeof initialData.dateOfBirth === "string"
        ? initialData.dateOfBirth.split("T")[0]
        : format(new Date(initialData.dateOfBirth), "yyyy-MM-dd")
      : "",
    admissionDate: initialData?.admissionDate
      ? typeof initialData.admissionDate === "string"
        ? initialData.admissionDate.split("T")[0]
        : format(new Date(initialData.admissionDate), "yyyy-MM-dd")
      : "",
    gender: initialData?.gender || "",
    nationality: initialData?.nationality || "",
    tempPassword: "",
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof PatientFormData, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Calculate age from date of birth
  const age = React.useMemo(() => {
    if (!formData.dateOfBirth) return null;
    try {
      const birthDate = parseISO(formData.dateOfBirth);
      return differenceInYears(new Date(), birthDate);
    } catch {
      return null;
    }
  }, [formData.dateOfBirth]);

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        address: initialData?.address || "",
        dateOfBirth: initialData?.dateOfBirth
          ? typeof initialData.dateOfBirth === "string"
            ? initialData.dateOfBirth.split("T")[0]
            : format(new Date(initialData.dateOfBirth), "yyyy-MM-dd")
          : "",
        admissionDate: initialData?.admissionDate
          ? typeof initialData.admissionDate === "string"
            ? initialData.admissionDate.split("T")[0]
            : format(new Date(initialData.admissionDate), "yyyy-MM-dd")
          : "",
        gender: initialData?.gender || "",
        nationality: initialData?.nationality || "",
        tempPassword: "",
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PatientFormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "El formato del email no es válido";
      }
    }

    if (mode === "create" && !formData.tempPassword) {
      newErrors.tempPassword = "La contraseña temporal es requerida";
    } else if (mode === "edit" && formData.tempPassword && formData.tempPassword.length < 6) {
      newErrors.tempPassword = "La contraseña debe tener al menos 6 caracteres";
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
      const submitData: PatientFormData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || "",
        address: formData.address.trim() || "",
        dateOfBirth: formData.dateOfBirth || "",
        admissionDate: formData.admissionDate || "",
        gender: formData.gender || "",
        nationality: formData.nationality.trim() || "",
        ...(formData.tempPassword ? { tempPassword: formData.tempPassword } : {}),
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      setSubmitError(error?.message || "Error al guardar");
    }
  };

  const handleChange = (field: keyof PatientFormData) => (
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === "create" ? "Crear Paciente" : "Editar Paciente"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  value={formData.firstName}
                  onChange={handleChange("firstName")}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  required
                  disabled={loading}
                  fullWidth
                  autoComplete="off"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Apellido"
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  required
                  disabled={loading}
                  fullWidth
                  autoComplete="off"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
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
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teléfono"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  disabled={loading}
                  fullWidth
                  autoComplete="off"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Dirección"
                  value={formData.address}
                  onChange={handleChange("address")}
                  error={!!errors.address}
                  helperText={errors.address}
                  disabled={loading}
                  fullWidth
                  multiline
                  rows={2}
                  autoComplete="off"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Nacimiento"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange("dateOfBirth")}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth || (age !== null ? `Edad: ${age} años` : "")}
                  disabled={loading}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  autoComplete="off"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Ingreso"
                  type="date"
                  value={formData.admissionDate}
                  onChange={handleChange("admissionDate")}
                  error={!!errors.admissionDate}
                  helperText={errors.admissionDate}
                  disabled={loading}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: "1900-01-01",
                    max: new Date().toISOString().split("T")[0],
                  }}
                  autoComplete="off"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Género"
                  value={formData.gender}
                  onChange={handleChange("gender")}
                  error={!!errors.gender}
                  helperText={errors.gender}
                  disabled={loading}
                  fullWidth
                  autoComplete="off"
                >
                  <MenuItem value="">Seleccionar...</MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="No binario">No binario</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nacionalidad"
                  value={formData.nationality}
                  onChange={handleChange("nationality")}
                  error={!!errors.nationality}
                  helperText={errors.nationality}
                  disabled={loading}
                  fullWidth
                  autoComplete="off"
                />
              </Grid>

              <Grid item xs={12}>
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
              </Grid>
            </Grid>
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

