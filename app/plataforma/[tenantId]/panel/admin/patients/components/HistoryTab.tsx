"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@heroui/react";

interface Appointment {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  notes?: string | null;
  cancellationReason?: string | null;
  professional: { id: string; name: string };
  location: { id: string; name: string; address?: string | null };
  service?: { id: string; name: string; price?: number } | null;
}

const STATUS_MAP: Record<string, { label: string; color: "success" | "warning" | "danger" | "default" | "primary" }> = {
  CONFIRMED: { label: "Confirmado", color: "success" },
  REQUESTED: { label: "Solicitado", color: "warning" },
  PENDING_DEPOSIT: { label: "Seña pendiente", color: "warning" },
  CANCELLED: { label: "Cancelado", color: "danger" },
  ATTENDED: { label: "Atendido", color: "primary" },
};

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function durationMinutes(startAt: string, endAt: string): number {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

interface HistoryTabProps {
  appointments: Appointment[];
  loading: boolean;
}

export const HistoryTab = ({ appointments, loading }: HistoryTabProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner label="Cargando turnos..." />
      </div>
    );
  }

  if (appointments.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">Sin turnos registrados</p>;
  }

  const totalMinutes = appointments.reduce((acc, a) => acc + durationMinutes(a.startAt, a.endAt), 0);
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3 px-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{appointments.length}</span> turnos
        </div>
        <div className="flex items-center gap-2 text-sm text-red-500">
          <span className="font-medium">{cancelledCount}</span> cancelados
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          Duración total: <span className="font-medium">{formatDuration(totalMinutes)}</span>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <Table aria-label="Historial de turnos" removeWrapper>
          <TableHeader>
            <TableColumn>Fecha</TableColumn>
            <TableColumn>Profesional</TableColumn>
            <TableColumn>Servicio</TableColumn>
            <TableColumn>Sede</TableColumn>
            <TableColumn>Duración</TableColumn>
            <TableColumn>Estado</TableColumn>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => {
              const st = STATUS_MAP[apt.status] ?? { label: apt.status, color: "default" as const };
              const dur = durationMinutes(apt.startAt, apt.endAt);
              return (
                <TableRow key={apt.id}>
                  <TableCell><span className="text-sm">{formatDateTime(apt.startAt)}</span></TableCell>
                  <TableCell><span className="text-sm">{apt.professional.name}</span></TableCell>
                  <TableCell><span className="text-sm">{apt.service?.name ?? "—"}</span></TableCell>
                  <TableCell><span className="text-sm">{apt.location.name}</span></TableCell>
                  <TableCell><span className="text-sm">{formatDuration(dur)}</span></TableCell>
                  <TableCell><Chip size="sm" color={st.color} variant="flat">{st.label}</Chip></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden flex-col divide-y divide-gray-100">
        {appointments.map((apt) => {
          const st = STATUS_MAP[apt.status] ?? { label: apt.status, color: "default" as const };
          const dur = durationMinutes(apt.startAt, apt.endAt);
          return (
            <div key={apt.id} className="px-2 py-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{formatDateTime(apt.startAt)}</span>
                <Chip size="sm" color={st.color} variant="flat">{st.label}</Chip>
              </div>
              <span className="text-xs text-gray-500">{apt.professional.name} · {apt.location.name}</span>
              {apt.service && <span className="text-xs text-gray-400">{apt.service.name}</span>}
              <span className="text-xs text-gray-400">{formatDuration(dur)}</span>
              {apt.cancellationReason && (
                <span className="text-xs text-red-400">Motivo: {apt.cancellationReason}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
