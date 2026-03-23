"use client";

import * as React from "react";
import { Button, Input } from "@heroui/react";
import { Plus, Trash2, Edit, X, Save } from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotepadTabProps {
  notes: Note[];
  onSave: (notes: Note[]) => Promise<void>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function stripHtml(html: string): string {
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }
  return html.replace(/<[^>]*>/g, "");
}

export const NotepadTab = ({ notes, onSave }: NotepadTabProps) => {
  const [list, setList] = React.useState<Note[]>(notes);
  const [search, setSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Editor state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editorTitle, setEditorTitle] = React.useState("");
  const [editorContent, setEditorContent] = React.useState("");
  const [showEditor, setShowEditor] = React.useState(false);

  React.useEffect(() => {
    setList(notes);
  }, [notes]);

  const filtered = React.useMemo(() => {
    let result = [...list];
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q));
    }

    if (dateFilter) {
      result = result.filter((n) => n.createdAt.startsWith(dateFilter));
    }

    return result;
  }, [list, search, dateFilter]);

  const openNew = () => {
    setEditingId(null);
    setEditorTitle("");
    setEditorContent("");
    setShowEditor(true);
  };

  const openEdit = (note: Note) => {
    setEditingId(note.id);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingId(null);
    setEditorTitle("");
    setEditorContent("");
  };

  const handleSave = async () => {
    if (!editorTitle.trim()) return;
    const now = new Date().toISOString();
    let updated: Note[];

    if (editingId) {
      updated = list.map((n) =>
        n.id === editingId
          ? { ...n, title: editorTitle.trim(), content: editorContent, updatedAt: now }
          : n
      );
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: editorTitle.trim(),
        content: editorContent,
        createdAt: now,
        updatedAt: now,
      };
      updated = [...list, newNote];
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(updated);
      setList(updated);
      closeEditor();
    } catch {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = list.filter((n) => n.id !== id);
    setSaving(true);
    setError(null);
    try {
      await onSave(updated);
      setList(updated);
      if (editingId === id) closeEditor();
    } catch {
      setError("Error al eliminar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onValueChange={setSearch}
          size="sm"
          isClearable
          onClear={() => setSearch("")}
          className="flex-1"
        />
        <Input
          type="date"
          value={dateFilter}
          onValueChange={setDateFilter}
          size="sm"
          className="sm:w-44"
          isClearable
          onClear={() => setDateFilter("")}
          aria-label="Filtrar por fecha"
        />
        <Button
          size="sm"
          color="primary"
          variant="flat"
          onPress={openNew}
          startContent={<Plus className="w-4 h-4" />}
        >
          Nueva nota
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Editor */}
      {showEditor && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {editingId ? "Editar nota" : "Nueva nota"}
            </p>
            <Button isIconOnly size="sm" variant="light" onPress={closeEditor} aria-label="Cerrar">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Input
            label="Título"
            value={editorTitle}
            onValueChange={setEditorTitle}
            size="sm"
            isDisabled={saving}
          />
          <TiptapEditor content={editorContent} onChange={setEditorContent} />
          <div className="flex justify-end">
            <Button
              size="sm"
              color="primary"
              onPress={handleSave}
              isDisabled={!editorTitle.trim() || saving}
              isLoading={saving}
              startContent={!saving ? <Save className="w-4 h-4" /> : undefined}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}

      {/* Note list */}
      {filtered.length === 0 && !showEditor && (
        <p className="text-sm text-gray-400 text-center py-6">Sin notas</p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((note) => {
          const preview = stripHtml(note.content).slice(0, 120);
          return (
            <div
              key={note.id}
              className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => openEdit(note)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") openEdit(note); }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{note.title}</p>
                {preview && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{preview}</p>
                )}
                <p className="text-xs text-gray-300 mt-1">{formatDate(note.updatedAt)}</p>
              </div>
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => openEdit(note)}
                  aria-label="Editar"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => handleDelete(note.id)}
                  isDisabled={saving}
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
