"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Typography from "@/app/components/Typography";
import { Divider, Input, Slider, Switch, Textarea, Button, Select, Alert } from "@heroui/react";
import { useTenantSettingsStore, type TenantBookingSettings } from "@/lib/tenant-settings-store";

const defaultBooking: TenantBookingSettings = {
  depositPercent: 0,
  refundPolicyMessage: "",
  manualTurnConfirmation: false,
  minAnticipation: 0,
  maxAnticipation: 30,
  defaultSlotDurationMinutes: 30,
  defaultSlotMarginMinutes: 0,
  sendEmailConfirmation: false,
};

export const SettingsTab = () => {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const { setBookingSettings } = useTenantSettingsStore();
  const [form, setForm] = React.useState<TenantBookingSettings>(defaultBooking);
  const [saving, setSaving] = React.useState(false);
  /** String value for maxAnticipation input so the user can clear and type freely; committed to form on blur/save */
  const [maxAnticipationInput, setMaxAnticipationInput] = React.useState(String(defaultBooking.maxAnticipation));

  React.useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    fetch(`/api/plataforma/${tenantId}/admin/settings`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const maxAnt = typeof data.maxAnticipation === "number" ? data.maxAnticipation : defaultBooking.maxAnticipation;
        setForm({
          depositPercent: typeof data.depositPercent === "number" ? data.depositPercent : defaultBooking.depositPercent,
          refundPolicyMessage: typeof data.refundPolicyMessage === "string" ? data.refundPolicyMessage : defaultBooking.refundPolicyMessage,
          manualTurnConfirmation: typeof data.manualTurnConfirmation === "boolean" ? data.manualTurnConfirmation : defaultBooking.manualTurnConfirmation,
          minAnticipation: typeof data.minAnticipation === "number" ? data.minAnticipation : defaultBooking.minAnticipation,
          maxAnticipation: maxAnt,
          defaultSlotDurationMinutes: typeof data.defaultSlotDurationMinutes === "number" ? data.defaultSlotDurationMinutes : defaultBooking.defaultSlotDurationMinutes,
          defaultSlotMarginMinutes: typeof data.defaultSlotMarginMinutes === "number" ? data.defaultSlotMarginMinutes : defaultBooking.defaultSlotMarginMinutes,
          sendEmailConfirmation: typeof data.sendEmailConfirmation === "boolean" ? data.sendEmailConfirmation : defaultBooking.sendEmailConfirmation,
        });
        setMaxAnticipationInput(maxAnt === -1 ? "-1" : String(maxAnt));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tenantId]);

  const commitMaxAnticipation = React.useCallback(() => {
    const parsed =
      maxAnticipationInput === "" || maxAnticipationInput === "-"
        ? 30
        : maxAnticipationInput === "-1"
          ? -1
          : Math.max(-1, parseInt(maxAnticipationInput, 10) ?? 30);
    setForm((f) => ({ ...f, maxAnticipation: parsed }));
    setMaxAnticipationInput(parsed === -1 ? "-1" : String(parsed));
  }, [maxAnticipationInput]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const maxAnt =
        maxAnticipationInput === "" || maxAnticipationInput === "-"
          ? 30
          : maxAnticipationInput === "-1"
            ? -1
            : Math.max(-1, parseInt(maxAnticipationInput, 10) ?? 30);
      const res = await fetch(`/api/plataforma/${tenantId}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          depositPercent: form.depositPercent,
          refundPolicyMessage: form.refundPolicyMessage,
          manualTurnConfirmation: form.manualTurnConfirmation,
          minAnticipation: form.minAnticipation,
          maxAnticipation: maxAnt,
          defaultSlotDurationMinutes: form.defaultSlotDurationMinutes,
          defaultSlotMarginMinutes: form.defaultSlotMarginMinutes,
          sendEmailConfirmation: form.sendEmailConfirmation,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const maxAnt = data.settings.maxAnticipation ?? 30;
          setForm((f) => ({ ...f, maxAnticipation: maxAnt }));
          setMaxAnticipationInput(maxAnt === -1 ? "-1" : String(maxAnt));
          setBookingSettings({
            depositPercent: data.settings.depositPercent,
            refundPolicyMessage: data.settings.refundPolicyMessage,
            manualTurnConfirmation: data.settings.manualTurnConfirmation,
            minAnticipation: data.settings.minAnticipation,
            maxAnticipation: maxAnt,
            defaultSlotDurationMinutes: data.settings.defaultSlotDurationMinutes,
            defaultSlotMarginMinutes: data.settings.defaultSlotMarginMinutes,
            sendEmailConfirmation: data.settings.sendEmailConfirmation ?? false,
          });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col p-4 space-y-4 bg-white">
      <Typography variant="h4" color="black">Ajustes</Typography>
      <Divider />
      {/**
      TODO: habilitar y mostrar estos campos en el futuro cuando se implementen las funcionalidades relacionadas a seña y reembolso
       */}
      <div className="hidden flex-col space-y-4"> 
        <Typography variant="h6" color="black">Porcentaje de la seña</Typography>
        <Slider
          isDisabled
          className="w-full"
          value={form.depositPercent}
          onChange={(value) => setForm((f) => ({ ...f, depositPercent: Array.isArray(value) ? value[0] : value }))}
          formatOptions={{ style: "percent" }}
          label="0%"
          maxValue={1}
          minValue={0}
          step={0.01}
          showTooltip={true}
          getValue={(val) => `${Math.round((val as number) * 100)}%`}
          //isDisabled={saving}
        />
        <Typography variant="p" size="sm" color="gray" opacity={70}>
          Define el porcentaje del total de la reserva que se cobrará como seña al momento de reservar. Por ejemplo, si el porcentaje es 20% y un cliente reserva un turno de $1000, se le cobrará una seña de $200 al momento de la reserva.
        </Typography>
      </div>
      <Divider className="hidden" />
      <div className="hidden flex-col space-y-4">
        <Typography variant="h6">Política de reembolso</Typography>
        <Textarea
          placeholder="Escribe la política de reembolso de tu negocio..."
          value={form.refundPolicyMessage}
          onValueChange={(v) => setForm((f) => ({ ...f, refundPolicyMessage: v }))}
          isDisabled={saving}
        />
        <Typography variant="p" size="sm" color="gray" opacity={70}>Este mensaje se mostrará cuando exista política de reembolso (cancelación o modificación de turnos).</Typography>
      </div>
      <Divider className="hidden" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col space-y-4">
          <Typography variant="h6">Confirmación de turnos</Typography>
          <Switch
            isSelected={form.manualTurnConfirmation}
            onValueChange={(checked) => setForm((f) => ({ ...f, manualTurnConfirmation: checked }))}
            isDisabled={saving}
          >
            Confirmación manual de turnos
          </Switch>
          <Typography variant="p" size="sm" color="gray" opacity={70} >
            Si lo mantenes desactivado, los turnos se confirmarán automáticamente al ser reservados por los clientes. Si lo activas, cada vez que un cliente reserve un turno, el turno quedará "pendiente" hasta que vos o tu equipo lo confirme manualmente desde el panel de administración. Esto te permite tener un control total sobre las reservas y evitar turnos no deseados o reservas duplicadas.
          </Typography>
        </div>
        <div className="flex flex-col space-y-4">
          <Typography variant="h6">Enviar confirmación de turnos por mail</Typography>
          <Switch
            isSelected={form.sendEmailConfirmation}
            onValueChange={(checked) => setForm((f) => ({ ...f, sendEmailConfirmation: checked }))}
            isDisabled={saving}
          >
            Enviar por mail
          </Switch>
          <Alert color="warning" title="Recordá tener cargado un email válido en el receptor, es decir tu cliente o paciente." />
          <Typography variant="p" size="sm" color="gray" opacity={70} >
            Si mantenés esta opción desactivada, la confirmación del turno deberá ser manual a través de tu correo electrónico. 
          </Typography>
          <Typography variant="p" size="sm" color="gray" opacity={70} >
            Si lo activás, en cada turno que se confirme se enviará al cliente un correo avisándole. No tiene costo adicional. 
          </Typography>

        </div>
      </div>
      <Divider />
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-4">
            <Input
              label="Anticipación mínima para reservar"
              name="minAnticipation"
              type="number"
              min={0}
              value={String(form.minAnticipation)}
              onValueChange={(v) => setForm((f) => ({ ...f, minAnticipation: Math.max(0, parseInt(v, 10) || 0) }))}
              endContent={<span className="text-sm text-slate-500">horas</span>}
              isDisabled={saving}
            />
            <Typography variant="p" size="sm" color="gray" opacity={70}>
              Plazo en horas: un turno no puede ser tomado si queda menos de este tiempo. Ej.: si son las 15:00, el turno es a las 15:30 y el plazo es 1 h, el turno de las 15:30 no estará disponible.
            </Typography>
          </div>
          <div className="flex flex-col space-y-4">
            <Input
              label="Anticipación máxima para reservar"
              name="maxAnticipation"
              type="text"
              inputMode="numeric"
              value={maxAnticipationInput}
              onValueChange={setMaxAnticipationInput}
              onBlur={commitMaxAnticipation}
              endContent={<span className="text-sm text-slate-500">días</span>}
              isDisabled={saving}
            />
            <Typography variant="p" size="sm" color="gray" opacity={70}>
              Cantidad de días a futuro que se muestran turnos disponibles.
            </Typography>
          </div>
        </div>
      </div>
      <Divider className="my-4" />
      <div className="flex flex-col space-y-4">
        <Typography variant="h6">Duracion de los turnos</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-4">
            <Input
              label="Duracion del turno"
              name="defaultSlotDurationMinutes"
              type="number"
              min={1}
              value={String(form.defaultSlotDurationMinutes)}
              onValueChange={(v) => setForm((f) => ({ ...f, defaultSlotDurationMinutes: Math.max(1, parseInt(v, 10) || 30) }))}
              endContent={<span className="text-sm text-slate-500">minutos</span>}
              isDisabled={saving}
            />
            <Typography variant="p" size="sm" color="gray" opacity={70}>
              Define la duración de los turnos. Por ejemplo, si la duración es 30 minutos, se podrán reservar turnos a las 15:00, 15:30, 16:00, etc.
            </Typography>
          </div>
          <div className="flex flex-col space-y-4">
            <Input
              label="Margen de tiempo"
              name="defaultSlotMarginMinutes"
              type="number"
              min={0}
              value={String(form.defaultSlotMarginMinutes)}
              onValueChange={(v) => setForm((f) => ({ ...f, defaultSlotMarginMinutes: Math.max(0, parseInt(v, 10) || 0) }))}
              endContent={<span className="text-sm text-slate-500">minutos</span>}
              isDisabled={saving}
            />
            <Typography variant="p" size="sm" color="gray" opacity={70}>
              Define el margen de tiempo entre turnos. Para que tengas tiempo "libre" entre los turnos. Si el margen es 15 min, no se podrán seleccionar turnos consecutivos.
            </Typography>
          </div>
        </div>
        <Typography variant="p" size="sm" color="gray" opacity={70}>
           Estos valores podra ser pisados por cada servicio que agregues. Pero, si no creas servicios o no defines estos valores en los servicios, se tomarán estos valores por defecto para todos los turnos.
        </Typography>
      </div>
      <Divider className="my-4" />
      <Button variant="solid" color="primary" className="ml-auto w-fit" onPress={handleSave} isLoading={saving}>
        Guardar
      </Button>
    </div>
  );
};
