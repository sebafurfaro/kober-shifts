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
import { useParams } from "next/navigation";

interface Coverage {
  id: string;
  name: string;
  plans: Array<{ id: string; name: string }>;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dni: string;
  coverage: string;
  plan: string;
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
    dni?: string | null;
    coverage?: string | null;
    plan?: string | null;
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
    dni: initialData?.dni || "",
    coverage: initialData?.coverage || "",
    plan: initialData?.plan || "",
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
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [coverages, setCoverages] = React.useState<Coverage[]>([]);
  const [loadingCoverages, setLoadingCoverages] = React.useState(false);

  // Load coverages
  React.useEffect(() => {
    if (open) {
      setLoadingCoverages(true);
      fetch(`/api/plataforma/${tenantId}/admin/coverages`)
        .then((res) => res.json())
        .then((data) => {
          setCoverages(data || []);
        })
        .catch((error) => {
          console.error("Error loading coverages:", error);
          setCoverages([]);
        })
        .finally(() => {
          setLoadingCoverages(false);
        });
    }
  }, [open, tenantId]);

  // Get available plans for selected coverage
  const availablePlans = React.useMemo(() => {
    if (!formData.coverage) return [];
    const selectedCoverage = coverages.find((c) => c.name === formData.coverage);
    return selectedCoverage?.plans || [];
  }, [formData.coverage, coverages]);

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
        dni: initialData?.dni || "",
        coverage: initialData?.coverage || "",
        plan: initialData?.plan || "",
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

    if (mode === "create" && !formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido";
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
        dni: formData.dni.trim(),
        coverage: formData.coverage.trim() || "",
        plan: formData.plan.trim() || "",
        dateOfBirth: formData.dateOfBirth || "",
        admissionDate: formData.admissionDate || "",
        gender: formData.gender || "",
        nationality: formData.nationality.trim() || "",
        // En modo create, la contraseña será el DNI automáticamente
        ...(mode === "create" ? { tempPassword: formData.dni.trim() } : formData.tempPassword ? { tempPassword: formData.tempPassword } : {}),
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      setSubmitError(error?.message || "Error al guardar");
    }
  };


  return (
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      size="2xl" 
      scrollBehavior="inside"
      classNames={{
        wrapper: "z-[99999]"
      }}
    >
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
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
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
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
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
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
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
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
                  classNames={{
                    value: "text-slate-800",
                    popoverContent: "text-slate-800",
                  }}
                >
                  <SelectItem key="" className="text-slate-800">Seleccionar...</SelectItem>
                  <SelectItem key="Masculino" className="text-slate-800">Masculino</SelectItem>
                  <SelectItem key="Femenino" className="text-slate-800">Femenino</SelectItem>
                  <SelectItem key="No binario" className="text-slate-800">No binario</SelectItem>
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
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
                <Input
                  label="DNI"
                  value={formData.dni}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, dni: value }));
                    if (errors.dni) {
                      setErrors((prev) => ({ ...prev, dni: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.dni}
                  errorMessage={errors.dni}
                  isRequired={mode === "create"}
                  isDisabled={loading}
                  autoComplete="off"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
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
                classNames={{
                  input: "text-slate-800",
                  inputWrapper: "text-slate-800",
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Cobertura"
                  selectedKeys={formData.coverage ? [formData.coverage] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData((prev) => ({ 
                      ...prev, 
                      coverage: selected || "",
                      plan: "" // Clear plan when coverage changes
                    }));
                    if (errors.coverage) {
                      setErrors((prev) => ({ ...prev, coverage: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.coverage}
                  errorMessage={errors.coverage}
                  isDisabled={loading || loadingCoverages}
                  isLoading={loadingCoverages}
                  classNames={{
                    value: "text-slate-800",
                    popoverContent: "text-slate-800",
                  }}
                >
                  <SelectItem key="" className="text-slate-800">Seleccionar...</SelectItem>
                  <>
                    {coverages.map((coverage) => (
                      <SelectItem key={coverage.name} className="text-slate-800">{coverage.name}</SelectItem>
                    ))}
                  </>
                </Select>
                <Select
                  label="Plan"
                  selectedKeys={formData.plan ? [formData.plan] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData((prev) => ({ ...prev, plan: selected || "" }));
                    if (errors.plan) {
                      setErrors((prev) => ({ ...prev, plan: undefined }));
                    }
                    setSubmitError(null);
                  }}
                  isInvalid={!!errors.plan}
                  errorMessage={errors.plan}
                  isDisabled={loading || !formData.coverage || availablePlans.length === 0}
                  placeholder={!formData.coverage ? "Seleccione una cobertura primero" : availablePlans.length === 0 ? "No hay planes disponibles" : "Seleccionar plan"}
                  classNames={{
                    value: "text-slate-800",
                    popoverContent: "text-slate-800",
                  }}
                >
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.name} className="text-slate-800">{plan.name}</SelectItem>
                  ))}
                </Select>
              </div>
              
              {mode === "edit" && (
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
                    errors.tempPassword || "Dejar vacío para mantener la contraseña actual"
                  }
                  isDisabled={loading}
                  autoComplete="new-password"
                  classNames={{
                    input: "text-slate-800",
                    inputWrapper: "text-slate-800",
                  }}
                />
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

