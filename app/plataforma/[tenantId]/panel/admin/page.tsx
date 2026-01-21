"use client";

import * as React from "react";
import { PanelHeader } from "../components/PanelHeader";
import { Card, CardBody, Switch, Spinner, Alert, Input, Button } from "@heroui/react";
import { useParams } from "next/navigation";
import { AlertDialog } from "../components/alerts/AlertDialog";

interface NotificationSettings {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

interface Settings {
  notifications: NotificationSettings;
}

export default function AdminPanelPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [userName, setUserName] = React.useState<string>("");
  const [settings, setSettings] = React.useState<Settings>({
    notifications: {
      whatsapp: false,
      sms: false,
      email: false,
    },
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
          setSettings(data);
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

  const notifications = [
    {
      key: "whatsapp" as const,
      title: "Notificaciones por WhatsApp",
    },
    {
      key: "sms" as const,
      title: "Notificaciones por SMS",
    },
    {
      key: "email" as const,
      title: "Notificaciones por email",
    },
  ];


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
              Notificaciones
            </h3>
            <div className="mt-4 space-y-4">
              {notifications.map((notif) => (
                <div 
                  key={notif.key} 
                  className="flex items-center justify-between py-3 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-150 rounded-md"
                >
                  <p className="font-medium text-gray-700 flex-1">
                    {notif.title}
                  </p>
                  <div className="flex justify-end">
                    <Switch
                      isSelected={settings.notifications[notif.key]}
                      onValueChange={() => handleToggle(notif.key)}
                      isDisabled={saving}
                      color="primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card className="p-6">
          <CardBody className="p-0">
            <h3 className="font-bold mb-6 text-gray-800 text-lg">
              Configuración general de turnos
            </h3>
            <div className="flex gap-2 items-center text-slate-800">
              Permitir cancelacion de turnos hasta 
              <Input
                type="number"
                value={settings.cancelationLimit}
                onChange={(e) => setSettings({ ...settings, cancelationLimit: parseInt(e.target.value) })}
                isDisabled={saving}
                color="default"
                variant="bordered"
                className="w-24"
              />
              dias antes del turno
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


