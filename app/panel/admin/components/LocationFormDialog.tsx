"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";

interface LocationFormData {
  name: string;
  address: string;
  phone: string;
}

interface LocationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => Promise<void>;
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    name?: string;
    address?: string;
    phone?: string | null;
  };
  loading?: boolean;
}

export function LocationFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialData,
  loading = false,
}: LocationFormDialogProps) {
  const [formData, setFormData] = React.useState<LocationFormData>({
    name: initialData?.name || "",
    address: initialData?.address || "",
    phone: initialData?.phone || "",
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof LocationFormData, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: initialData?.name || "",
        address: initialData?.address || "",
        phone: initialData?.phone || "",
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LocationFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre del centro es requerido";
    }

    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida";
    }

    // Phone is optional, but if provided, validate format
    if (formData.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.phone.trim())) {
      newErrors.phone = "El formato del teléfono no es válido";
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
      const submitData: LocationFormData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim() || "",
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      setSubmitError(error?.message || "Error al guardar");
    }
  };

  const handleChange = (field: keyof LocationFormData) => (
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === "create" ? "Crear Sede" : "Editar Sede"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <TextField
              label="Nombre del Centro"
              value={formData.name}
              onChange={handleChange("name")}
              error={!!errors.name}
              helperText={errors.name}
              required
              disabled={loading}
              fullWidth
              autoFocus
              autoComplete="off"
            />

            <TextField
              label="Dirección"
              value={formData.address}
              onChange={handleChange("address")}
              error={!!errors.address}
              helperText={errors.address}
              required
              disabled={loading}
              fullWidth
              multiline
              rows={2}
              autoComplete="off"
            />

            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={handleChange("phone")}
              error={!!errors.phone}
              helperText={errors.phone || "Opcional"}
              disabled={loading}
              fullWidth
              autoComplete="off"
            />
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

