"use client";

import * as React from "react";
import { Button, Input } from "@heroui/react";
import { Plus, Trash2, ExternalLink } from "lucide-react";

interface Archive {
  id: string;
  label: string;
  url: string;
  createdAt: string;
}

interface ArchiveTabProps {
  archives: Archive[];
  onSave: (archives: Archive[]) => Promise<void>;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(url: string): boolean {
  if (!url.startsWith("https://")) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const ArchiveTab = ({ archives, onSave }: ArchiveTabProps) => {
  const [list, setList] = React.useState<Archive[]>(archives);
  const [label, setLabel] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setList(archives);
  }, [archives]);

  const normalizedUrl = normalizeUrl(url);
  const urlValid = url.trim() === "" || isValidUrl(normalizedUrl);

  const handleAdd = async () => {
    if (!label.trim() || !url.trim()) return;
    const finalUrl = normalizedUrl;
    if (!isValidUrl(finalUrl)) return;

    const newItem: Archive = {
      id: crypto.randomUUID(),
      label: label.trim(),
      url: finalUrl,
      createdAt: new Date().toISOString(),
    };
    const updated = [...list, newItem];
    setSaving(true);
    setError(null);
    try {
      await onSave(updated);
      setList(updated);
      setLabel("");
      setUrl("");
    } catch {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    const updated = list.filter((i) => i.id !== id);
    setSaving(true);
    setError(null);
    try {
      await onSave(updated);
      setList(updated);
    } catch {
      setError("Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {list.length > 0 && (
        <div className="flex flex-col gap-2">
          {list.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <div className="flex-1 min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {item.label}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <p className="text-xs text-gray-400 truncate">{item.url}</p>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => handleRemove(item.id)}
                isDisabled={saving}
                aria-label="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {list.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Sin archivos</p>
      )}

      <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agregar enlace</p>
        <Input
          label="Etiqueta"
          value={label}
          onValueChange={setLabel}
          size="sm"
          isDisabled={saving}
        />
        <Input
          label="URL"
          value={url}
          onValueChange={setUrl}
          size="sm"
          isDisabled={saving}
          description="Se antepone https:// automáticamente si no se incluye"
          isInvalid={url.trim() !== "" && !urlValid}
          errorMessage={url.trim() !== "" && !urlValid ? "La URL debe tener formato https:// válido" : undefined}
        />
        <Button
          size="sm"
          color="primary"
          variant="flat"
          onPress={handleAdd}
          isDisabled={!label.trim() || !url.trim() || !urlValid || saving}
          isLoading={saving}
          startContent={!saving ? <Plus className="w-4 h-4" /> : undefined}
        >
          Agregar
        </Button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
};
