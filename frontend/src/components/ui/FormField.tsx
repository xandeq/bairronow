"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import Input from "./Input";

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, hint, id, name, ...rest }, ref) {
    const inputId = id ?? name;
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-fg"
        >
          {label}
        </label>
        <Input id={inputId} name={name} ref={ref} error={!!error} {...rest} />
        {hint && !error && (
          <p className="text-xs text-fg/60">{hint}</p>
        )}
        {error && (
          <p className="text-sm text-danger font-medium">{error}</p>
        )}
      </div>
    );
  }
);

export default FormField;
