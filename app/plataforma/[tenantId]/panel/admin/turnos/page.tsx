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
  Divider,
  Select,
  SelectItem,
} from "@heroui/react";
import { CircleCheck, CircleX, Hand, MapPin, MessageCircle, Plus, Search } from "lucide-react";
import { PanelHeader } from "../../components/PanelHeader";
import { ConfirmationDialog } from "../../components/alerts/ConfirmationDialog";
import { AlertDialog } from "../../components/alerts/AlertDialog";
import { useParams } from "next/navigation";
import { useAppointmentsInvalidationStore } from "@/lib/appointments-invalidation-store";
import { CreateTurnoDialog } from "./CreateTurnoDialog";
import Typography from "@/app/components/Typography";
import { Section } from "../../components/layout/Section";

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
  const day = d.getDate().toString().padStart(2, "0");
  let month = d.toLocaleString("es-AR", { month: "long", timeZone: AR_TZ });
  month = month.slice(0, 3);
  let hour = d.getHours();
  const minute = d.getMinutes().toString().padStart(2, "0");
  const ampm = hour >= 12 ? "p.m." : "a.m.";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${day} ${month}, ${hour}:${minute} ${ampm}`;
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
    <Section>
      <PanelHeader
          title="Turnos"
          subtitle="Podrás ver todos los turnos registrados"
        />

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-slate-800 p-4">
          <CardBody className="p-0">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="hidden md:flex flex-wrap gap-2">
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
              <div className="block md:hidden w-full pr-4">
                <Select placeholder="Filtra por fecha" fullWidth>
                  {(
                  [
                    { key: "proximos" as const, label: "Próximos" },
                    { key: "hoy" as const, label: "Hoy" },
                    { key: "manana" as const, label: "Mañana" },
                    { key: "todos" as const, label: "Todos" },
                  ] as const
                ).map(({ key, label }) => (
                  <SelectItem
                    key={key}
                    variant={filter === key ? "solid" : "bordered"}
                    color="primary"
                    onPress={() => {
                      setFilter(key);
                      setPage(1);
                    }}
                  >
                    {label}
                  </SelectItem>
                ))}
                </Select>
              </div>
              
                <Button
                  color="primary"
                  className="rounded-full flex items-center justify-center p-0 md:p-4 min-w-10! w-10! min-h-10! h-10! md:min-w-14! md:w-14! md:min-h-14! md:h-14!"
                  onPress={() => setCreateDialogOpen(true)}
                  aria-label="Agregar turno"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                
            </div>

            <div className="w-full md:w-48 py-3">
              <Input
                type="text"
                placeholder="Buscar turno"
                variant="bordered"
                value={searchInput}
                onValueChange={setSearchInput}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>

            <Divider className="mb-4 block md:hidden" />

            <Table aria-label="Turnos" removeWrapper className="hidden md:block">
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
                      <TableCell className="text-center">
                        <Tooltip content={apt.location?.name ?? "—"} placement="top">
                          <MapPin className="w-4 h-4 text-primary" />
                        </Tooltip>
                      </TableCell>
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

            <div className="flex md:hidden flex-col gap-4">
              {appointments.map((apt) => {
                  const clientName = [apt.patient?.firstName, apt.patient?.lastName].filter(Boolean).join(" ") || apt.patient?.name || "—";
                  const waUrl = whatsAppUrl(apt.patient?.phone);
                  return (
                    <div key={apt.id} className="flex flex-col space-y-3">
                      <Typography variant="h6" color="black">{clientName}</Typography>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1">
                          <Typography variant="p" color="gray" opacity={50}>Fecha</Typography>
                          <Typography variant="p">{formatDateTime(apt.startAt)}</Typography>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Typography variant="p" color="gray" opacity={50}>Estado</Typography>
                          <Chip size="sm" variant="flat" color={
                          apt.status === "CONFIRMED" ? "success" :
                            apt.status === "CANCELLED" ? "danger" :
                              apt.status === "ATTENDED" ? "primary" : "warning"
                        }>
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </Chip>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1">
                          <Typography variant="p" color="gray" opacity={50}>Profesional</Typography>
                          <Typography variant="p">{apt.professional?.name ?? "—"}</Typography>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Typography variant="p" color="gray" opacity={50}>Sede</Typography>
                          <Typography variant="p">{apt.location?.name ?? "—"}</Typography>
                        </div>
                      </div>

                      {apt.service != null && apt.service?.seniaAmount != null && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1">
                          <Typography variant="p" color="gray" opacity={50}>Servicio</Typography>
                          <Typography variant="p">{apt.service?.name}</Typography>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Typography variant="p" color="gray" opacity={50}>Sede</Typography>
                          <Typography variant="p">{formatPrice(apt.service.seniaAmount)}</Typography>
                        </div>
                      </div>
                      )}
                      <>
                        <div className="flex flex-col gap-1 mt-3">
                          {isConfirmable(apt.status) && (
                              <Button
                                size="sm"
                                variant="solid"
                                color="success"
                                onPress={() => handleConfirm(apt)}
                                aria-label="Confirmar"
                                className="text-white"
                                startContent={<CircleCheck className="w-4 h-4" />}
                              >
                                Confirmar
                              </Button>
                          )}
                          {isCancellable(apt.status) && (                            
                              <Button
                                size="sm"
                                variant="solid"
                                color="danger"
                                onPress={() => setCancelDialog(apt)}
                                aria-label="Cancelar"
                                startContent={<CircleX className="w-4 h-4" />}
                              >
                                Cancelar
                              </Button>
                          )}
                          
                            <Button
                              size="sm"
                              variant="solid"
                              color="primary"
                              isDisabled={apt.status !== "CONFIRMED"}
                              onPress={() => apt.status === "CONFIRMED" && handleMarkAttended(apt)}
                              aria-label="Tomado"
                              startContent={<Hand className="w-4 h-4" />}
                            >
                              Atendido
                            </Button>
                         
                          {waUrl && (
                              <Button
                                size="sm"
                                variant="faded"
                                as="a"
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className="text-emerald-500 hover:text-emerald-600"
                                startContent={<MessageCircle className="w-4 h-4" />}
                              >
                                Contactar
                              </Button>
                          )}
                        </div>
                      </>
                      <Divider className="my-4" />
                    </div>
                  );
                })}
            </div>

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
    </Section>
  );
}
