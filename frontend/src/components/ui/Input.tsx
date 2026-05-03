"use client";

import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error = false, className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={[
        "w-full px-4 py-2.5 rounded-lg bg-muted text-fg",
        "placeholder:text-muted-fg",
        "border-2 outline-none transition-colors duration-150",
        "focus-visible:ring-0",
        error
          ? "border-danger bg-red-50"
          : "border-transparent focus:bg-card focus:border-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
});

export default Input;
