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
  Card,
  CardBody,
  Spinner,
  Pagination,
  Tooltip,
  Chip,
  Input,
} from "@heroui/react";
import { CircleCheck, CircleX, Hand, MessageCircle, Plus, Search } from "lucide-react";
import { PanelHeader } from "../../components/PanelHeader";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useParams } from "next/navigation";
import { useAppointmentsInvalidationStore } from "@/lib/appointments-invalidation-store";
import { CreateTurnoDialog } from "./CreateTurnoDialog";

type Filter = "proximos" | "hoy" | "manana" | "todos";

interface AppointmentRow {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  patient: { id: string; name: string; firstName?: string | null; lastName?: string | null; email: string; phone?: string | null };
  professional: { id: string; name: string; email: string };
  location: { id: string; name: string; address: string };
  service: { id: string; name: string; price: number; seniaPercent: number; seniaAmount: number | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Pendiente",
  PENDING_DEPOSIT: "Pendiente (seña)",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  ATTENDED: "Atendido",
};

function whatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone || !phone.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const withCountry = digits.startsWith("54") ? digits : digits.startsWith("0") ? "54" + digits.slice(1) : "54" + digits;
  return `https://wa.me/${withCountry}`;
}

const AR_TZ = "America/Argentina/Buenos_Aires";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AR_TZ,
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
}

