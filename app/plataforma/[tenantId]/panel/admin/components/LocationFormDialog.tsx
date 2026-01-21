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
  Textarea,
  Alert,
} from "@heroui/react";

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


  return (
    <Modal isOpen={open} onClose={onClose} size="md">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {mode === "create" ? "Crear Sede" : "Editar Sede"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {submitError && (
                <Alert color="danger" onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              )}

              <Input
                label="Nombre del Centro"
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

              <Textarea
                label="Dirección"
                value={formData.address}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, address: value }));
                  if (errors.address) {
                    setErrors((prev) => ({ ...prev, address: undefined }));
                  }
                  setSubmitError(null);
                }}
                isInvalid={!!errors.address}
                errorMessage={errors.address}
                isRequired
                isDisabled={loading}
                minRows={2}
                autoComplete="off"
              />

              <Input
                label="Teléfono"
                value={formData.phone}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, phone: value }));
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                  setSubmitError(null);
                }}
                isInvalid={!!errors.phone}
                errorMessage={errors.phone || "Opcional"}
                isDisabled={loading}
                autoComplete="off"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
              isDisabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              isDisabled={loading}
              isLoading={loading}
            >
              {loading ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

