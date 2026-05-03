"use client";

import { ButtonHTMLAttributes } from "react";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Filled-blue selected state vs slate-100 resting */
  selected?: boolean;
}

/**
 * Pill-shaped chip for category pickers and active filters.
 * Selected → bg-primary text-white.
 * Resting  → bg-muted   text-fg, hover → bg-border.
 */
export default function Chip({
  selected = false,
  className = "",
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2",
        "text-sm font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary",
        selected
          ? "bg-primary text-white"
          : "bg-muted text-fg hover:bg-border",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
