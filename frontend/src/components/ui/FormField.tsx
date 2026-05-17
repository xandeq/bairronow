"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import Input from "./Input";

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  suffix?: ReactNode;
  required?: boolean;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, hint, icon, suffix, id, name, required, ...rest }, ref) {
    const inputId = id ?? name;
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-sm font-semibold text-fg"
        >
          {label}
          {required && <span className="text-danger text-xs" aria-hidden>*</span>}
        </label>
        <Input
          id={inputId}
          name={name}
          ref={ref}
          error={!!error}
          icon={icon}
          suffix={suffix}
          {...rest}
        />
        {hint && !error && (
          <p className="text-xs text-muted-fg leading-relaxed">{hint}</p>
        )}
        {error && (
          <p className="text-xs font-semibold text-danger flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

export default FormField;
