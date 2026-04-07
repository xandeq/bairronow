// Absolute-positioned decorative geometric shapes for backgrounds.
// All flat colors, no shadows, no animation.

export function DecorativeCircle({
  className = "",
  color = "bg-primary",
  size = "w-64 h-64",
}: {
  className?: string;
  color?: string;
  size?: string;
}) {
  return (
    <div
      aria-hidden
      className={`absolute rounded-full ${color} ${size} ${className}`}
    />
  );
}

export function DecorativeSquare({
  className = "",
  color = "bg-secondary",
  size = "w-48 h-48",
  rotate = "rotate-12",
}: {
  className?: string;
  color?: string;
  size?: string;
  rotate?: string;
}) {
  return (
    <div
      aria-hidden
      className={`absolute rounded-lg ${color} ${size} ${rotate} ${className}`}
    />
  );
}

export default function Decorative({
  variant = "auth",
}: {
  variant?: "auth" | "hero";
}) {
  if (variant === "hero") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <DecorativeCircle
          color="bg-primary"
          size="w-96 h-96"
          className="-top-32 -left-32 opacity-20"
        />
        <DecorativeSquare
          color="bg-accent"
          size="w-64 h-64"
          rotate="rotate-12"
          className="bottom-0 right-0 opacity-20"
        />
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <DecorativeCircle
        color="bg-primary"
        size="w-72 h-72"
        className="-top-20 -right-20 opacity-15"
      />
      <DecorativeSquare
        color="bg-secondary"
        size="w-56 h-56"
        rotate="-rotate-12"
        className="-bottom-20 -left-16 opacity-15"
      />
      <DecorativeCircle
        color="bg-accent"
        size="w-32 h-32"
        className="top-1/2 right-1/4 opacity-10"
      />
    </div>
  );
}
