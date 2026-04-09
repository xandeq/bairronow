"use client";

import { CATEGORIES } from "@/lib/categories";
import type { MarketplaceFilters } from "@/stores/marketplace-store";

// D-08: Top chips filter bar (category, verified, price range).
// D-10: "Verified seller" filter defaults ON; when OFF, emit warning per card.

export interface FilterChipsProps {
  filters: MarketplaceFilters;
  onChange: (patch: Partial<MarketplaceFilters>) => void;
}

export default function FilterChips({ filters, onChange }: FilterChipsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => onChange({ category: undefined })}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
            !filters.category
              ? "bg-primary text-white border-primary"
              : "bg-bg text-fg border-border"
          }`}
        >
          Todas
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() =>
              onChange({
                category: filters.category === c.code ? undefined : c.code,
              })
            }
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
              filters.category === c.code
                ? "bg-primary text-white border-primary"
                : "bg-bg text-fg border-border"
            }`}
          >
            {c.displayName}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-fg">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          Apenas verificados
        </label>
        {!filters.verifiedOnly && (
          <span className="text-xs text-amber-700 font-semibold">
            ⚠️ Vendedor não verificado pode aparecer
          </span>
        )}

        <div className="flex items-center gap-1 text-sm">
          <span className="font-semibold text-fg">R$</span>
          <input
            type="number"
            placeholder="mín"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onChange({
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-20 border-2 border-border rounded px-2 py-1 text-sm"
          />
          <span>–</span>
          <input
            type="number"
            placeholder="máx"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onChange({
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-20 border-2 border-border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
