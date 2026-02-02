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
  Switch,
  Divider,
  Alert,
} from "@heroui/react";

export interface TenantFeatureFlags {
  show_specialties: boolean;
  show_coverage: boolean;
  show_mercado_pago: boolean;
  payment_enabled: boolean;
}

export interface TenantLimits {
  maxUsers: number;
  whatsappRemindersLimit: number;
}

export interface TenantTranslations {
  patientLabel: string;
  professionalLabel: string;
}

interface TenantConfigDialogProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  initialFeatures: TenantFeatureFlags;
  initialLimits: TenantLimits;
  onSave: (data: {
    features: TenantFeatureFlags;
    limits: TenantLimits;
    translations: TenantTranslations;
  }) => Promise<void>;
}

const defaultFeatures: TenantFeatureFlags = {
  show_specialties: true,
  show_coverage: true,
  show_mercado_pago: true,
  payment_enabled: true,
};

const defaultLimits: TenantLimits = {
  maxUsers: 1,
  whatsappRemindersLimit: 0,
};

const defaultTranslations: TenantTranslations = {
  patientLabel: "Pacientes",
  professionalLabel: "Profesionales",
};

export function TenantConfigDialog({
  open,
  onClose,
  tenantId,
  tenantName,
  initialFeatures,
  initialLimits,
  onSave,
}: TenantConfigDialogProps) {
  const resolvePaymentEnabled = (f: TenantFeatureFlags & { disabled_payment?: boolean }) =>
    f.payment_enabled ?? (typeof f.disabled_payment === "boolean" ? !f.disabled_payment : true);

  const [features, setFeatures] = React.useState<TenantFeatureFlags>(() => ({
    ...defaultFeatures,
    ...initialFeatures,
    payment_enabled: resolvePaymentEnabled(initialFeatures as TenantFeatureFlags & { disabled_payment?: boolean }),
  }));
  const [limits, setLimits] = React.useState<TenantLimits>({ ...defaultLimits, ...initialLimits });
  const [translations, setTranslations] = React.useState<TenantTranslations>({ ...defaultTranslations });
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ maxUsers?: string; whatsappRemindersLimit?: string }>({});

  React.useEffect(() => {
    if (open) {
      setFeatures({
        ...defaultFeatures,
        ...initialFeatures,
        payment_enabled: resolvePaymentEnabled(initialFeatures as TenantFeatureFlags & { disabled_payment?: boolean }),
      });
      setLimits({ ...defaultLimits, ...initialLimits });
      setSubmitError(null);
      setErrors({});
      fetch(`/api/store/tenants/${tenantId}/settings`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.patientLabel === "string" && typeof data.professionalLabel === "string") {
            setTranslations({
              patientLabel: data.patientLabel.trim() || defaultTranslations.patientLabel,
              professionalLabel: data.professionalLabel.trim() || defaultTranslations.professionalLabel,
            });
          } else {
            setTranslations({ ...defaultTranslations });
          }
        })
        .catch(() => setTranslations({ ...defaultTranslations }));
    }
  }, [open, tenantId, initialFeatures, initialLimits]);

  const validate = (): boolean => {
    const newErrors: { maxUsers?: string; whatsappRemindersLimit?: string } = {};
    if (limits.maxUsers < 0 || !Number.isInteger(limits.maxUsers)) {
      newErrors.maxUsers = "Debe ser un número entero ≥ 0";
    }
    if (limits.whatsappRemindersLimit < 0 || !Number.isInteger(limits.whatsappRemindersLimit)) {
      newErrors.whatsappRemindersLimit = "Debe ser un número entero ≥ 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    setLoading(true);
    try {
      await onSave({ features, limits, translations });
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const setFeature = (key: keyof TenantFeatureFlags, value: boolean) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="md"
      scrollBehavior="inside"
      classNames={{ wrapper: "z-[99999]" }}
    >
      <ModalContent className="text-slate-800">
        <form onSubmit={handleSubmit}>
          <ModalHeader>Configuración: {tenantName}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {submitError && (
                <Alert color="danger" onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Límites por tenant</h3>
                <div className="flex flex-col gap-3">
                  <Input
                    type="number"
                    label="Cantidad máxima de usuarios/profesionales"
                    value={String(limits.maxUsers)}
                    onValueChange={(value) => setLimits((prev) => ({ ...prev, maxUsers: parseInt(value, 10) || 0 }))}
                    min={0}
                    step={1}
                    isInvalid={!!errors.maxUsers}
                    errorMessage={errors.maxUsers}
                    isDisabled={loading}
                    classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
                  />
                  <Input
                    type="number"
                    label="Recordatorios WhatsApp disponibles"
                    value={String(limits.whatsappRemindersLimit)}
                    onValueChange={(value) =>
                      setLimits((prev) => ({ ...prev, whatsappRemindersLimit: parseInt(value, 10) || 0 }))
                    }
                    min={0}
                    step={1}
                    isInvalid={!!errors.whatsappRemindersLimit}
                    errorMessage={errors.whatsappRemindersLimit}
                    isDisabled={loading}
                    classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
                  />
                </div>
              </div>

              <Divider className="my-2" />

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Traducciones</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Etiquetas que verán los usuarios del panel de este tenant.
                </p>
                <div className="flex flex-col gap-3">
                  <Input
                    type="text"
                    label="¿Cómo llamar a los profesionales?"
                    value={translations.professionalLabel}
                    onValueChange={(value) =>
                      setTranslations((prev) => ({ ...prev, professionalLabel: value || defaultTranslations.professionalLabel }))
                    }
                    isDisabled={loading}
                    placeholder="Profesionales"
                    classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
                  />
                  <Input
                    type="text"
                    label="¿Cómo llamar a los clientes?"
                    value={translations.patientLabel}
                    onValueChange={(value) =>
                      setTranslations((prev) => ({ ...prev, patientLabel: value || defaultTranslations.patientLabel }))
                    }
                    isDisabled={loading}
                    placeholder="Pacientes"
                    classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
                  />
                </div>
              </div>

              <Divider className="my-2" />

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Feature flags</h3>
                <div className="space-y-3 flex flex-col gap-2">
                  <Switch
                    isSelected={features.show_specialties}
                    onValueChange={(value) => setFeature("show_specialties", value)}
                    isDisabled={loading}
                    classNames={{ label: "text-slate-800" }}
                  >
                    Mostrar especialidades
                  </Switch>
                  <Switch
                    isSelected={features.show_coverage}
                    onValueChange={(value) => setFeature("show_coverage", value)}
                    isDisabled={loading}
                    classNames={{ label: "text-slate-800" }}
                  >
                    Mostrar coberturas
                  </Switch>
                  <Switch
                    isSelected={features.show_mercado_pago}
                    onValueChange={(value) => setFeature("show_mercado_pago", value)}
                    isDisabled={loading}
                    classNames={{ label: "text-slate-800" }}
                  >
                    Mostrar Mercado Pago
                  </Switch>
                  <Switch
                    isSelected={features.payment_enabled}
                    onValueChange={(value) => setFeature("payment_enabled", value)}
                    isDisabled={loading}
                    classNames={{ label: "text-slate-800" }}
                  >
                    Habilitar Tenant
                  </Switch>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose} isDisabled={loading} variant="light">
              Cancelar
            </Button>
            <Button type="submit" color="primary" isDisabled={loading} isLoading={loading}>
              Guardar
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
