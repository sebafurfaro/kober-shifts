"use client";

import * as React from "react";
import { PanelHeader } from "../components/PanelHeader";
import { Card, CardBody, Switch, Spinner, Alert, Button, Select, SelectItem, Textarea } from "@heroui/react";
import { useParams } from "next/navigation";
import { AlertDialog } from "../components/alerts/AlertDialog";
import { useTenantSettingsStore } from "@/lib/tenant-settings-store";

interface NotificationSettings {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

type WhatsappReminderOption = "48" | "24" | "48_and_24";

interface Settings {
  notifications: NotificationSettings;
  cancelationLimit?: number;
  patientLabel?: string;
  professionalLabel?: string;
  cancellationPolicy?: string;
  whatsappReminderOption?: WhatsappReminderOption;
}

function getDefaultCancellationPolicy(cancelationLimit: number): string {
  const hours = cancelationLimit === 1 ? "24hs" : "48hs";
  return `Los turnos pueden ser cancelados con una anticipación de ${hours}, transcurrido ese tiempo no se podrá cancelar. En caso de no poder asistir, se te cobrará el monto de la seña pactada en caso que existiese.`;
}

export default function AdminPanelPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const setTranslations = useTenantSettingsStore((state) => state.setTranslations);
  const [userName, setUserName] = React.useState<string>("");
  const [settings, setSettings] = React.useState<Settings>({
    notifications: {
      whatsapp: false,
      sms: false,
      email: false,
    },
    cancelationLimit: 2,
    patientLabel: "Pacientes",
    professionalLabel: "Profesionales",
    cancellationPolicy: "",
    whatsappReminderOption: "48",
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successDialog, setSuccessDialog] = React.useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  // Load user name and settings
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user info
        const userRes = await fetch(`/api/plataforma/${tenantId}/auth/me`, {
          credentials: "include",
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserName(userData.name || "Administrador");
        }

        // Load settings
        const settingsRes = await fetch(`/api/plataforma/${tenantId}/admin/settings`, {
          credentials: "include",
        });
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const loadedSettings = {
            notifications: data.notifications || {
              whatsapp: false,
              sms: false,
              email: false,
            },
            cancelationLimit: data.cancelationLimit === 1 ? 1 : 2,
            patientLabel: data.patientLabel || "Pacientes",
            professionalLabel: data.professionalLabel || "Profesionales",
            cancellationPolicy:
              typeof data.cancellationPolicy === "string" && data.cancellationPolicy.trim() !== ""
                ? data.cancellationPolicy
                : getDefaultCancellationPolicy(data.cancelationLimit === 1 ? 1 : 2),
            whatsappReminderOption:
              data.whatsappReminderOption === "24" || data.whatsappReminderOption === "48_and_24"
                ? data.whatsappReminderOption
                : "48",
          };
          setSettings(loadedSettings);
          setTranslations({
            patientLabel: loadedSettings.patientLabel,
            professionalLabel: loadedSettings.professionalLabel,
          });
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Error al cargar la configuración");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tenantId]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    // Save previous state for rollback
    const previousSettings = settings;

    // Optimistically update UI
    const newSettings: Settings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    setSettings(newSettings);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar la configuración");
      }

      setSuccessDialog({
        open: true,
        message: "Configuración guardada exitosamente",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err instanceof Error ? err.message : "Error al guardar la configuración");
      // Revert the change on error
      setSettings(previousSettings);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCancelationLimit = async () => {
    // Save previous state for rollback
    const previousSettings = settings;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar la configuración");
      }

      setSuccessDialog({
        open: true,
        message: "Configuración guardada exitosamente",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err instanceof Error ? err.message : "Error al guardar la configuración");
      // Revert the change on error
      setSettings(previousSettings);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsappReminder = async () => {
    const previousSettings = settings;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar la configuración");
      }
      setSuccessDialog({ open: true, message: "Configuración guardada exitosamente" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la configuración");
      setSettings(previousSettings);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCancellationPolicy = async () => {
    const previousSettings = settings;
    const policyToSave =
      settings.cancellationPolicy?.trim() ||
      getDefaultCancellationPolicy(settings.cancelationLimit === 1 ? 1 : 2);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...settings, cancellationPolicy: policyToSave }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar la configuración");
      }
      setSuccessDialog({ open: true, message: "Configuración guardada exitosamente" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la configuración");
      setSettings(previousSettings);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <PanelHeader
        title="Configuraciones"
        subtitle={`Hola, ${userName}. Configura tu centro de trabajo.`}
      />
      {error && (
        <Alert
          color="danger"
          className="mb-6 animate-fade-in"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      <div className="space-y-4">
        <Card className="p-6">
          <CardBody className="p-0">
            <h3 className="font-bold mb-6 text-gray-800 text-lg">
              Configuración general de turnos
            </h3>
            <div className="flex gap-2 items-center flex-wrap text-slate-800">
              Permitir cancelación de turnos hasta
              <Select
                selectedKeys={new Set([String(settings.cancelationLimit === 1 ? 1 : 2)])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];
                  setSettings({ ...settings, cancelationLimit: value === "1" ? 1 : 2 });
                }}
                isDisabled={saving}
                variant="bordered"
                className="w-32"
                aria-label="Antelación para cancelar"
              >
                <SelectItem key="2" className="text-slate-800">48hs</SelectItem>
                <SelectItem key="1" className="text-slate-800">24hs</SelectItem>
              </Select>
              
            </div>
            <div className="flex justify-end mt-4">
            <Button
                className="button button-secondary"
                onPress={() => handleSaveCancelationLimit()}
                isDisabled={saving}
                isLoading={saving}
              >
                Guardar
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="p-6">
          <CardBody className="p-0">
            <h3 className="font-bold mb-6 text-gray-800 text-lg">
              Política de cancelación de turnos y penalización
            </h3>
            <Textarea
              label="Texto de la política"
              value={
                settings.cancellationPolicy !== undefined && settings.cancellationPolicy !== ""
                  ? settings.cancellationPolicy
                  : getDefaultCancellationPolicy(settings.cancelationLimit === 1 ? 1 : 2)
              }
              onValueChange={(value) => setSettings({ ...settings, cancellationPolicy: value })}
              isDisabled={saving}
              variant="bordered"
              minRows={4}
              classNames={{ input: "text-slate-800", inputWrapper: "text-slate-800" }}
            />
            <div className="flex justify-end mt-4">
              <Button
                className="button button-secondary"
                onPress={handleSaveCancellationPolicy}
                isDisabled={saving}
                isLoading={saving}
              >
                Guardar
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="p-6">
          <CardBody className="p-0">
            <h3 className="font-bold mb-6 text-gray-800 text-lg">
              Plazo de recordatorio por WhatsApp
            </h3>
            <Select
              selectedKeys={new Set([settings.whatsappReminderOption ?? "48"])}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as WhatsappReminderOption;
                if (value === "48" || value === "24" || value === "48_and_24") {
                  setSettings({ ...settings, whatsappReminderOption: value });
                }
              }}
              isDisabled={saving}
              variant="bordered"
              className="max-w-xs"
              aria-label="Plazo de recordatorio WhatsApp"
            >
              <SelectItem key="48" className="text-slate-800">48hs</SelectItem>
              <SelectItem key="24" className="text-slate-800">24hs</SelectItem>
              <SelectItem key="48_and_24" className="text-slate-800">48hs y 24hs</SelectItem>
            </Select>
            <p className="text-sm text-gray-600 mt-4">
              Recordá que la opción de 48hs o 24hs, cuenta como un recordatorio. La opción dual de 48hs y 24hs, cuentan como dos recordatorios. Los mismos se descontarán de tu paquete contratado.
            </p>
            <div className="flex justify-end mt-4">
              <Button
                className="button button-secondary"
                onPress={handleSaveWhatsappReminder}
                isDisabled={saving}
                isLoading={saving}
              >
                Guardar
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Success Dialog */}
      <AlertDialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, message: "" })}
        message={successDialog.message}
        type="success"
        title="Éxito"
      />
    </div>
  );
}


