import { create } from "zustand";

interface AppointmentsInvalidationState {
  version: number;
  invalidate: () => void;
}

export const useAppointmentsInvalidationStore = create<AppointmentsInvalidationState>()((set) => ({
  version: 0,
  invalidate: () => set((s) => ({ version: s.version + 1 })),
}));
