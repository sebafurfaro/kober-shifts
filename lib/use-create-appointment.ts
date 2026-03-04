"use client";

import { useCallback } from "react";
import { useAppointmentsInvalidationStore } from "./appointments-invalidation-store";

export interface CreateAppointmentBody {
  patientId: string;
  professionalId: string;
  locationId: string | null;
  serviceId?: string | null;
  startAt: string;
  endAt: string;
  notes?: string | null;
}

export interface CreateAppointmentOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface CreateAppointmentResult {
  appointmentId: string;
  googleEventId?: string | null;
}

/**
 * Hook que abstrae la creación de turnos. Acepta parámetros y opciones (headers, callbacks).
 * Al crear con éxito dispara la invalidación del store para que Calendario y Turnos se actualicen.
 */
export function useCreateAppointment(tenantId: string) {
  const invalidate = useAppointmentsInvalidationStore((s) => s.invalidate);

  const createAppointment = useCallback(
    async (
      body: CreateAppointmentBody,
      options?: CreateAppointmentOptions
    ): Promise<CreateAppointmentResult> => {
      const res = await fetch(`/api/plataforma/${tenantId}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        body: JSON.stringify({
          patientId: body.patientId,
          professionalId: body.professionalId,
          locationId: body.locationId,
          serviceId: body.serviceId ?? null,
          startAt: body.startAt,
          endAt: body.endAt,
          notes: body.notes ?? null,
        }),
        credentials: "include",
        signal: options?.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || "Error al crear el turno");
        options?.onError?.(err);
        throw err;
      }
      invalidate();
      options?.onSuccess?.();
      return {
        appointmentId: data.appointmentId,
        googleEventId: data.googleEventId ?? null,
      };
    },
    [tenantId, invalidate]
  );

  return { createAppointment };
}
