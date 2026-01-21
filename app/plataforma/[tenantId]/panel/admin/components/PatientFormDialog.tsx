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
  Select,
  SelectItem,
  Textarea,
  Alert,
} from "@heroui/react";
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


  return (
    <Modal isOpen={open} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="text-slate-800">
            {mode === "create" ? "Crear Paciente" : "Editar Paciente"}
          </ModalHeader>
          <ModalBody className="text-slate-800">
            <div className="flex flex-col gap-4">
              {submitError && (
                <Alert color="danger" onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={formData.firstName}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, firstName: value }));
                    if (errors.firstName) {
                      setErrors((prev) => ({ ...prev, firstName: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.firstName}
                  errorMessage={errors.firstName}
                  isRequired
                  isDisabled={loading}
                  autoComplete="off"
                />
                <Input
                  label="Apellido"
                  value={formData.lastName}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, lastName: value }));
                    if (errors.lastName) {
                      setErrors((prev) => ({ ...prev, lastName: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.lastName}
                  errorMessage={errors.lastName}
                  isRequired
                  isDisabled={loading}
                  autoComplete="off"
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, email: value }));
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.email}
                  errorMessage={mode === "edit" ? "El email no se puede modificar" : errors.email}
                  isRequired
                  isDisabled={loading || mode === "edit"}
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
                  errorMessage={errors.phone}
                  isDisabled={loading}
                  autoComplete="off"
                />
                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  value={formData.dateOfBirth}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, dateOfBirth: value }));
                    if (errors.dateOfBirth) {
                      setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.dateOfBirth}
                  errorMessage={errors.dateOfBirth || (age !== null ? `Edad: ${age} años` : "")}
                  isDisabled={loading}
                  autoComplete="off"
                />
                <Input
                  label="Fecha de Ingreso"
                  type="date"
                  value={formData.admissionDate}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, admissionDate: value }));
                    if (errors.admissionDate) {
                      setErrors((prev) => ({ ...prev, admissionDate: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.admissionDate}
                  errorMessage={errors.admissionDate}
                  isDisabled={loading}
                  min="1900-01-01"
                  max={new Date().toISOString().split("T")[0]}
                  autoComplete="off"
                />
                <Select
                  label="Género"
                  selectedKeys={formData.gender ? [formData.gender] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData((prev) => ({ ...prev, gender: selected || "" }));
                    if (errors.gender) {
                      setErrors((prev) => ({ ...prev, gender: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.gender}
                  errorMessage={errors.gender}
                  isDisabled={loading}
                >
                  <SelectItem key="" value="">Seleccionar...</SelectItem>
                  <SelectItem key="Masculino" value="Masculino">Masculino</SelectItem>
                  <SelectItem key="Femenino" value="Femenino">Femenino</SelectItem>
                  <SelectItem key="No binario" value="No binario">No binario</SelectItem>
                </Select>
                <Input
                  label="Nacionalidad"
                  value={formData.nationality}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, nationality: value }));
                    if (errors.nationality) {
                      setErrors((prev) => ({ ...prev, nationality: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.nationality}
                  errorMessage={errors.nationality}
                  isDisabled={loading}
                  autoComplete="off"
                />
              </div>
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
                isDisabled={loading}
                minRows={2}
                autoComplete="off"
              />
              <Input
                label="Contraseña Temporal"
                type="password"
                value={formData.tempPassword}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, tempPassword: value }));
                  if (errors.tempPassword) {
                    setErrors((prev) => ({ ...prev, tempPassword: undefined }));
                  }
                  setSubmitError(null);
                }}
                isInvalid={!!errors.tempPassword}
                errorMessage={
                  errors.tempPassword ||
                  (mode === "edit"
                    ? "Dejar vacío para mantener la contraseña actual"
                    : "Mínimo 6 caracteres")
                }
                isRequired={mode === "create"}
                isDisabled={loading}
                autoComplete="new-password"
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
              className="button button-secondary"
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

