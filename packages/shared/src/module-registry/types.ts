// @unerp/shared — Module Registry contract
//
// Declares nav/settings/dashboard/visibility for an app/module as data instead
// of a hardcoded branch inside apps/web/src/navigation/moduleNav.tsx. This
// package is framework-agnostic (no React import), so `icon` is a string key
// (e.g. a lucide-react icon name) that the consuming app resolves via its own
// icon lookup — matching the existing `SidebarItem.icon` contract in
// apps/web/src/navigation/types.ts, which the frontend adapter converts to.

/** A single nav entry, or a header grouping child `items`. Mirrors the shape
 * consumed by apps/web's `SidebarItem`, minus the React component reference. */
export interface NavItem {
  label: string;
  href?: string;
  icon?: string;
  isHeader?: boolean;
  items?: NavItem[];
}

/** Context passed to a descriptor's `nav`/`visibility` functions at resolve time. */
export interface ModuleNavContext {
  /** The active user's role code (e.g. 'SUPER_ADMIN', 'ADMIN', 'USER'). */
  role: string;
  /** True when the active user is a super admin (tenant-independent). */
  isSuperAdmin: boolean;
  /** Slugs of apps/modules installed for the active tenant (see
   * apps-slug-map.ts / marketplace InstalledApp rows). */
  installedSlugs: string[];
}

/** Per-module registration contract. One descriptor governs one route segment
 * (e.g. `saas-portal` governs everything under `/saas`). */
export interface AppModuleDescriptor {
  /** Matches the slug taxonomy in apps/api/src/common/module-tiers.ts and
   * app-slug-map.ts (e.g. 'saas-portal', 'finance', 'hr'). */
  slug: string;
  /** Sidebar section title, e.g. 'SaaS Portal'. */
  title: string;
  /** Lucide icon name for the sidebar section header. */
  icon?: string;
  /** First path segment this descriptor governs, e.g. 'saas' for `/saas/*`. */
  routeSegment: string;
  /** Static nav list, or a function of the resolved context (for
   * role/installed-app-conditional items). */
  nav: NavItem[] | ((ctx: ModuleNavContext) => NavItem[]);
  /** Route to this module's settings page, if any (Phase 1+ consumer). */
  settingsRoute?: string;
  /** Route to this module's dashboard, if any (Phase 1+ consumer). */
  dashboardRoute?: string;
  /** Returns false to hide this module entirely for the given context
   * (e.g. RBAC-gated modules). Applied by `resolveNav` before returning. */
  visibility?: (ctx: ModuleNavContext) => boolean;
}
