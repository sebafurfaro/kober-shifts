"use client";

import * as React from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Alert,
  Spinner,
} from "@heroui/react";
import { PanelHeader } from "../../components/PanelHeader";
import { useParams } from "next/navigation";
import { format } from "date-fns";

interface Coverage {
  id: string;
  name: string;
  plans: Array<{ id: string; name: string }>;
}

interface PatientData {
  id: string;
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
}

function toDateStr(v: Date | string | null | undefined): string {
  if (!v) return "";
  if (typeof v === "string") return v.split("T")[0];
  return format(new Date(v), "yyyy-MM-dd");
}

export default function MisDatosPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [userId, setUserId] = React.useState<string | null>(null);
  const [data, setData] = React.useState<PatientData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [showCoverage, setShowCoverage] = React.useState(true);
  const [coverages, setCoverages] = React.useState<Coverage[]>([]);
  const [loadingCoverages, setLoadingCoverages] = React.useState(false);

  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    dni: "",
    coverage: "",
    plan: "",
    dateOfBirth: "",
    admissionDate: "",
    gender: "",
    nationality: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, featuresRes] = await Promise.all([
          fetch(`/api/plataforma/${tenantId}/auth/me`, { credentials: "include" }),
          fetch(`/api/plataforma/${tenantId}/features`, { credentials: "include" }),
        ]);
        if (!meRes.ok || cancelled) return;
        const me = await meRes.json();
        if (!me?.id || cancelled) return;
        setUserId(me.id);
        if (featuresRes.ok) {
          const features = await featuresRes.json();
          if (!cancelled) setShowCoverage(features.show_coverage ?? true);
        }
        const patientRes = await fetch(`/api/plataforma/${tenantId}/admin/patients/${me.id}`, {
          credentials: "include",
        });
        if (!patientRes.ok) {
          setError("No se pudieron cargar tus datos");
          return;
        }
        const patient = await patientRes.json();
        if (cancelled) return;
        setData(patient);
        setForm({
          firstName: patient.firstName ?? "",
          lastName: patient.lastName ?? "",
          phone: patient.phone ?? "",
          address: patient.address ?? "",
          dni: patient.dni ?? "",
          coverage: patient.coverage ?? "",
          plan: patient.plan ?? "",
          dateOfBirth: toDateStr(patient.dateOfBirth),
          admissionDate: toDateStr(patient.admissionDate),
          gender: patient.gender ?? "",
          nationality: patient.nationality ?? "",
        });
      } catch {
        if (!cancelled) setError("Error al cargar los datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  React.useEffect(() => {
    if (!showCoverage || !editing || !tenantId) return;
    setLoadingCoverages(true);
    fetch(`/api/plataforma/${tenantId}/admin/coverages`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setCoverages(Array.isArray(list) ? list : []))
      .catch(() => setCoverages([]))
      .finally(() => setLoadingCoverages(false));
  }, [showCoverage, editing, tenantId]);

  const availablePlans = React.useMemo(() => {
    if (!form.coverage) return [];
    const cov = coverages.find((c) => c.name === form.coverage);
    return cov?.plans ?? [];
  }, [form.coverage, coverages]);

  const handleSave = async () => {
    if (!userId) return;
    setSubmitError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/patients/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: data?.email ?? "",
          phone: form.phone.trim() || "",
          address: form.address.trim() || "",
          dni: form.dni.trim() || "",
          coverage: form.coverage.trim() || "",
          plan: form.plan.trim() || "",
          dateOfBirth: form.dateOfBirth || "",
          admissionDate: form.admissionDate || "",
          gender: form.gender || "",
          nationality: form.nationality.trim() || "",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      setData((prev) => (prev ? { ...prev, ...form } : null));
      setEditing(false);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      setForm({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        dni: data.dni ?? "",
        coverage: data.coverage ?? "",
        plan: data.plan ?? "",
        dateOfBirth: toDateStr(data.dateOfBirth),
        admissionDate: toDateStr(data.admissionDate),
        gender: data.gender ?? "",
        nationality: data.nationality ?? "",
      });
    }
    setEditing(false);
    setSubmitError(null);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4 flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <PanelHeader title="Mis datos" subtitle="Tu información personal" />
        <Alert color="danger">{error || "No se encontraron datos"}</Alert>
      </div>
    );
  }

  const isDisabled = !editing;
  const classNames = { input: "text-slate-800", inputWrapper: "text-slate-800" };

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <PanelHeader
        title="Mis datos"
        subtitle="Consultá y editá tu información personal"
        action={
          editing
            ? undefined
            : {
                label: "Editar",
                onClick: () => setEditing(true),
              }
        }
      />

      <Card>
        <CardBody className="gap-4">
          {submitError && (
            <Alert color="danger" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={form.firstName}
              onValueChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
              isDisabled={isDisabled}
              classNames={classNames}
            />
            <Input
              label="Apellido"
              value={form.lastName}
              onValueChange={(v) => setForm((p) => ({ ...p, lastName: v }))}
              isDisabled={isDisabled}
              classNames={classNames}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={data.email ?? ""}
            isDisabled
            classNames={classNames}
            description="El email no se puede modificar"
          />

          <Input
            label="Teléfono"
            value={form.phone}
            onValueChange={(v) => setForm((p) => ({ ...p, phone: v }))}
            isDisabled={isDisabled}
            classNames={classNames}
          />

          <Textarea
            label="Dirección"
            value={form.address}
            onValueChange={(v) => setForm((p) => ({ ...p, address: v }))}
            isDisabled={isDisabled}
            minRows={2}
            classNames={classNames}
          />

          <Input
            label="DNI"
            value={form.dni}
            onValueChange={(v) => setForm((p) => ({ ...p, dni: v }))}
            isDisabled={isDisabled}
            classNames={classNames}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={form.dateOfBirth}
              onValueChange={(v) => setForm((p) => ({ ...p, dateOfBirth: v }))}
              isDisabled={isDisabled}
              classNames={classNames}
            />
            <Input
              label="Fecha de ingreso"
              type="date"
              value={form.admissionDate}
              onValueChange={(v) => setForm((p) => ({ ...p, admissionDate: v }))}
              isDisabled={isDisabled}
              classNames={classNames}
            />
          </div>

          <Select
            label="Género"
            selectedKeys={form.gender ? [form.gender] : []}
            onSelectionChange={(keys) => setForm((p) => ({ ...p, gender: (Array.from(keys)[0] as string) || "" }))}
            isDisabled={isDisabled}
            classNames={{ value: "text-slate-800", popoverContent: "text-slate-800" }}
          >
            <SelectItem key="">Seleccionar...</SelectItem>
            <SelectItem key="Masculino">Masculino</SelectItem>
            <SelectItem key="Femenino">Femenino</SelectItem>
            <SelectItem key="No binario">No binario</SelectItem>
          </Select>

          <Input
            label="Nacionalidad"
            value={form.nationality}
            onValueChange={(v) => setForm((p) => ({ ...p, nationality: v }))}
            isDisabled={isDisabled}
            classNames={classNames}
          />

          {showCoverage && editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Cobertura"
                selectedKeys={form.coverage ? [form.coverage] : []}
                onSelectionChange={(keys) => {
                  const v = (Array.from(keys)[0] as string) || "";
                  setForm((p) => ({ ...p, coverage: v, plan: "" }));
                }}
                isDisabled={loadingCoverages}
                isLoading={loadingCoverages}
                classNames={{ value: "text-slate-800", popoverContent: "text-slate-800" }}
              >
                <SelectItem key="">Seleccionar...</SelectItem>
                {coverages.map((c) => (
                  <SelectItem key={c.name}>{c.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Plan"
                selectedKeys={form.plan ? [form.plan] : []}
                onSelectionChange={(keys) => setForm((p) => ({ ...p, plan: (Array.from(keys)[0] as string) || "" }))}
                isDisabled={!form.coverage || availablePlans.length === 0}
                placeholder={!form.coverage ? "Seleccioná una cobertura primero" : "Seleccionar plan"}
                classNames={{ value: "text-slate-800", popoverContent: "text-slate-800" }}
              >
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.name}>{plan.name}</SelectItem>
                ))}
              </Select>
            </div>
          )}

          {showCoverage && !editing && (form.coverage || form.plan) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Cobertura" value={form.coverage} isDisabled classNames={classNames} />
              <Input label="Plan" value={form.plan} isDisabled classNames={classNames} />
            </div>
          )}

          {editing && (
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="light" onPress={handleCancel} isDisabled={saving}>
                Cancelar
              </Button>
              <Button color="primary" onPress={handleSave} isLoading={saving} isDisabled={saving}>
                Guardar
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
