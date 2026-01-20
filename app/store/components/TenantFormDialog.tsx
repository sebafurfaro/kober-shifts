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
  Typography,
} from "@mui/material";

interface TenantFormData {
  name: string;
  id?: string;
  logoUrl?: string;
}

interface TenantFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TenantFormData) => Promise<void>;
  loading?: boolean;
}

export function TenantFormDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
}: TenantFormDialogProps) {
  const [formData, setFormData] = React.useState<TenantFormData>({
    name: "",
    id: "",
    logoUrl: "",
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof TenantFormData, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        id: "",
        logoUrl: "",
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TenantFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (formData.id && !/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = "El ID solo puede contener letras minúsculas, números y guiones";
    }

    if (formData.logoUrl && formData.logoUrl.trim() && !/^https?:\/\/.+/.test(formData.logoUrl.trim())) {
      newErrors.logoUrl = "Debe ser una URL válida (http:// o https://)";
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
      const submitData: TenantFormData = {
        name: formData.name.trim(),
        id: formData.id?.trim() || undefined,
        logoUrl: formData.logoUrl?.trim() || undefined,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      setSubmitError(error?.message || "Error al guardar");
    }
  };

  const handleChange = (field: keyof TenantFormData) => (
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
        <DialogTitle>Crear Tenant</DialogTitle>
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
              autoFocus
              autoComplete="off"
            />

            <Box>
              <TextField
                label="ID (Opcional)"
                value={formData.id}
                onChange={handleChange("id")}
                error={!!errors.id}
                helperText={errors.id || "Si no se especifica, se generará automáticamente desde el nombre"}
                disabled={loading}
                fullWidth
                autoComplete="off"
                placeholder="ej: mi-tenant"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                Solo letras minúsculas, números y guiones
              </Typography>
            </Box>

            <TextField
              label="Logo URL (Opcional)"
              value={formData.logoUrl}
              onChange={handleChange("logoUrl")}
              error={!!errors.logoUrl}
              helperText={errors.logoUrl || "URL de la imagen del logo del tenant"}
              disabled={loading}
              fullWidth
              autoComplete="off"
              placeholder="https://ejemplo.com/logo.png"
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
            {loading ? "Creando..." : "Crear"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
