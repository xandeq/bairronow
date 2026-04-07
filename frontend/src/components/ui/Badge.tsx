import { HTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "muted";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  accent: "bg-accent text-fg",
  muted: "bg-muted text-fg",
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
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold",
        variants[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}
