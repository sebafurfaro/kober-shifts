"use client";

import { create } from "zustand";

export type StyleConfigClient = {
  branding?: {
    siteName?: string;
    logoDataUrl?: string;
  };
  colors?: Record<string, string>;
  borders?: Record<string, number>;
  sections?: {
    showLocations?: boolean;
    showSpecialties?: boolean;
  };
  updatedAt?: string;
};

type StyleConfigState = {
  config: StyleConfigClient | null;
  loading: boolean;
  error: string | null;
  load: (opts?: { force?: boolean }) => Promise<void>;
  setConfig: (config: StyleConfigClient) => void;
};

export const useStyleConfigStore = create<StyleConfigState>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  setConfig: (config) => set({ config }),

  load: async (opts) => {
    const force = Boolean(opts?.force);
    const { config, loading } = get();
    if (!force && (config || loading)) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/style-config", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar style-config");
      const json = (await res.json()) as StyleConfigClient;
      set({ config: json, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error", loading: false });
    }
  },
}));


