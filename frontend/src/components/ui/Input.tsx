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
        "w-full px-4 py-2.5 rounded-md bg-muted text-fg placeholder:text-fg/40",
        "border-2 outline-none transition-colors duration-150",
        error
          ? "border-danger bg-white"
          : "border-transparent focus:bg-white focus:border-primary",
        className,
      ].join(" ")}
      {...rest}
    />
  );
});

export default Input;
