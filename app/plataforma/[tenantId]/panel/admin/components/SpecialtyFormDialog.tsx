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

interface SpecialtyFormData {
  name: string;
}

interface SpecialtyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SpecialtyFormData) => Promise<void>;
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    name?: string;
  };
  loading?: boolean;
}

export function SpecialtyFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialData,
  loading = false,
}: SpecialtyFormDialogProps) {
  const [formData, setFormData] = React.useState<SpecialtyFormData>({
    name: initialData?.name || "",
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof SpecialtyFormData, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: initialData?.name || "",
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SpecialtyFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
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
      const submitData: SpecialtyFormData = {
        name: formData.name.trim(),
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
          <ModalHeader className="text-slate-800">
            {mode === "create" ? "Crear Especialidad" : "Editar Especialidad"}
          </ModalHeader>
          <ModalBody className="text-slate-800">
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

