import { create } from "zustand";
import type { ListingDto } from "@/lib/types/marketplace";

// Phase 4 Plan 02: marketplace grid state — cursor, items, filters.
// D-10 "verified seller" filter defaults ON.

export interface MarketplaceFilters {
  category?: string;
  verifiedOnly: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  q?: string;
}

interface MarketplaceState {
  items: ListingDto[];
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
  filters: MarketplaceFilters;
  setFilters: (f: Partial<MarketplaceFilters>) => void;
  append: (items: ListingDto[], nextCursor: string | null) => void;
  reset: () => void;
  setLoading: (v: boolean) => void;
}

const initialFilters: MarketplaceFilters = {
  // D-10: default ON — verified seller filter.
  verifiedOnly: true,
  sort: "recent",
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  items: [],
  cursor: null,
  hasMore: true,
  loading: false,
  filters: initialFilters,

  setFilters: (f) =>
    set((s) => ({
      filters: { ...s.filters, ...f },
      items: [],
      cursor: null,
      hasMore: true,
    })),

  append: (items, nextCursor) =>
    set((s) => ({
      items: [...s.items, ...items],
      cursor: nextCursor,
      hasMore: nextCursor !== null,
    })),

  reset: () =>
    set({
      items: [],
      cursor: null,
      hasMore: true,
      loading: false,
      filters: initialFilters,
    }),

  setLoading: (v) => set({ loading: v }),
}));
