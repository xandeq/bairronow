"use client";

import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error = false, icon, suffix, className = "", ...rest },
  ref
) {
  if (icon || suffix) {
    return (
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-muted-fg pointer-events-none" aria-hidden>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={[
            "w-full rounded-xl bg-muted text-fg",
            "border border-border",
            "placeholder:text-muted-fg/60",
            "outline-none transition-all duration-200",
            "focus:bg-card focus:border-primary",
            error
              ? "border-danger bg-danger-light focus:border-danger focus:shadow-none"
              : "",
            icon   ? "pl-10 pr-4 py-3" : "px-4 py-3",
            suffix ? "pr-10" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {suffix && (
          <span className="absolute right-3.5 text-muted-fg" aria-hidden>
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      className={[
        "w-full px-4 py-3 rounded-xl bg-muted text-fg",
        "border border-border",
        "placeholder:text-muted-fg/60",
        "outline-none transition-all duration-200",
        "focus:bg-card focus:border-primary",
        error
          ? "border-danger bg-danger-light focus:border-danger focus:shadow-none"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
});

export default Input;
