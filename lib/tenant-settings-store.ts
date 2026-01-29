import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TenantTranslations {
  patientLabel: string;
  professionalLabel: string;
}

interface TenantSettingsState {
  tenantId: string | null;
  translations: TenantTranslations;
  setTenantId: (tenantId: string) => void;
  setTranslations: (translations: TenantTranslations) => void;
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
      setTenantId: (tenantId: string) => set({ tenantId }),
      setTranslations: (translations: TenantTranslations) => set({ translations }),
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
            });
          } else {
            // Use defaults if fetch fails
            set({
              tenantId,
              translations: defaultTranslations,
            });
          }
        } catch (error) {
          console.error("Error loading translations:", error);
          // Use defaults on error
          set({
            tenantId,
            translations: defaultTranslations,
          });
        }
      },
    }),
    {
      name: "tenant-settings-storage",
    }
  )
);
