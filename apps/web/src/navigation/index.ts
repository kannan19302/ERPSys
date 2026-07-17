/**
 * Navigation registry — the single source of truth for the dashboard shell's
 * sidebar, app switcher, and breadcrumbs. Extracted from the former monolithic
 * layout so navigation is config-driven and can be merged with server data
 * (custom pages, per-tenant nav overlays) at runtime via useResolvedNav.
 */
import { getAppSpecificNavigation } from './moduleNav';
import { allApplications, formatSegment } from './registry';
import type { ModuleNav, AppDefinition } from './types';

export type { SidebarItem, ModuleNav, AppDefinition, SwitcherFolder } from './types';
export { getAppSpecificNavigation } from './moduleNav';
export {
  SEGMENT_NAMES,
  formatSegment,
  allApplications,
  switcherFolders,
  KERNEL_APP_IDS,
} from './registry';

/** Resolve the sidebar navigation for the active route. */
export function getModuleNav(pathname: string): ModuleNav {
  return getAppSpecificNavigation(pathname);
}

/** All top-level applications known to the shell. */
export function getApplications(): AppDefinition[] {
  return allApplications;
}

export { formatSegment as formatBreadcrumbSegment };
