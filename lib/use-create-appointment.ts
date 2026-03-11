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
      const startAtVal = body.startAt as string | Date;
      const startAt =
        typeof startAtVal === "string"
          ? startAtVal
          : startAtVal instanceof Date
            ? startAtVal.toISOString()
            : String(startAtVal);
      const endAtVal = body.endAt as string | Date;
      const endAt =
        typeof endAtVal === "string"
          ? endAtVal
          : endAtVal instanceof Date
            ? endAtVal.toISOString()
            : String(endAtVal);

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
          startAt,
          endAt,
          notes: body.notes ?? null,
        }),
        credentials: "include",
        signal: options?.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof data?.error === "string" ? data.error : (data?.details as string) || "Error al crear el turno";
        const err = new Error(message);
        options?.onError?.(err);
        throw err;
      }
      invalidate();
      options?.onSuccess?.();
      return {
        appointmentId: data.appointmentId ?? "",
        googleEventId: data.googleEventId ?? null,
      };
    },
    [tenantId, invalidate]
  );

  return { createAppointment };
}
