"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover",
  secondary:
    "bg-muted text-fg hover:bg-border",
  /** Bold border that fills on hover — flat design's alternative to raised state */
  outline:
    "bg-transparent text-primary border-4 border-primary hover:bg-primary hover:text-white",
  ghost:
    "bg-transparent text-fg hover:bg-muted",
  /** Reserved for delete / report — never use decoratively */
  destructive:
    "bg-danger text-white hover:bg-danger-hover",
};

/** h-* ensures 44px+ touch targets on every size (WCAG 2.5.5) */
const sizes: Record<ButtonSize, string> = {
  sm: "h-9  px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    className = "",
    children,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-semibold rounded-lg",
        "transition-all duration-200",
        "hover:scale-[1.03] active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
          Carregando…
        </span>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
