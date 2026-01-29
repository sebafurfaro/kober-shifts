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
  Alert,
  Chip,
  Checkbox,
} from "@heroui/react";
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


  return (
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      size="md" 
      scrollBehavior="inside"
      classNames={{
        wrapper: "z-[99999]"
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {mode === "create"
              ? `Crear ${userType === "professional" ? "Profesional" : "Paciente"}`
              : `Editar ${userType === "professional" ? "Profesional" : "Paciente"}`}
          </ModalHeader>
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
                autoComplete="off"
                classNames={{
                  input: "text-slate-800",
                  inputWrapper: "text-slate-800",
                }}
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
                classNames={{
                  input: "text-slate-800",
                  inputWrapper: "text-slate-800",
                }}
              />

              {userType === "professional" && (
                <>
                  <Select
                    label="Especialidades"
                    selectionMode="multiple"
                    selectedKeys={formData.specialtyIds || []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys) as string[];
                      setFormData((prev) => ({ ...prev, specialtyIds: selected }));
                      if (errors.specialtyIds) {
                        setErrors((prev) => ({ ...prev, specialtyIds: undefined }));
                      }
                      setSubmitError(null);
                    }}
                    isInvalid={!!errors.specialtyIds}
                    errorMessage={errors.specialtyIds}
                    isRequired
                    isDisabled={loading}
                    classNames={{
                      value: "text-slate-800",
                      popoverContent: "text-slate-800",
                    }}
                  >
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty.id} value={specialty.id} className="text-slate-800">
                        {specialty.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <div>
                    <p className="text-sm font-medium mb-2 text-gray-700">
                      Color para Calendario
                    </p>
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
                      <p className="text-xs text-danger mt-1">{errors.color}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Color que se usará para los turnos de este profesional en el calendario
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 text-gray-700">
                      Días Disponibles
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: 1, label: "Lunes" },
                        { value: 2, label: "Martes" },
                        { value: 3, label: "Miércoles" },
                        { value: 4, label: "Jueves" },
                        { value: 5, label: "Viernes" },
                        { value: 6, label: "Sábado" },
                        { value: 0, label: "Domingo" },
                      ].map((day) => (
                        <Checkbox
                          key={day.value}
                          isSelected={formData.availableDays?.includes(day.value) || false}
                          onValueChange={(checked) => {
                            const currentDays = formData.availableDays || [];
                            const newDays = checked
                              ? [...currentDays, day.value]
                              : currentDays.filter((d) => d !== day.value);
                            setFormData((prev) => ({ ...prev, availableDays: newDays }));
                          }}
                          isDisabled={loading}
                        >
                          {day.label}
                        </Checkbox>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona los días de la semana en que el profesional está disponible
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 text-gray-700">
                      Horarios Disponibles
                    </p>
                    <div className="flex gap-3">
                      <Input
                        label="Hora Inicio"
                        type="time"
                        value={formData.availableHours?.start || "09:00"}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            availableHours: {
                              start: value,
                              end: prev.availableHours?.end || "18:00",
                            },
                          }));
                        }}
                        isDisabled={loading}
                        className="flex-1"
                        classNames={{
                          input: "text-slate-800",
                          inputWrapper: "text-slate-800",
                        }}
                      />
                      <Input
                        label="Hora Fin"
                        type="time"
                        value={formData.availableHours?.end || "18:00"}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            availableHours: {
                              start: prev.availableHours?.start || "09:00",
                              end: value,
                            },
                          }));
                        }}
                        isDisabled={loading}
                        className="flex-1"
                        classNames={{
                          input: "text-slate-800",
                          inputWrapper: "text-slate-800",
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Define el rango horario de disponibilidad del profesional
                    </p>
                  </div>

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
                    classNames={{
                      input: "text-slate-800",
                      inputWrapper: "text-slate-800",
                    }}
                  />
                </>
              )}
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

