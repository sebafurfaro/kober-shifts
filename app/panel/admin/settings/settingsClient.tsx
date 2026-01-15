"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { PanelHeader } from "../../components/PanelHeader";
import { Refresh as RefreshIcon } from "@mui/icons-material";
type Settings = {
  branding: {
    siteName: string;
    logoDataUrl?: string;
    address: {
      country?: string;
      province?: string;
      city?: string;
      street?: string;
      number?: string;
      floor?: string;
      apartment?: string;
      postalCode?: string;
    };
    socials: {
      whatsapp?: string;
      facebook?: string;
      x?: string;
      instagram?: string;
      youtube?: string;
    };
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    links: string;
    linksHover: string;
  };
  borders: {
    borderWidth: number;
    borderRadius: number;
  };
  sections: {
    showLocations: boolean;
    showSpecialties: boolean;
  };
  updatedAt: string;
};

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function pngOrJpgToWebpDataUrl(file: File): Promise<{ dataUrl: string; size: number }> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to convert to webp"))),
      "image/webp",
      0.92,
    );
  });

  return { dataUrl: await fileToDataUrl(blob), size: blob.size };
}

function mergePatch(prev: Settings, patch: Partial<Settings>): Settings {
  return {
    ...prev,
    ...patch,
    branding: {
      ...prev.branding,
      ...(patch.branding ?? {}),
      address: { ...prev.branding.address, ...(patch.branding?.address ?? {}) },
      socials: { ...prev.branding.socials, ...(patch.branding?.socials ?? {}) },
    },
    colors: { ...prev.colors, ...(patch.colors ?? {}) },
    borders: { ...prev.borders, ...(patch.borders ?? {}) },
    sections: { ...prev.sections, ...(patch.sections ?? {}) },
  };
}

