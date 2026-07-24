import { registerModule } from "@unerp/shared/module-registry";

/**
 * First module migrated from the hardcoded `getAppSpecificNavigation` branch
 * chain (apps/web/src/navigation/moduleNav.tsx) to the data-driven
 * `AppModuleDescriptor` contract (Phase 0 of the settings-to-SaaS-Portal
 * migration). Chosen because it's the smallest, cleanest branch: a flat item
 * list with no header groups and no inline RBAC check, so it proves the
 * registry end to end without also having to design header/visibility
 * conversion in the same change.
 *
 * Nav data ported verbatim from the former `/saas` branch in moduleNav.tsx.
 */
registerModule({
  slug: "saas-portal",
  title: "SaaS Portal",
  icon: "Cloud",
  routeSegment: "saas",
  dashboardRoute: "/saas/portal",
  settingsRoute: "/saas/settings",
  nav: [
    { label: "Dashboard", href: "/saas/portal", icon: "Cloud" },
    { label: "Billing", href: "/saas/billing", icon: "CreditCard" },
    { label: "Usage", href: "/saas/usage", icon: "BarChart3" },
    { label: "Team", href: "/saas/team", icon: "Users" },
    {
      label: "Org Hierarchy",
      href: "/saas/team/org-hierarchy",
      icon: "Network",
    },
    { label: "Security", href: "/saas/security", icon: "Lock" },
    { label: "Compliance", href: "/saas/compliance", icon: "ShieldCheck" },
    { label: "API Keys", href: "/saas/api-keys", icon: "Key" },
    { label: "Audit Log", href: "/saas/audit-log", icon: "Shield" },
    { label: "Support", href: "/saas/support", icon: "HelpCircle" },
    { label: "Announcements", href: "/saas/announcements", icon: "Bell" },
    { label: "Marketplace Apps", href: "/saas/apps", icon: "Package" },
    { label: "Feature Flags", href: "/saas/feature-flags", icon: "Sliders" },
    { label: "Maintenance Mode", href: "/saas/maintenance", icon: "Wrench" },
    {
      label: "Tenant Settings",
      href: "/saas/tenant-settings",
      icon: "Settings",
    },
    { label: "Usage Meters", href: "/saas/usage-meters", icon: "BarChart3" },
    { label: "Subscription Plans", href: "/saas/plans", icon: "CreditCard" },
    { label: "Settings", href: "/saas/settings", icon: "Settings" },
    { label: "Webhooks", href: "/saas/webhooks", icon: "Webhook" },
    { label: "Exports", href: "/saas/exports", icon: "Download" },
    { label: "Add-ons", href: "/saas/addons", icon: "Package" },
    { label: "Admin", href: "/saas/admin", icon: "Shield" },
  ],
});
