import { create } from "zustand";

interface TenantBusinessState {
  tenantId: string | null;
  tenantName: string;
  reservationLink: string;
  isActive: boolean;
  setTenantId: (tenantId: string) => void;
  setTenantName: (tenantName: string) => void;
  setReservationLink: (reservationLink: string) => void;
  setActive: (isActive: boolean) => void;
}

export const useTenantBusinessStore = create<TenantBusinessState>((set) => ({
  tenantId: null,
  tenantName: "",
  reservationLink: "",
  isActive: false,
  setTenantId: (tenantId) => set({ tenantId }),
  setTenantName: (tenantName) => set({ tenantName }),
  setReservationLink: (reservationLink) => set({ reservationLink }),
  setActive: (isActive) => set({ isActive }),
}));
