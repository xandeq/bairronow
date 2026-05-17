"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "accent";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: [
    "relative overflow-hidden",
    "bg-primary text-white",
    "before:absolute before:inset-0",
    "before:bg-gradient-to-b before:from-white/10 before:to-transparent",
    "hover:bg-primary-hover",
    "shadow-blue active:shadow-none",
  ].join(" "),

  secondary: [
    "bg-muted text-fg border border-border",
    "hover:bg-card hover:border-border-strong hover:shadow-sm",
  ].join(" "),

  outline: [
    "bg-transparent text-primary",
    "border-2 border-primary",
    "hover:bg-primary hover:text-white hover:shadow-blue",
  ].join(" "),

  ghost: [
    "bg-transparent text-muted-fg",
    "hover:bg-muted hover:text-fg",
  ].join(" "),

  destructive: [
    "bg-danger text-white",
    "hover:bg-danger-hover shadow-sm",
  ].join(" "),

  accent: [
    "relative overflow-hidden",
    "bg-accent text-white",
    "before:absolute before:inset-0",
    "before:bg-gradient-to-b before:from-white/10 before:to-transparent",
    "hover:bg-accent-hover shadow-sm",
  ].join(" "),
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-8  px-3 text-xs  gap-1.5 rounded-lg",
  sm: "h-10 px-4 text-sm  gap-2   rounded-xl",
  md: "h-12 px-5 text-sm  gap-2   rounded-xl",
  lg: "h-14 px-7 text-base gap-2.5 rounded-2xl",
};

const Spinner = () => (
  <span
    aria-hidden
    className="inline-block w-4 h-4 border-[2px] border-current border-t-transparent rounded-full"
    style={{ animation: "spin-smooth 0.7s linear infinite" }}
  />
);

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
        "inline-flex items-center justify-center font-semibold",
        "transition-all duration-200 ease-out",
        "cursor-pointer select-none",
        "hover:-translate-y-px active:translate-y-0 active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "disabled:hover:translate-y-0 disabled:active:scale-100",
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
        <>
          <Spinner />
          <span>Carregando…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
