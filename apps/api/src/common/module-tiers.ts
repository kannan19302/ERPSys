/**
 * Module lifecycle tiers.
 *
 * The platform splits installed apps into two tiers:
 *  - **Kernel** (never uninstallable): auth, admin, super-admin, the App Store,
 *    Studio/Builder, Dashboard, and developer/billing infra. These keep an admin
 *    surface available so a user can always re-install everything else.
 *  - **Business modules** (uninstallable): the operational apps below. Uninstalling
 *    one is an *entitlement toggle* — the code stays resident, the data is preserved,
 *    but the module is hidden from the UI and its API is gated off until re-installed.
 *
 * Bundle-backed industry apps (healthcare, education, …) are uninstallable by their
 * own teardown path and are not listed here.
 *
 * Each gated module maps to one or more URL/route segments because a few apps are
 * mounted under a segment that differs from their app slug (e.g. Connect →
 * `communication`). The same map is used by the frontend route guard and the API
 * entitlement middleware so both agree on what "installed" means.
 */
export interface GatedModule {
  /** Canonical InstalledApp.appSlug for this module. */
  slug: string;
  /** First path segment(s) this module is served under (web routes + /api/v1/<seg>). */
  segments: string[];
}

export const GATED_MODULES: GatedModule[] = [
  { slug: 'finance', segments: ['finance'] },
  { slug: 'hr', segments: ['hr'] },
  { slug: 'crm', segments: ['crm'] },
  { slug: 'inventory', segments: ['inventory'] },
  { slug: 'procurement', segments: ['procurement'] },
  { slug: 'sales', segments: ['sales'] },
  { slug: 'supply-chain', segments: ['supply-chain'] },
  { slug: 'projects', segments: ['projects'] },
  { slug: 'manufacturing', segments: ['manufacturing'] },
  { slug: 'analytics', segments: ['analytics'] },
  { slug: 'drive', segments: ['drive', 'storage'] },
  { slug: 'communication', segments: ['connect', 'communication'] },
  { slug: 'pos', segments: ['pos'] },
];

/** Set of canonical slugs that are uninstallable code-resident business modules. */
export const GATED_SLUGS = new Set(GATED_MODULES.map((m) => m.slug));

/** Map a first path segment to its gated module slug, or null if the segment isn't gated. */
export function moduleSlugForSegment(segment: string): string | null {
  const seg = (segment || '').toLowerCase();
  for (const m of GATED_MODULES) if (m.segments.includes(seg)) return m.slug;
  return null;
}

/**
 * Whether an app may be uninstalled. Bundle apps (non-core) tear themselves down;
 * code-resident core apps are only uninstallable if they're in the gated business set.
 * Everything else (Dashboard, Admin, Studio, API Platform, SaaS, …) is kernel = locked.
 */
export function isUninstallable(app: { slug: string; isCore?: boolean; metadata?: any }): boolean {
  if (GATED_SLUGS.has(app.slug)) return true;
  const isSystem = !!app.metadata?.isSystem;
  return !app.isCore && !isSystem;
}
