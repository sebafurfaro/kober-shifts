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
  street: string;
  streetNumber: string;
  floor: string;
  apartment: string;
  postalCode: string;
  country: string;
  province: string;
  neighborhood: string;
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
    street?: string | null;
    streetNumber?: string | null;
    floor?: string | null;
    apartment?: string | null;
    postalCode?: string | null;
    country?: string | null;
    province?: string | null;
    neighborhood?: string | null;
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
    street: initialData?.street || "",
    streetNumber: initialData?.streetNumber || "",
    floor: initialData?.floor || "",
    apartment: initialData?.apartment || "",
    postalCode: initialData?.postalCode || "",
    country: initialData?.country || "",
    province: initialData?.province || "",
    neighborhood: initialData?.neighborhood || "",
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
        street: initialData?.street || "",
        streetNumber: initialData?.streetNumber || "",
        floor: initialData?.floor || "",
        apartment: initialData?.apartment || "",
        postalCode: initialData?.postalCode || "",
        country: initialData?.country || "",
        province: initialData?.province || "",
        neighborhood: initialData?.neighborhood || "",
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

    if (!formData.street.trim()) {
      newErrors.street = "La calle es requerida";
    }

    if (!formData.streetNumber.trim()) {
      newErrors.streetNumber = "La altura es requerida";
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "El código postal es requerido";
    }

    if (!formData.country.trim()) {
      newErrors.country = "El país es requerido";
    }

    if (!formData.province.trim()) {
      newErrors.province = "La provincia es requerida";
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
      // Construir la dirección completa para mantener compatibilidad
      const addressParts = [
        formData.street.trim(),
        formData.streetNumber.trim(),
        formData.floor.trim() ? `Piso ${formData.floor.trim()}` : "",
        formData.apartment.trim() ? `Depto ${formData.apartment.trim()}` : "",
        formData.neighborhood.trim(),
        formData.postalCode.trim(),
        formData.province.trim(),
        formData.country.trim(),
      ].filter(Boolean);

      const submitData: LocationFormData = {
        name: formData.name.trim(),
        address: addressParts.join(", "),
        street: formData.street.trim(),
        streetNumber: formData.streetNumber.trim(),
        floor: formData.floor.trim(),
        apartment: formData.apartment.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        province: formData.province.trim(),
        neighborhood: formData.neighborhood.trim(),
        phone: formData.phone.trim() || "",
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      setSubmitError(error?.message || "Error al guardar");
    }
  };


  return (
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      size="lg"
      classNames={{
        wrapper: "z-[99999]"
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="text-slate-800">
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
                classNames={{
                  input: "text-slate-800",
                  inputWrapper: "text-slate-800",
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Calle"
                  value={formData.street}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, street: value }));
                    if (errors.street) {
                      setErrors((prev) => ({ ...prev, street: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.street}
                  errorMessage={errors.street}
                  isRequired
                  isDisabled={loading}
                  autoComplete="street-address"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
                <Input
                  label="Altura"
                  value={formData.streetNumber}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, streetNumber: value }));
                    if (errors.streetNumber) {
                      setErrors((prev) => ({ ...prev, streetNumber: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.streetNumber}
                  errorMessage={errors.streetNumber}
                  isRequired
                  isDisabled={loading}
                  autoComplete="off"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Piso (opcional)"
                  value={formData.floor}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, floor: value }));
                    setSubmitError(null);
                  }}
                  isDisabled={loading}
                  autoComplete="off"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
                <Input
                  label="Depto (opcional)"
                  value={formData.apartment}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, apartment: value }));
                    setSubmitError(null);
                  }}
                  isDisabled={loading}
                  autoComplete="off"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código Postal"
                  value={formData.postalCode}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, postalCode: value }));
                    if (errors.postalCode) {
                      setErrors((prev) => ({ ...prev, postalCode: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.postalCode}
                  errorMessage={errors.postalCode}
                  isRequired
                  isDisabled={loading}
                  autoComplete="postal-code"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
                <Input
                  label="Barrio"
                  value={formData.neighborhood}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, neighborhood: value }));
                    setSubmitError(null);
                  }}
                  isDisabled={loading}
                  autoComplete="off"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="País"
                  value={formData.country}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, country: value }));
                    if (errors.country) {
                      setErrors((prev) => ({ ...prev, country: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.country}
                  errorMessage={errors.country}
                  isRequired
                  isDisabled={loading}
                  autoComplete="country"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
                <Input
                  label="Provincia"
                  value={formData.province}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, province: value }));
                    if (errors.province) {
                      setErrors((prev) => ({ ...prev, province: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.province}
                  errorMessage={errors.province}
                  isRequired
                  isDisabled={loading}
                  autoComplete="address-level1"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
              </div>

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
                classNames={{
                  input: "text-slate-800",
                  inputWrapper: "text-slate-800",
                }}
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

