import { create } from "zustand";

interface TenantAdminCredentialsState {
  adminEmail: string;
  adminPassword: string;
  setAdminEmail: (email: string) => void;
  setAdminPassword: (password: string) => void;
}

export const useTenantAdminCredentialsStore = create<TenantAdminCredentialsState>((set) => ({
  adminEmail: "",
  adminPassword: "",
  setAdminEmail: (email) => set({ adminEmail: email }),
  setAdminPassword: (password) => set({ adminPassword: password }),
}));
