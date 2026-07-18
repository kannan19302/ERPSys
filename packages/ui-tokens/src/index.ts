/**
 * @unerp/ui-tokens — design-token metadata.
 * The tokens themselves ship as CSS (import '@unerp/ui-tokens/css').
 */
export const THEMES = [
  "enterprise",
  "modern",
  "minimal",
  "classic",
  "dark",
  "light",
  "high-contrast",
] as const;
export type ThemeName = (typeof THEMES)[number];
export const DEFAULT_THEME: ThemeName = "light";

/** Density is orthogonal to color theme — applies to any theme via [data-density]. */
export const DENSITIES = ["comfortable", "compact"] as const;
export type DensityName = (typeof DENSITIES)[number];
export const DEFAULT_DENSITY: DensityName = "comfortable";
export const CHART_TOKENS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
  "--chart-9",
  "--chart-10",
] as const;
