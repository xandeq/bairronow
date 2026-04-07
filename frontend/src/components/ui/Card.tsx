"use client";

import { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  bgColor?: "white" | "muted" | "primary" | "secondary" | "accent";
  padding?: "sm" | "md" | "lg";
}

const bgMap = {
  white: "bg-bg text-fg",
  muted: "bg-muted text-fg",
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  accent: "bg-accent text-fg",
} as const;

const padMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export default function Card({
  interactive = false,
  bgColor = "white",
  padding = "md",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        "rounded-lg border-2 border-border",
        bgMap[bgColor],
        padMap[padding],
        interactive
          ? "cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
          : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
