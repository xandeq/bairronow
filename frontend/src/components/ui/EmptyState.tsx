import { ReactNode } from "react";
import Button from "./Button";

export interface EmptyStateProps {
  /** Large flat geometric decoration (icon, emoji area, or illustration) */
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Flat empty-state block with personality.
 * Title and description are in PT-BR — caller provides the copy.
 * The geometric diamond decoration uses flat CSS, no images.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center">
      {/* Geometric decoration — flat circle with icon or default diamond shape */}
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden
          className="w-24 h-24 rounded-full bg-muted flex items-center justify-center"
        >
          {icon ?? <DiamondPlaceholder />}
        </div>
        {/* Small accent dot */}
        <div
          aria-hidden
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent opacity-70"
        />
      </div>

      <div className="max-w-xs space-y-2">
        <p className="text-lg font-extrabold text-fg">{title}</p>
        {description && (
          <p className="text-sm text-muted-fg leading-relaxed">{description}</p>
        )}
      </div>

      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

function DiamondPlaceholder() {
  return (
    <div
      aria-hidden
      className="w-10 h-10 bg-border rotate-45 rounded-sm"
    />
  );
}
