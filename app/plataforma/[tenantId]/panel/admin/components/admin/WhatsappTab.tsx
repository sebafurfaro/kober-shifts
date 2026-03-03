"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Typography } from "@/app/components/Typography";
import { Switch, Select, SelectItem, Divider, Button } from "@heroui/react";

const REMINDER_OPTIONS = [
  { key: "48_and_24", label: "48hs y 24hs antes" },
  { key: "48", label: "48hs antes" },
  { key: "24", label: "24hs antes" },
] as const;

export const WhatsappTab = () => {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [whatsappEnabled, setWhatsappEnabled] = React.useState(false);
  const [whatsappReminderOption, setWhatsappReminderOption] = React.useState<string>("48");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    fetch(`/api/plataforma/${tenantId}/admin/settings`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setWhatsappEnabled(Boolean(data.notifications?.whatsapp));
        const opt = data.whatsappReminderOption;
        setWhatsappReminderOption(
          opt === "48" || opt === "24" || opt === "48_and_24" ? opt : "48"
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      await fetch(`/api/plataforma/${tenantId}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notifications: { whatsapp: whatsappEnabled },
          whatsappReminderOption,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="max-w-1/2 w-full flex flex-col space-y-6 p-4">
        <Typography variant="h4" color="black">Recordatorios de turnos</Typography>
        <Switch
          isSelected={whatsappEnabled}
          onValueChange={setWhatsappEnabled}
          isDisabled={saving}
        >
          Enviar recordatorios de turnos por WhatsApp
        </Switch>
        <p className="text-sm text-slate-500">
          Activa esta opción para enviar recordatorios automáticos a tus clientes antes de sus turnos. Esto puede ayudar a reducir las ausencias y mantener a tus clientes informados sobre sus citas.
        </p>
        <Divider className="my-4" />
        <Select
          label="Tiempo de anticipación para enviar el recordatorio"
          placeholder="Selecciona una opción"
          selectedKeys={whatsappReminderOption ? [whatsappReminderOption] : []}
          onSelectionChange={(keys) => {
            const k = Array.from(keys)[0] as string;
            if (k) setWhatsappReminderOption(k);
          }}
          isDisabled={saving}
        >
          {REMINDER_OPTIONS.map((o) => (
            <SelectItem key={o.key}>{o.label}</SelectItem>
          ))}
        </Select>
        <p className="text-sm text-slate-500">Recordá que cada recordatorio se descuenta de tu paquete contratado.</p>
      </div>
      <Divider className="my-4" />
      <Button variant="solid" color="primary" className="ml-auto w-fit" onPress={handleSave} isLoading={saving}>
        Guardar
      </Button>
    </div>
  );
};
