import { create } from "zustand";
import type { PostDto } from "@bairronow/shared-types";
import { feedClient } from "@/lib/feed";

interface FeedState {
  items: PostDto[];
  cursor: string | null;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadFirst: (bairroId: number) => Promise<void>;
  loadMore: (bairroId: number) => Promise<void>;
  prependNew: (post: PostDto) => void;
  updatePost: (id: number, patch: Partial<PostDto>) => void;
  removePost: (id: number) => void;
  setLiked: (id: number, liked: boolean, count: number) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  cursor: null,
  loading: false,
  hasMore: true,
  error: null,

  loadFirst: async (bairroId: number) => {
    set({ loading: true, error: null, items: [], cursor: null, hasMore: true });
    try {
      const page = await feedClient.listFeed({ bairroId });
      set({
        items: page.items,
        cursor: page.nextCursor,
        hasMore: page.nextCursor !== null,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Erro ao carregar feed",
      });
    }
  },

  loadMore: async (bairroId: number) => {
    const { loading, hasMore, cursor } = get();
    if (loading || !hasMore) return;
    set({ loading: true, error: null });
    try {
      const page = await feedClient.listFeed({ bairroId, cursor });
      set((s) => ({
        items: [...s.items, ...page.items],
        cursor: page.nextCursor,
        hasMore: page.nextCursor !== null,
        loading: false,
      }));
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Erro ao carregar mais",
      });
    }
  },

  prependNew: (post: PostDto) =>
    set((s) => ({ items: [post, ...s.items] })),

  updatePost: (id: number, patch: Partial<PostDto>) =>
    set((s) => ({
      items: s.items.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  removePost: (id: number) =>
    set((s) => ({ items: s.items.filter((p) => p.id !== id) })),

  setLiked: (id: number, liked: boolean, count: number) =>
    set((s) => ({
      items: s.items.map((p) =>
        p.id === id ? { ...p, likedByMe: liked, likeCount: count } : p
      ),
    })),

  reset: () =>
    set({ items: [], cursor: null, loading: false, hasMore: true, error: null }),
}));
