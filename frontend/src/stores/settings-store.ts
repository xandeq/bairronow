import { create } from "zustand";
import api from "@/lib/api";

interface SettingsState {
  digestOptOut: boolean;
  loading: boolean;
  setDigestOptOut: (value: boolean) => void;
  loadSettings: () => Promise<void>;
  toggleDigest: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  digestOptOut: false,
  loading: false,

  setDigestOptOut: (value) => set({ digestOptOut: value }),

  loadSettings: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<{ digestOptOut?: boolean }>(
        "/api/v1/profile/me"
      );
      set({ digestOptOut: data.digestOptOut ?? false });
    } catch {
      // silently fail
    } finally {
      set({ loading: false });
    }
  },

  toggleDigest: async () => {
    const current = get().digestOptOut;
    const newValue = !current;
    set({ digestOptOut: newValue });
    try {
      await api.patch("/api/v1/profile/me", { digestOptOut: newValue });
    } catch {
      // revert on failure
      set({ digestOptOut: current });
    }
  },
}));
