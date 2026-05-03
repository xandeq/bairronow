import { HTMLAttributes } from "react";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "muted"
  | "verified"
  | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  primary:  "bg-blue-100  text-blue-700",
  secondary: "bg-emerald-100 text-emerald-700",
  accent:   "bg-amber-100 text-amber-700",
  muted:    "bg-muted     text-muted-fg",
  /** Celebratory trust signal — used consistently wherever verified status appears */
  verified: "bg-emerald-100 text-emerald-700",
  danger:   "bg-red-100   text-red-700",
};

export default function Badge({
  variant = "primary",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold",
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}
