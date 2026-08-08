import colors from "./colors";

/**
 * Single source of truth for the app's themeable brand colors.
 *
 * `constants/colors.ts` holds the full light/dark palettes (the neutral
 * surfaces + brand). This module layers a broker-configurable "brand" set on
 * top: the dashboard "Mobile Themes" editor sends overrides for these keys,
 * and `buildPalette()` merges them into the active palette at render time so
 * every screen that reads colors from `useColors()` re-themes instantly.
 *
 * Model (see the dashboard editor):
 *   - Brand tokens (primary, accent, destructive) apply to BOTH light & dark.
 *   - Neutral tokens (background, card, text, mutedForeground, border) apply
 *     to LIGHT mode only; dark mode keeps its adaptive surfaces so it always
 *     stays readable.
 */
export const BRAND_KEYS = [
  "primary",
  "accent",
  "background",
  "card",
  "text",
  "mutedForeground",
  "border",
  "destructive",
] as const;

export type BrandKey = (typeof BRAND_KEYS)[number];
export type BrandOverrides = Partial<Record<BrandKey, string>>;

/** The default "Pine" theme — the colors the app ships with. */
export const PINE_BRAND: Record<BrandKey, string> = {
  primary: "#164951",
  accent: "#45B369",
  background: "#FFFFFF",
  card: "#F9FAFB",
  text: "#111827",
  mutedForeground: "#6B7280",
  border: "#EBECEF",
  destructive: "#EF4444",
};

export type Palette = typeof colors.light & { radius: number };

/** Build the active palette for a mode, applying broker brand overrides. */
export function buildPalette(mode: "light" | "dark", o?: BrandOverrides | null): Palette {
  const base: Palette = { ...colors[mode], radius: colors.radius };
  if (!o) return base;

  // Brand + semantic colors — applied to both light and dark modes.
  if (o.primary) {
    base.primary = o.primary;
    base.tint = o.primary;
  }
  if (o.accent) base.accent = o.accent;
  if (o.destructive) base.destructive = o.destructive;

  // Neutral surfaces / text — light mode only; dark keeps adaptive defaults.
  if (mode === "light") {
    if (o.background) base.background = o.background;
    if (o.card) {
      base.card = o.card;
      base.muted = o.card;
    }
    if (o.text) {
      base.text = o.text;
      base.foreground = o.text;
      base.cardForeground = o.text;
    }
    if (o.mutedForeground) base.mutedForeground = o.mutedForeground;
    if (o.border) {
      base.border = o.border;
      base.input = o.border;
    }
  }

  return base;
}
