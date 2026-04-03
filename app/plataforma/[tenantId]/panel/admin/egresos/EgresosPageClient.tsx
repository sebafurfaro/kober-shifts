"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { Pencil, Trash2 } from "lucide-react";
import Typography from "@/app/components/Typography";
import { PanelHeader } from "../../components/PanelHeader";
import { Section } from "../../components/layout/Section";
import { useParams } from "next/navigation";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { EgresoFormModal, type EgresoFormValues } from "./components/EgresoFormModal";
import { EXPENSE_CATEGORY_SUGGESTIONS } from "@/lib/tenant-expense-categories";

type Expense = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  isRecurring: boolean;
};

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

function formatDisplayDate(ymd: string): string {
  if (!ymd) return "-";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString("es-AR");
}

function expenseToFormValues(e: Expense): EgresoFormValues {
  return {
    title: e.title,
    category: e.category,
    description: e.description ?? "",
    amount: String(e.amount),
    expenseDate: e.expenseDate.slice(0, 10),
    isRecurring: e.isRecurring,
  };
}

export default function EgresosPageClient() {
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [items, setItems] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [confirmDelete, setConfirmDelete] = React.useState<Expense | null>(null);
  const [alert, setAlert] = React.useState<{
    open: boolean;
    message: string;
    type: "error" | "success";
  }>({ open: false, message: "", type: "error" });

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (debouncedSearch) q.set("search", debouncedSearch);
      if (dateFilter) q.set("date", dateFilter);
      if (categoryFilter) q.set("category", categoryFilter);
      const res = await fetch(`/api/plataforma/${tenantId}/admin/egresos?${q}`, {
        credentials: "include",
      });
      if (res.status === 403) {
        setItems([]);
        setAlert({ open: true, message: "Solo administradores pueden ver egresos.", type: "error" });
        return;
      }
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setItems(Array.isArray(data.expenses) ? data.expenses : []);
    } catch {
      setItems([]);
      setAlert({ open: true, message: "No se pudieron cargar los egresos.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [tenantId, debouncedSearch, dateFilter, categoryFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setModalOpen(true);
  };

  const parseAmount = (s: string): number => {
    const n = Number(String(s).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };

  const handleSubmitForm = async (form: EgresoFormValues) => {
    const amount = parseAmount(form.amount);
    if (!form.title.trim() || !form.category) {
      setAlert({ open: true, message: "Completá título y categoría.", type: "error" });
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setAlert({ open: true, message: "Monto inválido.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim() || null,
        amount,
        expenseDate: form.expenseDate,
        isRecurring: form.isRecurring,
      };
      const url = editing
        ? `/api/plataforma/${tenantId}/admin/egresos/${editing.id}`
        : `/api/plataforma/${tenantId}/admin/egresos`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      setModalOpen(false);
      setEditing(null);
      await load();
      setAlert({ open: true, message: editing ? "Egreso actualizado." : "Egreso guardado.", type: "success" });
    } catch (e: unknown) {
      setAlert({
        open: true,
        message: e instanceof Error ? e.message : "Error al guardar",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/admin/egresos/${confirmDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setConfirmDelete(null);
      await load();
      setAlert({ open: true, message: "Egreso eliminado.", type: "success" });
    } catch {
      setAlert({ open: true, message: "Error al eliminar.", type: "error" });
    }
  };

  return (
    <Section>
      <PanelHeader
        title="Egresos del comercio"
        subtitle="Gastos variables y recurrentes del negocio."
        action={{ label: "Nuevo egreso", onClick: openCreate }}
      />

      <div className="flex flex-col md:flex-row gap-3 md:items-end mb-6 flex-wrap">
        <Input
          className="max-w-md"
          label="Buscar"
          placeholder="Título, categoría o descripción"
          value={searchInput}
          onValueChange={setSearchInput}
        />
        <Input
          type="date"
          label="Fecha"
          className="w-full sm:w-44"
          value={dateFilter}
          onValueChange={setDateFilter}
        />
        <Select
          label="Categoría"
          className="w-full sm:w-52"
          placeholder="Todas"
          selectedKeys={categoryFilter ? new Set([categoryFilter]) : new Set(["all"])}
          onSelectionChange={(keys) => {
            const k = Array.from(keys)[0];
            setCategoryFilter(k === "all" || k == null ? "" : String(k));
          }}
        >
          {[
            <SelectItem key="all">Todas</SelectItem>,
            ...EXPENSE_CATEGORY_SUGGESTIONS.map((c) => (
              <SelectItem key={c}>{c}</SelectItem>
            )),
          ]}
        </Select>
      </div>

      <div className="rounded-xl border border-default-200 overflow-hidden">
        <Table aria-label="Egresos">
          <TableHeader>
            <TableColumn>Título</TableColumn>
            <TableColumn>Categoría</TableColumn>
            <TableColumn>Fecha</TableColumn>
            <TableColumn>Monto</TableColumn>
            <TableColumn align="end">Acciones</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={loading}
            loadingContent={<Spinner label="Cargando..." />}
            emptyContent={loading ? " " : "No hay egresos para los filtros elegidos"}
          >
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{row.title}</p>
                    {row.isRecurring && (
                      <span className="text-xs text-primary">Recurrente mensual</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{formatDisplayDate(row.expenseDate)}</TableCell>
                <TableCell>{formatMoney(row.amount)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      isIconOnly
                      aria-label="Editar"
                      onPress={() => openEdit(row)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      isIconOnly
                      aria-label="Eliminar"
                      onPress={() => setConfirmDelete(row)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Typography variant="p" className="text-sm text-default-500 mt-4">
        Los egresos marcados como recurrentes representan un gasto que se repite cada mes (referencia
        por fecha y categoría).
      </Typography>

      <EgresoFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmitForm}
        initial={editing ? expenseToFormValues(editing) : null}
        title={editing ? "Editar egreso" : "Nuevo egreso"}
        submitLabel={editing ? "Guardar" : "Crear"}
        isSubmitting={submitting}
      />

      <ConfirmationDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar egreso"
        message={
          confirmDelete
            ? `¿Eliminar «${confirmDelete.title}» (${formatMoney(confirmDelete.amount)})?`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="error"
      />

      <AlertDialog
        open={alert.open}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}
        message={alert.message}
        type={alert.type}
      />
    </Section>
  );
}
