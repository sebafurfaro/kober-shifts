"use client";

import * as React from "react";
import { PanelHeader } from "../components/PanelHeader";
import { Paper, Grid, Container, Stack, Typography, Switch, CircularProgress, Alert, Box } from "@mui/material";
import { useParams } from "next/navigation";
import { AlertDialog } from "../components/alerts/AlertDialog";
import { styled } from "@mui/material/styles";
import { SwitchProps } from "@mui/material";

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

  const IOSSwitch = styled((props: SwitchProps) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
  ))(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
      padding: 0,
      margin: "2px",
      transitionDuration: '300ms',
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          backgroundColor: '#2e72caff',
          opacity: 1,
          border: 0,
          ...theme.applyStyles('dark', {
            backgroundColor: '#2e72caff',
          }),
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5,
        },
      },
      '&.Mui-focusVisible .MuiSwitch-thumb': {
        color: '#2e72ca',
        border: '6px solid #fff',
      },
      '&.Mui-disabled .MuiSwitch-thumb': {
        color: theme.palette.grey[100],
        ...theme.applyStyles('dark', {
          color: theme.palette.grey[600],
        }),
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.7,
        ...theme.applyStyles('dark', {
          opacity: 0.3,
        }),
      },
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 22,
      height: 22,
    },
    '& .MuiSwitch-track': {
      borderRadius: 26 / 2,
      backgroundColor: '#E9E9EA',
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500,
      }),
      ...theme.applyStyles('dark', {
        backgroundColor: '#39393D',
      }),
    },
  }));

  if (loading) {
    return (
      <Container maxWidth="md" className="mt-8">
        <Box className="flex justify-center items-center py-16">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="mt-8">
      <PanelHeader
        title="Configuraciones"
        subtitle={`Hola, ${userName}. Configura tu centro de trabajo.`}
      />
      {error && (
        <Alert 
          severity="error" 
          className="mb-6 animate-fade-in" 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      <Stack spacing={2}>
        <Paper className="p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <Typography fontWeight={700} className="mb-6 text-gray-800">
            Notificaciones
          </Typography>
          <Box className="mt-4 space-y-4">
            {notifications.map((notif) => (
              <Grid 
                container 
                spacing={2} 
                key={notif.key} 
                className="items-center py-3 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-150 rounded-md"
              >
                <Grid item xs={10}>
                  <Typography fontWeight={500} className="text-gray-700">
                    {notif.title}
                  </Typography>
                </Grid>
                <Grid item xs={2} className="flex justify-end">
                  <IOSSwitch
                    checked={settings.notifications[notif.key]}
                    onChange={() => handleToggle(notif.key)}
                    disabled={saving}
                    className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-all duration-200"
                  />
                </Grid>
              </Grid>
            ))}
          </Box>
        </Paper>
      </Stack>

      {/* Success Dialog */}
      <AlertDialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, message: "" })}
        message={successDialog.message}
        type="success"
        title="Éxito"
      />
    </Container>
  );
}


