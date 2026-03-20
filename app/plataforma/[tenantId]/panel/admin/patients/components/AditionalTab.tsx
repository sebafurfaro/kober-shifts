"use client";

import * as React from "react";
import { Button, Input, Textarea } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";

interface Item {
  id: string;
  title: string;
  description: string;
}

interface AditionalTabProps {
  items: Item[];
  onSave: (items: Item[]) => Promise<void>;
}

export const AditionalTab = ({ items, onSave }: AditionalTabProps) => {
  const [list, setList] = React.useState<Item[]>(items);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setList(items);
  }, [items]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    const newItem: Item = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
    };
    const updated = [...list, newItem];
    setSaving(true);
    setError(null);
    try {
      await onSave(updated);
      setList(updated);
      setTitle("");
      setDescription("");
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
        <div className="flex flex-col gap-3">
          {list.map((item) => (
            <div key={item.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-0.5 whitespace-pre-wrap">{item.description}</p>
                )}
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
        <p className="text-sm text-gray-400 text-center py-4">Sin información adicional</p>
      )}

      <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agregar campo</p>
        <Input
          label="Título"
          value={title}
          onValueChange={setTitle}
          size="sm"
          isDisabled={saving}
        />
        <Textarea
          label="Descripción"
          value={description}
          onValueChange={setDescription}
          size="sm"
          minRows={2}
          isDisabled={saving}
        />
        <Button
          size="sm"
          color="primary"
          variant="flat"
          onPress={handleAdd}
          isDisabled={!title.trim() || saving}
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
