// @ts-nocheck
import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "builder",
  title: "Studio",
  icon: "Cpu",
  routeSegment: "builder",
  dashboardRoute: "/builder",
  settingsRoute: undefined,
  // Flat sidebar mirrors BUILDER_TABS (the Level-1 Studio-pillar tab bar in
  // BuilderTabLayout.tsx) exactly. Each pillar's ~7-12 sub-routes are reached
  // via its own Level-2 SubTabBar (erp-sub-tabs.ts / web-sub-tabs.ts /
  // manage-sub-tabs.ts, rendered from each pillar's layout.tsx) rather than
  // being enumerated here — that is the "already-built tab bar" for Studio's
  // hub-of-hubs architecture (see BuilderTabLayout.tsx header comment).
  // Marketplace (App Store / Installed / Developer Portal) is intentionally
  // excluded — it is already its own top-level nav module, see appStore.ts.
  nav: [
    { label: "Studio Home", href: "/builder", icon: "Home" },
    { label: "App Studio", href: "/builder/erp", icon: "Cpu" },
    { label: "Web Studio", href: "/builder/web", icon: "Globe" },
    { label: "Manage", href: "/builder/manage", icon: "Server" },
  ],
});
