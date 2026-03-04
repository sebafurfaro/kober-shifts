"use client";

import * as React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Alert,
  Divider,
} from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useTenantAdminCredentialsStore } from "@/lib/tenant-admin-credentials-store";

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
  adminEmail?: string;
  adminPassword?: string;
}

interface TenantFormSectionProps {
  onSubmit: (data: TenantFormData) => Promise<void>;
}

const defaultFormData: TenantFormData = {
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
};

export function TenantFormSection({ onSubmit }: TenantFormSectionProps) {
  const [formData, setFormData] = React.useState<TenantFormData>(defaultFormData);
  const [errors, setErrors] = React.useState<Partial<Record<keyof TenantFormData, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showAdminPassword, setShowAdminPassword] = React.useState(false);
  const { adminEmail, adminPassword, setAdminEmail, setAdminPassword } = useTenantAdminCredentialsStore();

  const resetForm = () => {
    setFormData(defaultFormData);
    setErrors({});
    setSubmitError(null);
    setAdminEmail("");
    setAdminPassword("");
  };

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
    if (!validate()) return;
    setSubmitError(null);
    setLoading(true);
    try {
      const submitData: TenantFormData = {
        name: formData.name.trim(),
        id: formData.id?.trim() || undefined,
        logoUrl: formData.logoUrl?.trim() || undefined,
        features: formData.features,
        limits: formData.limits,
        adminEmail: adminEmail.trim() || undefined,
        adminPassword: adminPassword || undefined,
      };
      await onSubmit(submitData);
      resetForm();
    } catch (error: any) {
      setSubmitError(error?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg card">
      <CardHeader className="text-slate-800">Crear tenant</CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <p className="text-xs text-gray-500 mt-1">Solo letras minúsculas, números y guiones</p>
          </div>

          <Input
            label="Logo URL (Opcional)"
            value={formData.logoUrl || ""}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, logoUrl: value }));
              if (errors.logoUrl) {
                setErrors((prev) => ({ ...prev, logoUrl: undefined }));
              }
              setSubmitError(null);
            }}
            isInvalid={!!errors.logoUrl}
            errorMessage={errors.logoUrl}
            isDisabled={loading}
            placeholder="https://..."
            autoComplete="off"
            classNames={{
              input: "text-slate-800",
              inputWrapper: "text-slate-800",
            }}
          />

          <Divider className="my-2" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              type="email"
              label="Correo administrador"
              value={adminEmail}
              onValueChange={setAdminEmail}
              isDisabled={loading}
              placeholder="admin@tu-dominio.com"
              autoComplete="off"
              classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
            />
            <Input
              type={showAdminPassword ? "text" : "password"}
              label="Contraseña administrador"
              value={adminPassword}
              onValueChange={setAdminPassword}
              isDisabled={loading}
              autoComplete="new-password"
              classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
              endContent={
                <button
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setShowAdminPassword((prev) => !prev)}
                >
                  {showAdminPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              }
            />
          </div>

          <Divider className="my-2" />

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Límites por tenant</h3>
            {errors.limits && <p className="text-sm text-danger mb-2">{errors.limits}</p>}
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

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button onPress={resetForm} isDisabled={loading} variant="light">
              Limpiar
            </Button>
            <Button type="submit" color="primary" isDisabled={loading} isLoading={loading}>
              {loading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
