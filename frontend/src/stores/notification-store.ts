import { create } from "zustand";
import type { NotificationDto } from "@bairronow/shared-types";
import { feedClient } from "@/lib/feed";

interface NotificationState {
  items: NotificationDto[];
  unread: number;
  loading: boolean;
  load: () => Promise<void>;
  prepend: (dto: NotificationDto) => void;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unread: 0,
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const items = await feedClient.listNotifications();
      set({
        items,
        unread: items.filter((n) => !n.isRead).length,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  prepend: (dto: NotificationDto) =>
    set((s) => ({
      items: [dto, ...s.items].slice(0, 50),
      unread: s.unread + (dto.isRead ? 0 : 1),
    })),

  markRead: async (id: number) => {
    const { items } = get();
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;
    set({
      items: items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unread: Math.max(0, get().unread - 1),
    });
    try {
      await feedClient.markRead(id);
    } catch {
      // best-effort
    }
  },

  markAllRead: async () => {
    set((s) => ({
      items: s.items.map((n) => ({ ...n, isRead: true })),
      unread: 0,
    }));
    try {
      await feedClient.markAllRead();
    } catch {
      // best-effort
    }
  },
}));
