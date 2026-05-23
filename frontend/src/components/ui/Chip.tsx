"use client";

import { ButtonHTMLAttributes } from "react";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
}

export default function Chip({
  selected = false,
  icon,
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
        "text-sm font-semibold transition-all duration-200 ease-out",
        "border focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-offset-1 focus-visible:ring-primary",
        "active:scale-[0.96]",
        selected
          ? "bg-primary text-white border-primary shadow-blue"
          : "bg-card text-muted-fg border-border/50 hover:border-border-strong hover:text-fg hover:bg-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {icon && <span aria-hidden className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
