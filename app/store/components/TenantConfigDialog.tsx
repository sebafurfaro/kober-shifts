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
  Divider,
  Alert,
} from "@heroui/react";

export interface TenantFeatureFlags {
  show_specialties: boolean;
  show_coverage: boolean;
  show_mercado_pago: boolean;
  calendar: boolean;
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
  calendar: true,
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
      size="lg"
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
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Mostrar especialidades</span>
                    <Button
                      variant={features.show_specialties ? "solid" : "bordered"}
                      color={features.show_specialties ? "success" : ("info" as "primary")}
                      isDisabled={loading}
                      onPress={() => setFeature("show_specialties", !features.show_specialties)}
                    >
                      {features.show_specialties ? "Habilitado" : "Deshabilitado"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Mostrar coberturas</span>
                    <Button
                      variant={features.show_coverage ? "solid" : "bordered"}
                      color={features.show_coverage ? "success" : ("info" as "primary")}
                      isDisabled={loading}
                      onPress={() => setFeature("show_coverage", !features.show_coverage)}
                    >
                      {features.show_coverage ? "Habilitado" : "Deshabilitado"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Mostrar Mercado Pago</span>
                    <Button
                      variant={features.show_mercado_pago ? "solid" : "bordered"}
                      color={features.show_mercado_pago ? "success" : ("info" as "primary")}
                      isDisabled={loading}
                      onPress={() => setFeature("show_mercado_pago", !features.show_mercado_pago)}
                    >
                      {features.show_mercado_pago ? "Habilitado" : "Deshabilitado"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Mostrar calendario</span>
                    <Button
                      variant={features.calendar ? "solid" : "bordered"}
                      color={features.calendar ? "success" : ("info" as "primary")}
                      isDisabled={loading}
                      onPress={() => setFeature("calendar", !features.calendar)}
                    >
                      {features.calendar ? "Habilitado" : "Deshabilitado"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-800">Habilitar tenant</span>
                    <Button
                      variant={features.payment_enabled ? "solid" : "bordered"}
                      color={features.payment_enabled ? "success" : ("info" as "primary")}
                      isDisabled={loading}
                      onPress={() => setFeature("payment_enabled", !features.payment_enabled)}
                    >
                      {features.payment_enabled ? "Habilitado" : "Deshabilitado"}
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
            <Button type="submit" color="primary" isDisabled={loading} isLoading={loading}>
              Guardar
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
