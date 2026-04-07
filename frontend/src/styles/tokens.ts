// Centralized design tokens — mirrors @theme in globals.css
export const colors = {
  bg: "#FFFFFF",
  fg: "#111827",
  primary: "#3B82F6",
  primaryHover: "#2563EB",
  secondary: "#10B981",
  secondaryHover: "#059669",
  accent: "#F59E0B",
  accentHover: "#D97706",
  muted: "#F3F4F6",
  border: "#E5E7EB",
  danger: "#DC2626",
} as const;

export const radius = {
  md: "6px",
  lg: "8px",
} as const;

export const fontFamily = {
  sans: "Outfit, system-ui, sans-serif",
} as const;

export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const tokens = { colors, radius, fontFamily, fontWeights };
export default tokens;
