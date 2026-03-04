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
  Divider,
} from "@heroui/react";

export interface TenantFormFeatures {
  show_coverage: boolean;
  show_mercado_pago: boolean;
  calendar: boolean;
  payment_enabled: boolean;
}

export interface TenantFormLimits {
  maxUsers: number;
  whatsappRemindersLimit: number;
}

interface TenantFormData {
  name: string;
  id?: string;
  logoUrl?: string;
  features?: TenantFormFeatures;
  limits?: TenantFormLimits;
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
    features: {
      show_coverage: true,
      show_mercado_pago: true,
      calendar: true,
      payment_enabled: true,
    },
    limits: {
      maxUsers: 1,
      whatsappRemindersLimit: 0,
    },
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof TenantFormData, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        id: "",
        logoUrl: "",
        features: {
          show_coverage: true,
          show_mercado_pago: true,
          calendar: true,
          payment_enabled: true,
        },
        limits: {
          maxUsers: 1,
          whatsappRemindersLimit: 0,
        },
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

    const maxUsers = formData.limits?.maxUsers ?? 1;
    const whatsapp = formData.limits?.whatsappRemindersLimit ?? 0;
    if (
      typeof maxUsers !== "number" ||
      maxUsers < 0 ||
      !Number.isInteger(maxUsers) ||
      typeof whatsapp !== "number" ||
      whatsapp < 0 ||
      !Number.isInteger(whatsapp)
    ) {
      newErrors.limits = "Los límites deben ser números enteros ≥ 0";
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
        features: formData.features,
        limits: formData.limits,
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
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      size="md" 
      scrollBehavior="inside"
      classNames={{
        wrapper: "z-[99999]"
      }}
    >
      <ModalContent className="text-slate-800">
        <form onSubmit={handleSubmit}>
          <ModalHeader>Añadir nuevo Tenant</ModalHeader>
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
                classNames={{
                  input: "text-slate-800",
                  inputWrapper: "text-slate-800",
                }}
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
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>

              <Divider className="my-2" />

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Límites por tenant</h3>
                {errors.limits && (
                  <p className="text-sm text-danger mb-2">{errors.limits}</p>
                )}
                <div className="flex flex-col gap-3">
                  <Input
                    type="number"
                    label="Cantidad máxima de usuarios/profesionales"
                    value={String(formData.limits?.maxUsers ?? 1)}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        limits: {
                          ...prev.limits!,
                          maxUsers: parseInt(value, 10) || 0,
                        },
                      }))
                    }
                    min={0}
                    step={1}
                    isDisabled={loading}
                    classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
                  />
                  <Input
                    type="number"
                    label="Recordatorios WhatsApp disponibles"
                    value={String(formData.limits?.whatsappRemindersLimit ?? 0)}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        limits: {
                          ...prev.limits!,
                          whatsappRemindersLimit: parseInt(value, 10) || 0,
                        },
                      }))
                    }
                    min={0}
                    step={1}
                    isDisabled={loading}
                    classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
                  />
                </div>
              </div>

              <Divider className="my-2" />

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Feature flags</h3>
                <div className="space-y-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Mostrar coberturas</span>
                    <Button
                      variant={formData.features?.show_coverage ?? true ? "solid" : "bordered"}
                      color={
                        formData.features?.show_coverage ?? true
                          ? "success"
                          : ("info" as "primary")
                      }
                      isDisabled={loading}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features!,
                            show_coverage: !(prev.features?.show_coverage ?? true),
                          },
                        }))
                      }
                    >
                      {formData.features?.show_coverage ?? true ? "Habilitado" : "Deshabilitado"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Mostrar Mercado Pago</span>
                    <Button
                      variant={formData.features?.show_mercado_pago ?? true ? "solid" : "bordered"}
                      color={
                        formData.features?.show_mercado_pago ?? true
                          ? "success"
                          : ("info" as "primary")
                      }
                      isDisabled={loading}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features!,
                            show_mercado_pago: !(prev.features?.show_mercado_pago ?? true),
                          },
                        }))
                      }
                    >
                      {formData.features?.show_mercado_pago ?? true ? "Habilitado" : "Deshabilitado"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Mostrar calendario</span>
                    <Button
                      variant={formData.features?.calendar ?? true ? "solid" : "bordered"}
                      color={
                        formData.features?.calendar ?? true
                          ? "success"
                          : ("info" as "primary")
                      }
                      isDisabled={loading}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features!,
                            calendar: !(prev.features?.calendar ?? true),
                          },
                        }))
                      }
                    >
                      {formData.features?.calendar ?? true ? "Habilitado" : "Deshabilitado"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Habilitar tenant</span>
                    <Button
                      variant={formData.features?.payment_enabled ?? true ? "solid" : "bordered"}
                      color={
                        formData.features?.payment_enabled ?? true
                          ? "success"
                          : ("info" as "primary")
                      }
                      isDisabled={loading}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features!,
                            payment_enabled: !(prev.features?.payment_enabled ?? true),
                          },
                        }))
                      }
                    >
                      {formData.features?.payment_enabled ?? true ? "Habilitado" : "Deshabilitado"}
                    </Button>
                  </div>
                </div>
              </div>
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
