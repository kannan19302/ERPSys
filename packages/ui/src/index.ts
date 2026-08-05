// ─────────────────────────────────────────────────
// @unerp/ui — the UniERP Design System, one package.
// The root barrel is the convenience surface; prefer a subpath so the
// consumer only pays for what it uses:
//   @unerp/ui/components, @unerp/ui/layout, @unerp/ui/charts,
//   @unerp/ui/data-grid, @unerp/ui/dashboard, @unerp/ui/notifications,
//   @unerp/ui/theme, @unerp/ui/tokens, @unerp/ui/hooks, @unerp/ui/utils,
//   @unerp/ui/icons, @unerp/ui/form-engine, @unerp/ui/workflow
// PLATFORM_ARCHITECTURE.md § 7.2 — the 13 @unerp/ui-* packages were merged
// here so the extraction in Phase 3 publishes one artifact, not fourteen.
// ─────────────────────────────────────────────────

export * from "./components";
export * from "./layout";
export * from "./charts";
export * from "./data-grid";
export * from "./dashboard";
export * from "./notifications";
export {
  ThemeProvider,
  useTheme,
  THEMES,
  DEFAULT_THEME,
  type ThemeName,
  type ThemeSetting,
  type ThemeProviderProps,
  type BrandingTokens,
  DENSITIES,
  DEFAULT_DENSITY,
  type DensityName,
} from "./theme";

// Website Builder Blocks (stay in the facade pre-v1)
export * from "./blocks";
