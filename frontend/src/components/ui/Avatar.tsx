import { HTMLAttributes } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  /** Used for the initials fallback and alt text */
  name?: string | null;
  size?: AvatarSize;
  verified?: boolean;
}

const sizeMap: Record<AvatarSize, { wrap: string; img: string; badge: string; text: string }> = {
  xs: { wrap: "w-7 h-7",   img: "w-7 h-7",   badge: "w-3 h-3 -bottom-0.5 -right-0.5", text: "text-[10px]" },
  sm: { wrap: "w-9 h-9",   img: "w-9 h-9",   badge: "w-4 h-4 -bottom-0.5 -right-0.5", text: "text-xs"    },
  md: { wrap: "w-11 h-11", img: "w-11 h-11", badge: "w-5 h-5 -bottom-0.5 -right-0.5", text: "text-sm"    },
  lg: { wrap: "w-14 h-14", img: "w-14 h-14", badge: "w-5 h-5 -bottom-1   -right-1",   text: "text-base"  },
  xl: { wrap: "w-20 h-20", img: "w-20 h-20", badge: "w-6 h-6 -bottom-1   -right-1",   text: "text-xl"    },
};

/** Deterministic colour from name — gives each user a consistent avatar colour. */
function pickColor(name: string | null | undefined): string {
  const palette = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-violet-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
  ];
  if (!name) return palette[0];
  const idx = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

/** Flat check-circle icon — no lucide dependency, matches flat design language */
function VerifiedDot({ className }: { className: string }) {
  return (
    <span
      aria-label="Vizinho verificado"
      className={[
        "absolute rounded-full bg-secondary flex items-center justify-center",
        className,
      ].join(" ")}
    >
      <svg viewBox="0 0 12 12" fill="none" className="w-2/3 h-2/3">
        <path
          d="M2.5 6L5 8.5L9.5 4"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Avatar({
  src,
  name,
  size = "md",
  verified = false,
  className = "",
  ...rest
}: AvatarProps) {
  const s = sizeMap[size];
  const initials = name
    ? name
        .trim()
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div
      className={["relative inline-flex shrink-0", s.wrap, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? "Vizinho"}
          className={["rounded-full object-cover", s.img].join(" ")}
        />
      ) : (
        <span
          className={[
            "rounded-full flex items-center justify-center text-white font-bold select-none",
            pickColor(name),
            s.img,
            s.text,
          ].join(" ")}
          aria-label={name ?? "Vizinho"}
        >
          {initials}
        </span>
      )}

      {verified && <VerifiedDot className={s.badge} />}
    </div>
  );
}
