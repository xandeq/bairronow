import { create } from 'zustand';
import type { ListingDto } from './api/marketplace.types';
import { marketplaceApi, type ListListingsParams } from './api/marketplace';

interface MarketplaceFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly: boolean;
  sort: 'recent' | 'price_asc' | 'price_desc';
}

interface MarketplaceState {
  listings: ListingDto[];
  loading: boolean;
  refreshing: boolean;
  nextCursor: string | null;
  hasMore: boolean;
  filters: MarketplaceFilters;
  setFilters: (patch: Partial<MarketplaceFilters>) => void;
  loadFirstPage: (bairroId: number) => Promise<void>;
  loadNextPage: (bairroId: number) => Promise<void>;
  refresh: (bairroId: number) => Promise<void>;
  upsertListing: (listing: ListingDto) => void;
  removeListing: (id: number) => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  listings: [],
  loading: false,
  refreshing: false,
  nextCursor: null,
  hasMore: true,
  filters: { verifiedOnly: true, sort: 'recent' },

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),

  loadFirstPage: async (bairroId) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const { filters } = get();
      const params: ListListingsParams = {
        bairroId,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        verifiedOnly: filters.verifiedOnly,
        sort: filters.sort,
        take: 20,
      };
      const page = await marketplaceApi.list(params);
      set({
        listings: page.items,
        nextCursor: page.nextCursor,
        hasMore: !!page.nextCursor,
        loading: false,
      });
    } catch (err) {
      console.warn('[marketplace] loadFirstPage failed', err);
      set({ loading: false });
    }
  },

  loadNextPage: async (bairroId) => {
    const state = get();
    if (state.loading || !state.hasMore || !state.nextCursor) return;
    set({ loading: true });
    try {
      const { filters, nextCursor } = get();
      const page = await marketplaceApi.list({
        bairroId,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        verifiedOnly: filters.verifiedOnly,
        sort: filters.sort,
        cursor: nextCursor ?? undefined,
        take: 20,
      });
      set((s) => ({
        listings: [...s.listings, ...page.items],
        nextCursor: page.nextCursor,
        hasMore: !!page.nextCursor,
        loading: false,
      }));
    } catch (err) {
      console.warn('[marketplace] loadNextPage failed', err);
      set({ loading: false });
    }
  },

  refresh: async (bairroId) => {
    set({ refreshing: true, nextCursor: null, hasMore: true });
    try {
      const { filters } = get();
      const page = await marketplaceApi.list({
        bairroId,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        verifiedOnly: filters.verifiedOnly,
        sort: filters.sort,
        take: 20,
      });
      set({
        listings: page.items,
        nextCursor: page.nextCursor,
        hasMore: !!page.nextCursor,
        refreshing: false,
      });
    } catch (err) {
      console.warn('[marketplace] refresh failed', err);
      set({ refreshing: false });
    }
  },

  upsertListing: (listing) =>
    set((s) => {
      const idx = s.listings.findIndex((l) => l.id === listing.id);
      if (idx === -1) return { listings: [listing, ...s.listings] };
      const copy = s.listings.slice();
      copy[idx] = listing;
      return { listings: copy };
    }),

  removeListing: (id) =>
    set((s) => ({ listings: s.listings.filter((l) => l.id !== id) })),
}));
