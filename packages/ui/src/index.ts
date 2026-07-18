// ─────────────────────────────────────────────────
// @unerp/ui — backward-compat facade over the UniERP
// Design System packages (@unerp/ui-*).
// New code should import from the specific package:
//   @unerp/ui-components, @unerp/ui-layout, @unerp/ui-charts,
//   @unerp/ui-data-grid, @unerp/ui-dashboard, @unerp/ui-notifications,
//   @unerp/ui-theme, @unerp/ui-tokens, @unerp/ui-hooks, @unerp/ui-utils,
//   @unerp/ui-icons, @unerp/ui-form-engine, @unerp/ui-workflow
// ─────────────────────────────────────────────────

export * from "@unerp/ui-components";
export * from "@unerp/ui-layout";
export * from "@unerp/ui-charts";
export * from "@unerp/ui-data-grid";
export * from "@unerp/ui-dashboard";
export * from "@unerp/ui-notifications";
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
} from "@unerp/ui-theme";

// Website Builder Blocks (stay in the facade pre-v1)
export * from "./blocks";
