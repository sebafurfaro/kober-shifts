"use client";

import * as React from "react";
import { Button, Input, Select, SelectItem, Checkbox } from "@heroui/react";
import { X, CheckCircle2, XCircle } from "lucide-react";

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {isValid ? (
        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-400 opacity-50 shrink-0" />
      )}
      <span className={`text-xs transition-colors ${isValid ? "text-success" : "text-gray-500"}`}>
        {text}
      </span>
    </div>
  );
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "PROFESSIONAL", label: "Profesional" },
  { value: "SUPERVISOR", label: "Recepcionista" },
] as const;

export interface EditUserFormData {
  name: string;
  email: string;
  dni: string;
  role: string;
  tempPassword?: string;
  /** Solo aplica cuando role es ADMIN: si true, se crea/usa professional_profile para aparecer en agenda y recibir turnos. */
  alsoProfessional?: boolean;
}

interface EditUserAsideProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  /** initialData.alsoProfessional / hasProfessionalProfile: en edit, true si el usuario ya tiene professional_profile. */
  initialData: (EditUserFormData & { hasProfessionalProfile?: boolean }) | null;
  onSubmit: (data: EditUserFormData) => Promise<void>;
  loading?: boolean;
}

export function EditUserAside({
  open,
  onClose,
  mode,
  initialData,
  onSubmit,
  loading = false,
}: EditUserAsideProps) {
  const [formData, setFormData] = React.useState<EditUserFormData>({
    name: "",
    email: "",
    dni: "",
    role: "PROFESSIONAL",
    tempPassword: "",
    alsoProfessional: false,
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof EditUserFormData, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isPasswordTouched, setIsPasswordTouched] = React.useState(false);

  const passwordValidations = React.useMemo(() => ({
    minLength: (formData.tempPassword?.length ?? 0) >= 8,
    hasUpperCase: /[A-Z]/.test(formData.tempPassword ?? ""),
    hasNumber: /[0-9]/.test(formData.tempPassword ?? ""),
    hasSpecialChar: /[^a-zA-Z0-9]/.test(formData.tempPassword ?? ""),
  }), [formData.tempPassword]);

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name ?? "",
          email: initialData.email ?? "",
          dni: initialData.dni ?? "",
          role: initialData.role && ROLE_OPTIONS.some((r) => r.value === initialData.role) ? initialData.role : "PROFESSIONAL",
          tempPassword: "",
          alsoProfessional: initialData.role === "ADMIN" ? !!(initialData as any).hasProfessionalProfile : false,
        });
      } else {
        setFormData({ name: "", email: "", dni: "", role: "PROFESSIONAL", tempPassword: "", alsoProfessional: false });
      }
      setErrors({});
      setSubmitError(null);
      setIsPasswordTouched(false);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EditUserFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (!formData.email.trim()) newErrors.email = "El correo es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Correo no válido";

    if (mode === "create") {
      if (!formData.tempPassword?.trim()) {
        newErrors.tempPassword = "La contraseña es requerida";
      } else if (!isPasswordValid) {
        newErrors.tempPassword = "La contraseña no cumple con los requisitos de seguridad";
      }
    } else if (mode === "edit" && formData.tempPassword?.trim() && !isPasswordValid) {
      newErrors.tempPassword = "La contraseña no cumple con los requisitos de seguridad";
    }

    setErrors(newErrors);
    setIsPasswordTouched(true);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message ?? "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
        aria-modal="true"
        aria-label="Editar usuario"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-slate-800">{mode === "create" ? "Crear perfil" : "Editar usuario"}</h2>
          <Button isIconOnly size="sm" variant="light" onPress={onClose} aria-label="Cerrar" className="hidden md:block">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto">
            {submitError && (
              <p className="text-sm text-danger" role="alert">
                {submitError}
              </p>
            )}
            <Input
              label="Nombre y apellido"
              value={formData.name}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, name: v }))}
              isInvalid={!!errors.name}
              errorMessage={errors.name}
              isRequired
              autoComplete="name"
              classNames={{ label: "text-slate-800" }}
            />
            <Input
              label="Correo electrónico"
              type="email"
              value={formData.email}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, email: v }))}
              isInvalid={!!errors.email}
              errorMessage={errors.email}
              isRequired
              autoComplete="email"
              classNames={{ label: "text-slate-800" }}
            />
            <Input
              label="DNI"
              value={formData.dni}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, dni: v }))}
              isInvalid={!!errors.dni}
              errorMessage={errors.dni}
              autoComplete="off"
              classNames={{ label: "text-slate-800" }}
            />
            <div className="space-y-2">
              <Input
                label={mode === "create" ? "Contraseña" : "Nueva contraseña"}
                type="password"
                value={formData.tempPassword ?? ""}
                onValueChange={(v) => {
                  setFormData((prev) => ({ ...prev, tempPassword: v }));
                  if (errors.tempPassword) setErrors((prev) => ({ ...prev, tempPassword: undefined }));
                }}
                onBlur={() => {
                  if (mode === "create" || formData.tempPassword?.trim()) setIsPasswordTouched(true);
                }}
                isInvalid={isPasswordTouched && (mode === "create" || !!formData.tempPassword?.trim()) && !isPasswordValid}
                isRequired={mode === "create"}
                description={mode === "edit" ? "Dejá en blanco para mantener la contraseña actual." : undefined}
                autoComplete="new-password"
                classNames={{ label: "text-slate-800" }}
              />
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs font-semibold mb-2">Requisitos de la contraseña:</p>
                <div className="space-y-1">
                  <ValidationItem isValid={passwordValidations.minLength} text="Mínimo 8 caracteres" />
                  <ValidationItem isValid={passwordValidations.hasUpperCase} text="Al menos una mayúscula" />
                  <ValidationItem isValid={passwordValidations.hasNumber} text="Al menos un número" />
                  <ValidationItem isValid={passwordValidations.hasSpecialChar} text="Al menos un carácter especial" />
                </div>
              </div>
            </div>
            <Select
              label="Rol"
              selectedKeys={formData.role ? [formData.role] : []}
              onSelectionChange={(keys) => {
                const v = Array.from(keys)[0] as string;
                if (v) setFormData((prev) => ({ ...prev, role: v, alsoProfessional: v === "ADMIN" ? prev.alsoProfessional : false }));
              }}
              isRequired
              classNames={{ label: "text-slate-800" }}
            >
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
            {formData.role === "ADMIN" && (
              <Checkbox
                isSelected={formData.alsoProfessional === true}
                onValueChange={(checked) => setFormData((prev) => ({ ...prev, alsoProfessional: checked }))}
                classNames={{ label: "text-slate-800" }}
              >
                También es profesional (aparece en la agenda y puede recibir turnos)
              </Checkbox>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 grid grid-cols-2 md:flex gap-2 md:justify-end">
            <Button variant="bordered" color="danger" onPress={onClose} isDisabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" color="primary" variant="solid" isLoading={submitting || loading} isDisabled={submitting}>
              {mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
