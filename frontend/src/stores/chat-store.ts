import { create } from "zustand";
import { getHubConnection } from "@/lib/signalr";
import type {
  ConversationDto,
  MessageDto,
} from "@/lib/types/marketplace";
import {
  listConversations,
  sendMessage as sendMessageApi,
  markRead as markReadApi,
  getUnreadCount,
} from "@/lib/api/chat";

// Phase 4 Plan 02 Task 0: chat store.
// REUSES the shared SignalR singleton via getHubConnection() — does NOT create
// a new HubConnection. Listens for "MessageReceived", "UnreadChanged",
// "ConversationRead" server-to-client events fired by ChatService on the
// existing NotificationHub (see 04-01-SUMMARY § "SignalR — Extended existing
// NotificationHub").

interface ChatState {
  conversations: ConversationDto[];
  messagesByConversation: Record<number, MessageDto[]>;
  unreadTotal: number;
  activeConversationId: number | null;
  connected: boolean;
  loading: boolean;

  loadConversations: () => Promise<void>;
  loadUnread: () => Promise<void>;
  connect: () => Promise<void>;
  setActive: (id: number | null) => void;
  appendMessage: (conversationId: number, msg: MessageDto) => void;
  setMessages: (conversationId: number, msgs: MessageDto[]) => void;
  prependHistory: (conversationId: number, msgs: MessageDto[]) => void;
  sendMessage: (
    conversationId: number,
    text?: string,
    image?: File
  ) => Promise<MessageDto | null>;
  markRead: (conversationId: number) => Promise<void>;
}

let _wiredHandlers = false;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  unreadTotal: 0,
  activeConversationId: null,
  connected: false,
  loading: false,

  loadConversations: async () => {
    set({ loading: true });
    try {
      const convs = await listConversations();
      set({
        conversations: convs,
        loading: false,
        unreadTotal: convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
      });
    } catch {
      set({ loading: false });
    }
  },

  loadUnread: async () => {
    try {
      const res = await getUnreadCount();
      set({ unreadTotal: res.total });
    } catch {
      // best-effort
    }
  },

  connect: async () => {
    if (_wiredHandlers && get().connected) return;
    try {
      const hub = await getHubConnection();

      if (!_wiredHandlers) {
        hub.on("MessageReceived", (msg: MessageDto) => {
          const { messagesByConversation, activeConversationId } = get();
          const list = messagesByConversation[msg.conversationId] ?? [];
          // Dedupe by id
          if (list.some((m) => m.id === msg.id)) return;
          set({
            messagesByConversation: {
              ...messagesByConversation,
              [msg.conversationId]: [...list, msg],
            },
          });
          // Auto mark-read if currently viewing this conversation
          if (activeConversationId === msg.conversationId) {
            void get().markRead(msg.conversationId);
          }
        });

        hub.on("UnreadChanged", (payload: { total: number }) => {
          if (typeof payload?.total === "number") {
            set({ unreadTotal: payload.total });
          }
        });

        hub.on("ConversationRead", (payload: { conversationId: number }) => {
          const { conversations } = get();
          set({
            conversations: conversations.map((c) =>
              c.id === payload.conversationId ? { ...c, unreadCount: 0 } : c
            ),
          });
        });

        _wiredHandlers = true;
      }

      set({ connected: true });
    } catch {
      set({ connected: false });
    }
  },

  setActive: (id) => set({ activeConversationId: id }),

  appendMessage: (conversationId, msg) =>
    set((s) => {
      const list = s.messagesByConversation[conversationId] ?? [];
      if (list.some((m) => m.id === msg.id)) return s;
      return {
        messagesByConversation: {
          ...s.messagesByConversation,
          [conversationId]: [...list, msg],
        },
      };
    }),

  setMessages: (conversationId, msgs) =>
    set((s) => ({
      messagesByConversation: {
        ...s.messagesByConversation,
        [conversationId]: msgs,
      },
    })),

  prependHistory: (conversationId, msgs) =>
    set((s) => {
      const existing = s.messagesByConversation[conversationId] ?? [];
      const existingIds = new Set(existing.map((m) => m.id));
      const merged = [
        ...msgs.filter((m) => !existingIds.has(m.id)),
        ...existing,
      ];
      return {
        messagesByConversation: {
          ...s.messagesByConversation,
          [conversationId]: merged,
        },
      };
    }),

  sendMessage: async (conversationId, text, image) => {
    try {
      const msg = await sendMessageApi(conversationId, { text, image });
      get().appendMessage(conversationId, msg);
      return msg;
    } catch {
      return null;
    }
  },

  markRead: async (conversationId) => {
    try {
      await markReadApi(conversationId);
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
        unreadTotal: Math.max(
          0,
          s.unreadTotal -
            (s.conversations.find((c) => c.id === conversationId)
              ?.unreadCount ?? 0)
        ),
      }));
    } catch {
      // best-effort
    }
  },
}));
