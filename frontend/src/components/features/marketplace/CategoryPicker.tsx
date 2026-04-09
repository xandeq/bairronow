"use client";

import { CATEGORIES, findSubcategories } from "@/lib/categories";

// D-03: 2-step chip grid picker (categories → subcategories). No dropdowns.

export interface CategoryPickerProps {
  categoryCode: string | undefined;
  subcategoryCode: string | undefined;
  onChange: (category: string | undefined, subcategory: string | undefined) => void;
  error?: string;
}

export default function CategoryPicker({
  categoryCode,
  subcategoryCode,
  onChange,
  error,
}: CategoryPickerProps) {
  const subs = categoryCode ? findSubcategories(categoryCode) : [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-bold text-fg mb-2">
          Categoria
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const selected = c.code === categoryCode;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => onChange(c.code, undefined)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition ${
                  selected
                    ? "bg-primary text-white border-primary"
                    : "bg-bg text-fg border-border hover:bg-muted"
                }`}
              >
                {c.displayName}
              </button>
            );
          })}
        </div>
      </div>

      {categoryCode && (
        <div>
          <label className="block text-sm font-bold text-fg mb-2">
            Subcategoria
          </label>
          <div className="flex flex-wrap gap-2">
            {subs.map((s) => {
              const selected = s.code === subcategoryCode;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => onChange(categoryCode, s.code)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition ${
                    selected
                      ? "bg-primary text-white border-primary"
                      : "bg-bg text-fg border-border hover:bg-muted"
                  }`}
                >
                  {s.displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 font-semibold">{error}</p>
      )}
    </div>
  );
}
