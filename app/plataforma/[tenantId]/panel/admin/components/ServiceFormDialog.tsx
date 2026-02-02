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

export interface ServiceFormData {
  name: string;
  description: string;
  durationMinutes: number;
  marginMinutes: number;
  price: number;
  seniaPercent: number;
}

interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  mode: "create" | "edit" | "view";
  initialData?: {
    id?: string;
    name?: string;
    description?: string | null;
    durationMinutes?: number;
    marginMinutes?: number;
    price?: number;
    seniaPercent?: number;
  };
  loading?: boolean;
}

export function ServiceFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialData,
  loading = false,
}: ServiceFormDialogProps) {
  const [formData, setFormData] = React.useState<ServiceFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    durationMinutes: initialData?.durationMinutes ?? 60,
    marginMinutes: initialData?.marginMinutes ?? 0,
    price: initialData?.price ?? 0,
    seniaPercent: initialData?.seniaPercent ?? 0,
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof ServiceFormData, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        durationMinutes: initialData?.durationMinutes ?? 60,
        marginMinutes: initialData?.marginMinutes ?? 0,
        price: initialData?.price ?? 0,
        seniaPercent: initialData?.seniaPercent ?? 0,
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ServiceFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (formData.durationMinutes < 1) newErrors.durationMinutes = "Debe ser al menos 1 minuto";
    if (formData.marginMinutes < 0) newErrors.marginMinutes = "No puede ser negativo";
    if (formData.price < 0) newErrors.price = "No puede ser negativo";
    if (formData.seniaPercent < 0 || formData.seniaPercent > 100)
      newErrors.seniaPercent = "Debe estar entre 0 y 100";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || "",
        durationMinutes: formData.durationMinutes,
        marginMinutes: formData.marginMinutes,
        price: formData.price,
        seniaPercent: formData.seniaPercent,
      });
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  const isView = mode === "view";

  return (
    <Modal isOpen={open} onClose={onClose} size="md" classNames={{ wrapper: "z-[99999]" }}>
      <ModalContent>
        <form onSubmit={isView ? (e) => { e.preventDefault(); onClose(); } : handleSubmit}>
          <ModalHeader className="text-slate-800">
            {mode === "create" ? "Crear servicio" : mode === "view" ? "Ver servicio" : "Editar servicio"}
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
                onValueChange={(v) => setFormData((p) => ({ ...p, name: v }))}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
                isRequired={!isView}
                isDisabled={loading || isView}
                autoComplete="off"
                classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
              />
              <Textarea
                label="Descripción"
                value={formData.description}
                onValueChange={(v) => setFormData((p) => ({ ...p, description: v }))}
                isDisabled={loading || isView}
                minRows={2}
                classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
              />
              <Input
                type="number"
                label="Duración del turno (minutos)"
                value={String(formData.durationMinutes)}
                onValueChange={(v) => setFormData((p) => ({ ...p, durationMinutes: parseInt(v, 10) || 0 }))}
                isInvalid={!!errors.durationMinutes}
                errorMessage={errors.durationMinutes}
                min={1}
                isDisabled={loading || isView}
                classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
              />
              <Input
                type="number"
                label="Margen de tiempo (minutos)"
                value={String(formData.marginMinutes)}
                onValueChange={(v) => setFormData((p) => ({ ...p, marginMinutes: parseInt(v, 10) || 0 }))}
                isInvalid={!!errors.marginMinutes}
                errorMessage={errors.marginMinutes}
                min={0}
                isDisabled={loading || isView}
                classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
              />
              <Input
                type="number"
                label="Precio"
                value={String(formData.price)}
                onValueChange={(v) => setFormData((p) => ({ ...p, price: parseFloat(v) || 0 }))}
                isInvalid={!!errors.price}
                errorMessage={errors.price}
                min={0}
                step={0.01}
                isDisabled={loading || isView}
                classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
              />
              <Input
                type="number"
                label="% de seña"
                value={String(formData.seniaPercent)}
                onValueChange={(v) => setFormData((p) => ({ ...p, seniaPercent: parseFloat(v) || 0 }))}
                isInvalid={!!errors.seniaPercent}
                errorMessage={errors.seniaPercent}
                min={0}
                max={100}
                step={0.01}
                isDisabled={loading || isView}
                classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} isDisabled={loading}>
              {isView ? "Cerrar" : "Cancelar"}
            </Button>
            {!isView && (
              <Button type="submit" color="primary" isDisabled={loading} isLoading={loading}>
                {mode === "create" ? "Crear" : "Guardar"}
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