export default function AdminTurnosPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const appointmentsVersion = useAppointmentsInvalidationStore((s) => s.version);
  const [appointments, setAppointments] = React.useState<AppointmentRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("todos");
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [cancelDialog, setCancelDialog] = React.useState<AppointmentRow | null>(null);
  const [alert, setAlert] = React.useState<{ open: boolean; message: string; type: "error" | "success" }>({ open: false, message: "", type: "error" });

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadAppointments = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ filter, page: String(page) });
      if (search) q.set("search", search);
      const res = await fetch(`/api/plataforma/${tenantId}/admin/appointments?${q}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status} al cargar turnos`);
      }
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      setTotal(Number(data.total) ?? 0);
    } catch (e: any) {
      console.error(e);
      setAppointments([]);
      setTotal(0);
      setAlert({ open: true, message: e?.message || "Error al cargar turnos", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [tenantId, filter, page, search]);

  React.useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  // Refrescar lista cuando se crea/edita/elimina un turno desde el calendario u otro módulo
  const prevVersionRef = React.useRef(appointmentsVersion);
  React.useEffect(() => {
    if (prevVersionRef.current !== appointmentsVersion) {
      prevVersionRef.current = appointmentsVersion;
      loadAppointments();
    }
  }, [appointmentsVersion, loadAppointments]);

  const totalPages = Math.max(1, Math.ceil(total / 10));

  const handleConfirm = async (apt: AppointmentRow) => {
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/${apt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al confirmar");
      await loadAppointments();
      setAlert({ open: true, message: "Turno confirmado", type: "success" });
    } catch (e: any) {
      setAlert({ open: true, message: e?.message || "Error al confirmar", type: "error" });
    }
  };

  const handleMarkAttended = async (apt: AppointmentRow) => {
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/${apt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ATTENDED" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al marcar como tomado");
      await loadAppointments();
      setAlert({ open: true, message: "Turno marcado como atendido", type: "success" });
    } catch (e: any) {
      setAlert({ open: true, message: e?.message || "Error al marcar", type: "error" });
    }
  };

  const handleCancelConfirm = async () => {
    const apt = cancelDialog;
    setCancelDialog(null);
    if (!apt) return;
    try {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments/${apt.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelado desde el panel de turnos" }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cancelar");
      }
      await loadAppointments();
      setAlert({ open: true, message: "Turno cancelado", type: "success" });
    } catch (e: any) {
      setAlert({ open: true, message: e?.message || "Error al cancelar", type: "error" });
    }
  };

  const isPending = (status: string) =>
    status === "REQUESTED" || status === "PENDING_DEPOSIT";
  const isConfirmable = (status: string) => isPending(status);
  const isCancellable = (status: string) => isPending(status) || status === "CONFIRMED";

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="py-8">
        <PanelHeader
          title="Turnos"
          subtitle="Podrás ver todos los turnos registrados"
        />

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-slate-800 p-4">
          <CardBody className="p-0">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "proximos" as const, label: "Próximos" },
                    { key: "hoy" as const, label: "Hoy" },
                    { key: "manana" as const, label: "Mañana" },
                    { key: "todos" as const, label: "Todos" },
                  ] as const
                ).map(({ key, label }) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={filter === key ? "solid" : "bordered"}
                    color="primary"
                    onPress={() => {
                      setFilter(key);
                      setPage(1);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              
                <Button
                  color="primary"
                  className="rounded-full flex items-center justify-center min-w-14! w-14! min-h-14! h-14!"
                  onPress={() => setCreateDialogOpen(true)}
                  aria-label="Agregar turno"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                
            </div>

            <div className="w-48 py-3">
              <Input
                type="text"
                placeholder="Buscar turno"
                variant="bordered"
                value={searchInput}
                onValueChange={setSearchInput}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>

            <Table aria-label="Turnos" removeWrapper>
              <TableHeader>
                <TableColumn>Sucursal</TableColumn>
                <TableColumn>Servicio</TableColumn>
                <TableColumn>Profesional</TableColumn>
                <TableColumn>Cliente</TableColumn>
                <TableColumn>Fecha y hora</TableColumn>
                <TableColumn>Precio</TableColumn>
                <TableColumn>Seña</TableColumn>
                <TableColumn>Estado</TableColumn>
                <TableColumn align="end">Acciones</TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                loadingContent={<Spinner label="Cargando..." />}
                emptyContent={loading ? null : "No hay turnos"}
              >
                {appointments.map((apt) => {
                  const clientName = [apt.patient?.firstName, apt.patient?.lastName].filter(Boolean).join(" ") || apt.patient?.name || "—";
                  const waUrl = whatsAppUrl(apt.patient?.phone);
                  return (
                    <TableRow key={apt.id}>
                      <TableCell>{apt.location?.name ?? "—"}</TableCell>
                      <TableCell>{apt.service?.name ?? "—"}</TableCell>
                      <TableCell>{apt.professional?.name ?? "—"}</TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{formatDateTime(apt.startAt)}</TableCell>
                      <TableCell>{apt.service != null ? formatPrice(apt.service.price) : "—"}</TableCell>
                      <TableCell>{apt.service?.seniaAmount != null ? formatPrice(apt.service.seniaAmount) : "—"}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={
                          apt.status === "CONFIRMED" ? "success" :
                            apt.status === "CANCELLED" ? "danger" :
                              apt.status === "ATTENDED" ? "primary" : "warning"
                        }>
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {isConfirmable(apt.status) && (
                            <Tooltip content="Confirmar" placement="top">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                onPress={() => handleConfirm(apt)}
                                aria-label="Confirmar"
                              >
                                <CircleCheck className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}
                          {isCancellable(apt.status) && (
                            <Tooltip content="Cancelar" placement="top">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => setCancelDialog(apt)}
                                aria-label="Cancelar"
                              >
                                <CircleX className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip content={apt.status === "CONFIRMED" ? "Tomado" : "Solo para turnos confirmados"} placement="top">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              isDisabled={apt.status !== "CONFIRMED"}
                              onPress={() => apt.status === "CONFIRMED" && handleMarkAttended(apt)}
                              aria-label="Tomado"
                            >
                              <Hand className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                          {waUrl && (
                            <Tooltip content="WhatsApp" placement="top">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                as="a"
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className="text-emerald-500 hover:text-emerald-600"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center p-4 border-t border-gray-200">
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={setPage}
                  showControls
                  showShadow
                />
              </div>
            )}
          </CardBody>
        </Card>

        <ConfirmationDialog
          open={!!cancelDialog}
          onClose={() => setCancelDialog(null)}
          onConfirm={handleCancelConfirm}
          title="Cancelar turno"
          message="¿Estás seguro de que deseas cancelar este turno?"
          confirmText="Cancelar turno"
          cancelText="No"
          type="error"
        />

        <AlertDialog
          open={alert.open}
          onClose={() => setAlert((a) => ({ ...a, open: false }))}
          message={alert.message}
          type={alert.type}
        />

        <CreateTurnoDialog
          tenantId={tenantId}
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={loadAppointments}
        />
      </div>
    </div>
  );
}
