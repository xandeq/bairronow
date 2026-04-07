"use client";

interface VerifiedBadgeProps {
  verified: boolean;
  size?: "sm" | "md";
}

export default function VerifiedBadge({ verified, size = "md" }: VerifiedBadgeProps) {
  if (!verified) return null;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1"
      : "text-sm px-3 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full bg-green-100 text-green-800 font-semibold ring-1 ring-green-300 ${sizeClasses}`}
      aria-label="Vizinho verificado"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={size === "sm" ? "h-3 w-3" : "h-4 w-4"}
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
          clipRule="evenodd"
        />
      </svg>
      Vizinho verificado
    </span>
  );
}
