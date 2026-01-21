"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Alert,
} from "@heroui/react";

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
    <Modal isOpen={open} onClose={onClose} size="md" scrollBehavior="inside">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Crear Tenant</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {submitError && (
                <Alert color="danger" onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              )}

              <Input
                label="Nombre"
                value={formData.name}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, name: value }));
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                  setSubmitError(null);
                }}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
                isRequired
                isDisabled={loading}
                autoFocus
                autoComplete="off"
              />

              <div>
                <Input
                  label="ID (Opcional)"
                  value={formData.id || ""}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, id: value }));
                    if (errors.id) {
                      setErrors((prev) => ({ ...prev, id: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.id}
                  errorMessage={errors.id || "Si no se especifica, se generará automáticamente desde el nombre"}
                  isDisabled={loading}
                  placeholder="ej: mi-tenant"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>

              <Input
                label="Logo URL (Opcional)"
                value={formData.logoUrl || ""}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, logoUrl: value }));
                  if (errors.logoUrl) {
                    setErrors((prev) => ({ ...prev, logoUrl: undefined }));
                  }
                  setSubmitError(null);
                }}
                isInvalid={!!errors.logoUrl}
                errorMessage={errors.logoUrl || "URL de la imagen del logo del tenant"}
                isDisabled={loading}
                placeholder="https://ejemplo.com/logo.png"
                autoComplete="off"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose} isDisabled={loading} variant="light">
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              isDisabled={loading}
              isLoading={loading}
            >
              {loading ? "Creando..." : "Crear"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
