/**
 * Legacy `/settings/*` → new `/saas/*` path map for the settings-to-SaaS-Portal
 * migration (Phase 3). Source of truth for app code that needs to know a
 * legacy path was moved (e.g. rendering a "moved" notice or building a link).
 *
 * The actual HTTP redirects are declared directly in `next.config.mjs`
 * `redirects()` as a plain array, NOT by importing this file — Next's config
 * file is loaded by the Node.js runtime before the TypeScript/webpack
 * pipeline exists, so it cannot import from `apps/web/src/**` (a `.ts` module
 * under the app's own compiled source tree) without extra transpile plumbing
 * this repo doesn't have wired up for config-time imports. Keeping the map
 * duplicated in both places (this file for app code, `next.config.mjs` for
 * the redirect rules) is intentional; if you add/change a mapping here, make
 * the same change in `next.config.mjs`.
 */
export const OLD_TO_NEW: Record<string, string> = {
  // Identity & Access
  '/settings/identity-access': '/saas/security',
  '/settings/access-control/matrix': '/saas/security?tab=permissions',
  '/settings/impersonate': '/saas/security?tab=impersonate',
  '/settings/delegations': '/saas/security?tab=delegations',
  // Security & Compliance
  '/settings/security-policies': '/saas/security',
  '/settings/security': '/saas/security',
  '/settings/mfa': '/saas/security?tab=mfa',
  '/settings/sso': '/saas/security?tab=sso',
  '/settings/ip-restrictions': '/saas/security?tab=ip-restrictions',
  '/settings/sessions': '/saas/security?tab=sessions',
  '/settings/compliance-governance': '/saas/compliance',
  '/settings/compliance': '/saas/compliance',
  '/settings/gdpr': '/saas/compliance?tab=erasure',
  '/settings/gdpr/erasure': '/saas/compliance?tab=erasure',
  '/settings/gdpr/retention': '/saas/compliance?tab=data-retention',
  // Automation & Workflows
  '/settings/approval-operations': '/workflows',
  '/settings/workflow-builder': '/builder/erp/workflows',
  '/settings/automation-rules': '/saas/admin?tab=automation',
  // Branding & Communication
  '/settings/branding-communication': '/saas/settings?tab=branding',
  '/settings/general-branding': '/saas/settings?tab=branding',
  // System Operations
  '/settings/system-operations': '/saas/admin',
  '/settings/backups': '/saas/admin?tab=backups',
  '/settings/db-schema': '/saas/admin?tab=db',
  '/settings/bulk-operations': '/saas/admin?tab=bulk',
  // Platform Configuration
  '/settings/integrations': '/saas/settings?tab=integrations',
  '/settings/domains': '/saas/settings?tab=domains',
  '/settings/environments': '/saas/admin?tab=environments',
  '/settings/updates': '/saas/admin?tab=updates',
  '/settings/subscription': '/saas/billing',
  '/settings/org-hierarchy': '/saas/team/org-hierarchy',
  // Data & Integration
  '/settings/api-platform': '/saas/api-keys',
  '/settings/api-keys': '/saas/api-keys',
  '/settings/import-export': '/saas/exports',
  '/settings/localization': '/saas/settings?tab=localization',
  '/settings/devops': '/saas/admin?tab=devops',
  '/settings/data-quality': '/saas/admin?tab=data-quality',
  // AI Assistant
  '/settings/ai': '/ai/settings',
  // Reports
  '/settings/scheduled-reports': '/saas/admin?tab=reports',
  '/settings/activity-feed': '/saas/admin?tab=activity',
  '/settings/notifications': '/saas/settings?tab=notifications',
  '/settings/tenant-analytics': '/saas/admin?tab=analytics',
  // Module Manager / Marketplace
  '/settings/modules': '/apps/store',
  '/settings/marketplace': '/apps/store',
  // Legacy settings index
  '/settings': '/saas/portal',
};
