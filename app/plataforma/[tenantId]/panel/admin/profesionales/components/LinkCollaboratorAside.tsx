"use client";

import * as React from "react";
import { Button, Input, Select, SelectItem, Switch } from "@heroui/react";
import { X } from "lucide-react";

interface Location {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

export interface LinkCollaboratorFormData {
  name: string;
  locationId: string;
  serviceId: string;
  linkEmail: boolean;
  email: string;
}

export interface LinkableCollaborator {
  id: string;
  name: string;
  email: string;
}

interface LinkCollaboratorAsideProps {
  open: boolean;
  onClose: () => void;
  locations: Location[];
  services: Service[];
  /** Colaboradores que aún no tienen perfil profesional (para seleccionar con quién vincular). */
  linkableCollaborators: LinkableCollaborator[];
  onSubmit: (data: LinkCollaboratorFormData) => Promise<void>;
  loading?: boolean;
}

export function LinkCollaboratorAside({
  open,
  onClose,
  locations,
  services,
  linkableCollaborators,
  onSubmit,
  loading = false,
}: LinkCollaboratorAsideProps) {
  const [formData, setFormData] = React.useState<LinkCollaboratorFormData>({
    name: "",
    locationId: "",
    serviceId: "",
    linkEmail: false,
    email: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFormData({ name: "", locationId: locations[0]?.id ?? "", serviceId: "", linkEmail: false, email: "" });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, locations]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!formData.linkEmail) {
      if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
      if (!formData.locationId) newErrors.locationId = "La sucursal es requerida";
    } else {
      if (!formData.email || !String(formData.email).trim()) newErrors.email = "Seleccioná un colaborador para vincular";
    }
    setErrors(newErrors);
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
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error al vincular");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" aria-hidden onClick={onClose} />
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: "translateX(0)" }}
        aria-modal="true"
        aria-label="Vincular colaborador como profesional"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-slate-800">Agregar profesional</h2>
          <Button isIconOnly size="sm" variant="light" onPress={onClose} aria-label="Cerrar">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto">
            {submitError && (
              <p className="text-sm text-danger" role="alert">{submitError}</p>
            )}
            <Input
              label="Nombre y apellido (opcional si vinculás un colaborador)"
              value={formData.name}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, name: v }))}
              isInvalid={!!errors.name}
              errorMessage={errors.name}
              classNames={{ label: "text-slate-800" }}
            />
            <Select
              label="Sucursal (opcional si vinculás un colaborador)"
              selectedKeys={formData.locationId ? [formData.locationId] : []}
              onSelectionChange={(keys) => {
                const v = Array.from(keys)[0] as string;
                if (v) setFormData((prev) => ({ ...prev, locationId: v }));
              }}
              isInvalid={!!errors.locationId}
              errorMessage={errors.locationId}
              classNames={{ label: "text-slate-800" }}
            >
              {locations.map((loc) => (
                <SelectItem key={loc.id} textValue={loc.name}>{loc.name}</SelectItem>
              ))}
            </Select>
            <Select
              label="Servicio (opcional)"
              selectedKeys={formData.serviceId ? [formData.serviceId] : []}
              onSelectionChange={(keys) => {
                const v = Array.from(keys)[0] as string;
                setFormData((prev) => ({ ...prev, serviceId: v || "" }));
              }}
              classNames={{ label: "text-slate-800" }}
            >
              <>
                <SelectItem key="" textValue="—">—</SelectItem>
                {services.map((srv) => (
                  <SelectItem key={srv.id} textValue={srv.name}>{srv.name}</SelectItem>
                ))}
              </>
            </Select>
            <Switch
              isSelected={formData.linkEmail}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, linkEmail: v, email: v ? prev.email : "" }))}
              classNames={{ label: "text-slate-800" }}
            >
              Vincular con colaborador existente
            </Switch>
            {formData.linkEmail && (
              <>
                {linkableCollaborators.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No hay colaboradores sin perfil profesional. Creá uno en <strong>Colaboradores</strong> y volvé a intentar.
                  </p>
                ) : (
                  <Select
                    label="Colaborador a vincular"
                    placeholder="Seleccionar colaborador"
                    selectedKeys={formData.email ? [formData.email] : []}
                    onSelectionChange={(keys) => {
                      const raw = Array.from(keys)[0];
                      const email = raw != null ? String(raw).trim() : "";
                      if (email) setFormData((prev) => ({ ...prev, email }));
                    }}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                    description="El usuario seleccionado pasará a ser profesional sin perder su rol."
                    classNames={{ label: "text-slate-800" }}
                  >
                    {linkableCollaborators.map((c) => (
                      <SelectItem key={c.email} textValue={`${c.name} (${c.email})`}>
                        {c.name} — {c.email}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
            <Button variant="bordered" onPress={onClose} isDisabled={submitting}>Cancelar</Button>
            <Button
              type="submit"
              color="primary"
              isLoading={submitting || loading}
              isDisabled={submitting || (formData.linkEmail && linkableCollaborators.length === 0)}
            >
              Vincular
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
