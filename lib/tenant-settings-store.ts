import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TenantTranslations {
  patientLabel: string;
  professionalLabel: string;
}

/** Configuración global de reservas: seña, reembolso, confirmación manual, anticipación min/max. */
export interface TenantBookingSettings {
  depositPercent: number;
  refundPolicyMessage: string;
  manualTurnConfirmation: boolean;
  minAnticipation: number;
  maxAnticipation: number;
}

const defaultBookingSettings: TenantBookingSettings = {
  depositPercent: 0,
  refundPolicyMessage: "",
  manualTurnConfirmation: false,
  minAnticipation: 0,
  maxAnticipation: 30,
};

interface TenantSettingsState {
  tenantId: string | null;
  translations: TenantTranslations;
  bookingSettings: TenantBookingSettings;
  setTenantId: (tenantId: string) => void;
  setTranslations: (translations: TenantTranslations) => void;
  setBookingSettings: (settings: Partial<TenantBookingSettings>) => void;
  loadTranslations: (tenantId: string) => Promise<void>;
}

const defaultTranslations: TenantTranslations = {
  patientLabel: "Pacientes",
  professionalLabel: "Profesionales",
};

export const useTenantSettingsStore = create<TenantSettingsState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      translations: defaultTranslations,
      bookingSettings: defaultBookingSettings,
      setTenantId: (tenantId: string) => set({ tenantId }),
      setTranslations: (translations: TenantTranslations) => set({ translations }),
      setBookingSettings: (settings: Partial<TenantBookingSettings>) =>
        set((state) => ({
          bookingSettings: { ...state.bookingSettings, ...settings },
        })),
      loadTranslations: async (tenantId: string) => {
        try {
          const res = await fetch(`/api/plataforma/${tenantId}/admin/settings`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            set({
              tenantId,
              translations: {
                patientLabel: data.patientLabel || defaultTranslations.patientLabel,
                professionalLabel: data.professionalLabel || defaultTranslations.professionalLabel,
              },
              bookingSettings: {
                depositPercent: typeof data.depositPercent === "number" ? data.depositPercent : defaultBookingSettings.depositPercent,
                refundPolicyMessage: typeof data.refundPolicyMessage === "string" ? data.refundPolicyMessage : defaultBookingSettings.refundPolicyMessage,
                manualTurnConfirmation: typeof data.manualTurnConfirmation === "boolean" ? data.manualTurnConfirmation : defaultBookingSettings.manualTurnConfirmation,
                minAnticipation: typeof data.minAnticipation === "number" ? data.minAnticipation : defaultBookingSettings.minAnticipation,
                maxAnticipation: typeof data.maxAnticipation === "number" ? data.maxAnticipation : defaultBookingSettings.maxAnticipation,
              },
            });
          } else {
            set({
              tenantId,
              translations: defaultTranslations,
              bookingSettings: defaultBookingSettings,
            });
          }
        } catch (error) {
          console.error("Error loading translations:", error);
          set({
            tenantId,
            translations: defaultTranslations,
            bookingSettings: defaultBookingSettings,
          });
        }
      },
    }),
    {
      name: "tenant-settings-storage",
    }
  )
);
