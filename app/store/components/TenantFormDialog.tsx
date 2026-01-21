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
  Switch,
  Divider,
} from "@heroui/react";

interface TenantFormData {
  name: string;
  id?: string;
  logoUrl?: string;
  features?: {
    calendar: boolean;
    emailNotifications: boolean;
    whatsappNotifications: boolean;
  };
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
      calendar: true,
      emailNotifications: false,
      whatsappNotifications: false,
    },
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
        features: {
          calendar: true,
          emailNotifications: false,
          whatsappNotifications: false,
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

              <Divider className="my-2" />

              <div className="space-y-3 flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-700">Feature Flags</h3>
                
                <Switch
                  isSelected={formData.features?.calendar ?? true}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      features: {
                        ...prev.features!,
                        calendar: value,
                      },
                    }));
                  }}
                  isDisabled={loading}
                  classNames={{label: "text-slate-800"}}
                >
                  Calendario
                </Switch>

                <Switch
                  isSelected={formData.features?.emailNotifications ?? false}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      features: {
                        ...prev.features!,
                        emailNotifications: value,
                      },
                    }));
                  }}
                  isDisabled={loading}
                  classNames={{label: "text-slate-800"}}
                >
                  Notificaciones por Email
                </Switch>

                <Switch
                  isSelected={formData.features?.whatsappNotifications ?? false}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      features: {
                        ...prev.features!,
                        whatsappNotifications: value,
                      },
                    }));
                  }}
                  isDisabled={loading}
                  classNames={{label: "text-slate-800"}}
                >
                  Notificaciones por WhatsApp
                </Switch>
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