export function SettingsClient() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const [settings, setSettings] = React.useState<Settings | null>(null);

  const saveTimer = React.useRef<number | null>(null);
  const latestSettings = React.useRef<Settings | null>(null);
  latestSettings.current = settings;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/style-config", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar settings");
      const json = (await res.json()) as Settings;
      setSettings(json);
      setSavedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function save(next: Settings) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/style-config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          branding: next.branding,
          colors: next.colors,
          borders: next.borders,
          sections: next.sections,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar settings");
      const json = (await res.json()) as Settings;
      setSettings(json);
      setSavedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function scheduleAutosave(next: Settings) {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const latest = latestSettings.current;
      if (latest) void save(latest);
    }, 650);
  }

  React.useEffect(() => {
    void load();
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !settings) {
    return (
      <Box sx={{ py: 6 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Cargando settings...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <PanelHeader title="Settings" subtitle="Configuración visual (solo admin)." />

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => void save(settings)}
          disabled={saving}
        >
          Guardar
        </Button>
        <Button onClick={() => void load()} disabled={saving} sx={{ color: "primary.main" }}>
          <RefreshIcon />
        </Button>
        <Typography variant="body2" color="text.secondary">
          {saving ? "Guardando..." : savedAt ? `Último guardado: ${new Date(savedAt).toLocaleString()}` : null}
        </Typography>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {/* [Branding] */}
      <Box sx={{ mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Branding
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre del sitio"
                  value={settings.branding.siteName}
                  onChange={(e) => {
                    const next = mergePatch(settings, {
                      branding: { siteName: e.target.value },
                    } as any);
                    setSettings(next);
                    scheduleAutosave(next);
                  }}
                  autoComplete="off"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Typography variant="body2" fontWeight={600}>
                    Logo (png/jpg/svg, máx 300KB)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={saving}
                  >
                    Cargar logo
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 300 * 1024) {
                          setError("El archivo supera 300KB");
                          return;
                        }
                        setError(null);
                        try {
                          let dataUrl: string;
                          let outSize = file.size;
                          if (file.type === "image/png" || file.type === "image/jpeg") {
                            const out = await pngOrJpgToWebpDataUrl(file);
                            dataUrl = out.dataUrl;
                            outSize = out.size;
                            if (outSize > 300 * 1024) {
                              throw new Error("El WebP convertido supera 300KB (probá un logo más chico).");
                            }
                          } else {
                            // svg: store as data URL (no conversion)
                            dataUrl = await fileToDataUrl(file);
                          }

                          const next = mergePatch(settings, {
                            branding: { logoDataUrl: dataUrl },
                          } as any);
                          setSettings(next);
                          // autosave inmediato al subir logo
                          void save(next);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Error al cargar logo");
                        } finally {
                          // allow re-upload same file
                          e.target.value = "";
                        }
                      }}
                    />
                  </Button>

                  {settings.branding.logoDataUrl ? (
                    <Box
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.default",
                      }}
                    >
                      <Box
                        component="img"
                        src={settings.branding.logoDataUrl}
                        alt="Logo"
                        sx={{ maxHeight: 64, maxWidth: "100%" }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin logo cargado
                    </Typography>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Dirección
                </Typography>
              </Grid>
              {(
                [
                  ["country", "País"],
                  ["province", "Provincia"],
                  ["city", "Ciudad"],
                  ["street", "Calle"],
                  ["number", "Altura"],
                  ["floor", "Piso"],
                  ["apartment", "Depto"],
                  ["postalCode", "Código postal"],
                ] as const
              ).map(([key, label]) => (
                <Grid key={key} item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label={label}
                    value={(settings.branding.address as any)[key] ?? ""}
                    onChange={(e) => {
                      const next = mergePatch(settings, {
                        branding: { address: { [key]: e.target.value } },
                      } as any);
                      setSettings(next);
                      scheduleAutosave(next);
                    }}
                    autoComplete="off"
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Redes sociales
                </Typography>
              </Grid>
              {(
                [
                  ["whatsapp", "Whatsapp"],
                  ["facebook", "Facebook"],
                  ["x", "X"],
                  ["instagram", "Instagram"],
                  ["youtube", "Youtube"],
                ] as const
              ).map(([key, label]) => (
                <Grid key={key} item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={label}
                    value={(settings.branding.socials as any)[key] ?? ""}
                    onChange={(e) => {
                      const next = mergePatch(settings, {
                        branding: { socials: { [key]: e.target.value } },
                      } as any);
                      setSettings(next);
                      scheduleAutosave(next);
                    }}
                    autoComplete="off"
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* [Colores] */}
      <Box sx={{ mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Colores
            </Typography>
            <Grid container spacing={2}>
              {(
                [
                  ["primary", "Color primario"],
                  ["secondary", "Color secundario"],
                  ["accent", "Color accent"],
                  ["background", "Color de fondo"],
                  ["text", "Color textos"],
                  ["links", "Color links"],
                  ["linksHover", "Color links hover"],
                ] as const
              ).map(([key, label]) => (
                <Grid key={key} item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label={label}
                    type="color"
                    value={(settings.colors as any)[key] ?? "#000000"}
                    onChange={(e) => {
                      const next = mergePatch(settings, {
                        colors: { [key]: e.target.value },
                      } as any);
                      setSettings(next);
                      scheduleAutosave(next);
                    }}
                    sx={{
                      "& input": { height: 40, padding: 0 },
                    }}
                    autoComplete="off"
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* [Bordes] */}
      <Box sx={{ mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Bordes
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Tamaño de borde"
                  type="number"
                  value={settings.borders.borderWidth}
                    onChange={(e) => {
                    const next = mergePatch(settings, {
                      borders: { borderWidth: Number(e.target.value || 0), borderRadius: settings.borders.borderRadius },
                    });
                    setSettings(next);
                    scheduleAutosave(next);
                  }}
                  autoComplete="off"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Curvatura de borde"
                  type="number"
                  value={settings.borders.borderRadius}
                  onChange={(e) => {
                    const next = mergePatch(settings, {
                      borders: { borderRadius: Number(e.target.value || 0), borderWidth: settings.borders.borderWidth },
                    });
                    setSettings(next);
                    scheduleAutosave(next);
                  }}
                  autoComplete="off"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* [Configuración de Secciones] */}
      <Box sx={{ mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Configuración de Secciones
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sections?.showLocations ?? false}
                    onChange={(e) => {
                      const next = mergePatch(settings, {
                        sections: {
                          showLocations: e.target.checked,
                          showSpecialties: settings.sections?.showSpecialties ?? true,
                        },
                      });
                      setSettings(next);
                      scheduleAutosave(next);
                    }}
                  />
                }
                label="Mostrar Sedes"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sections?.showSpecialties ?? true}
                    onChange={(e) => {
                      const next = mergePatch(settings, {
                        sections: {
                          showLocations: settings.sections?.showLocations ?? false,
                          showSpecialties: e.target.checked,
                        },
                      });
                      setSettings(next);
                      scheduleAutosave(next);
                    }}
                  />
                }
                label="Mostrar Especialidades"
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}


