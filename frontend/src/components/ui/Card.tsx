import { HTMLAttributes } from "react";

/**
 * Section-tint colours match the poster-aesthetic colour-blocked layout:
 *   blue-tint  → trust / verification sections  (bg-blue-50)
 *   green-tint → community / feed sections      (bg-emerald-50)
 *   amber-tint → marketplace sections           (bg-amber-50)
 *   dark       → footer / hero CTA blocks       (bg-slate-900)
 */
export type CardBg =
  | "white"
  | "muted"
  | "blue-tint"
  | "green-tint"
  | "amber-tint"
  | "dark";

export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  bg?: CardBg;
  padding?: CardPadding;
  /** Explicit border — use only when colour-blocking can't carry the structure */
  border?: boolean;
}

const bgMap: Record<CardBg, string> = {
  white:        "bg-bg text-fg",
  muted:        "bg-muted text-fg",
  "blue-tint":  "bg-blue-50 text-fg",
  "green-tint": "bg-emerald-50 text-fg",
  "amber-tint": "bg-amber-50 text-fg",
  dark:         "bg-slate-900 text-white",
};

const padMap: Record<CardPadding, string> = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

export default function Card({
  interactive = false,
  bg = "white",
  padding = "md",
  border = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        "rounded-lg",
        bgMap[bg],
        padMap[padding],
        border ? "border-2 border-border" : "",
        interactive
          ? "group cursor-pointer transition-all duration-200 hover:scale-[1.02]"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
