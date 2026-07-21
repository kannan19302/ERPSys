"use client";
import styles from "./layout.module.css";
// This entire route group is an authenticated, client-only dashboard: every
// page validates its cookie-backed session and fetches tenant data client-side.
// There is no meaningful static HTML to produce for these routes, and
// attempting to statically prerender  pages at build time (Next's
// default when a page has no dynamic data fetching) causes prerender workers
// to blow up with "Cannot read properties of null (reading 'useState')" —
// forcing every page under (dashboard) onto the dynamic rendering path avoids
// the broken prerender pass entirely. See root-cause notes in git history.
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { DemoBanner, Spinner, useTheme } from "@unerp/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  CreditCard,
  Users,
  BarChart3,
  Package,
  ClipboardList,
  Settings,
  FolderOpen,
  ShoppingCart,
  ShoppingBag,
  Truck,
  Briefcase,
  Hammer,
  PieChart,
  MessageSquare,
  Store,
  Globe,
  Activity,
  Cpu,
  FileText,
  LayoutGrid,
  Clock,
  X,
} from "lucide-react";

import {
  getAppSpecificNavigation,
  formatSegment,
  allApplications,
  switcherFolders,
  KERNEL_APP_IDS,
} from "@/navigation";
import { PermissionProvider } from "@/components/PermissionProvider";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppHeader } from "@/components/shell/AppHeader";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { AICopilot } from "@/components/shell/AICopilot";
import { useApiClient } from "@unerp/framework";

const GLOBAL_SEARCH_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: Home, type: "App" },
  {
    name: "Finance & Accounting",
    href: "/finance",
    icon: CreditCard,
    type: "App",
  },
  { name: "Human Resources", href: "/hr", icon: Users, type: "App" },
  { name: "CRM & Sales", href: "/crm", icon: BarChart3, type: "App" },
  { name: "Inventory & Stock", href: "/inventory", icon: Package, type: "App" },
  {
    name: "Procurement",
    href: "/procurement",
    icon: ShoppingCart,
    type: "App",
  },
  { name: "Sales & Orders", href: "/sales", icon: ClipboardList, type: "App" },
  { name: "Supply Chain", href: "/supply-chain", icon: Truck, type: "App" },
  {
    name: "Project Management",
    href: "/projects",
    icon: Briefcase,
    type: "App",
  },
  { name: "Manufacturing", href: "/manufacturing", icon: Hammer, type: "App" },
  {
    name: "Business Intelligence",
    href: "/analytics",
    icon: PieChart,
    type: "App",
  },
  { name: "Drive", href: "/drive", icon: FolderOpen, type: "App" },
  { name: "Connect", href: "/connect", icon: MessageSquare, type: "App" },
  { name: "POS & Retail", href: "/pos", icon: Store, type: "App" },
  { name: "E-Commerce", href: "/ecommerce", icon: Globe, type: "App" },
  { name: "App Store", href: "/apps/store", icon: Store, type: "App" },
  { name: "Settings", href: "/settings", icon: Settings, type: "App" },
  { name: "Studio", href: "/builder", icon: Cpu, type: "App" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = useApiClient();
  const pathname = usePathname() || "";
  useEffect(() => {
    const updateFavicon = (path: string) => {
      const root = path.split("/")[1] || "";
      let color = "#6366f1";
      let svgInner = "";

      switch (root) {
        case "finance":
          color = "#10b981";
          svgInner = `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
          break;
        case "hr":
          color = "#f59e0b";
          svgInner = `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="${color}" stroke-width="2" fill="none"/><circle cx="9" cy="7" r="4" stroke="${color}" stroke-width="2" fill="none"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="${color}" stroke-width="2" fill="none"/><circle cx="19" cy="4" r="3" stroke="${color}" stroke-width="2" fill="none"/>`;
          break;
        case "crm":
          color = "#3b82f6";
          svgInner = `<circle cx="12" cy="12" r="10" stroke="${color}" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="6" stroke="${color}" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="${color}"/>`;
          break;
        case "inventory":
          color = "#d97706";
          svgInner = `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="${color}" stroke-width="2" fill="none"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="${color}" stroke-width="2" fill="none"/>`;
          break;
        case "procurement":
          color = "#0d9488";
          svgInner = `<circle cx="8" cy="21" r="1" fill="${color}"/><circle cx="19" cy="21" r="1" fill="${color}"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" stroke="${color}" stroke-width="2" fill="none"/>`;
          break;
        case "sales":
          color = "#ef4444";
          svgInner = `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="${color}" stroke-width="2" fill="none"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="${color}" stroke-width="2" fill="none"/><path d="M9 14h6M9 18h6" stroke="${color}" stroke-width="2"/>`;
          break;
        case "supply-chain":
          color = "#8b5cf6";
          svgInner = `<rect x="1" y="3" width="15" height="13" fill="none" stroke="${color}" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16" fill="none" stroke="${color}" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" fill="${color}"/><circle cx="18.5" cy="18.5" r="2.5" fill="${color}"/>`;
          break;
        case "projects":
          color = "#ec4899";
          svgInner = `<rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="${color}" stroke-width="2" fill="none"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="${color}" stroke-width="2" fill="none"/>`;
          break;
        case "manufacturing":
          color = "#4b5563";
          svgInner = `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94L14.7 6.3z" stroke="${color}" stroke-width="2" fill="none"/>`;
          break;
        case "connect":
          color = "#10b981";
          svgInner = `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="${color}" stroke-width="2" fill="none"/>`;
          break;
        case "pos":
          color = "#7c3aed";
          svgInner = `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="${color}" stroke-width="2" fill="none"/><polyline points="9 22 9 12 15 12 15 22" stroke="${color}" stroke-width="2" fill="none"/>`;
          break;
        case "builder":
          color = "#db2777";
          svgInner = `<rect x="4" y="4" width="14" height="14" rx="2" ry="2" stroke="${color}" stroke-width="2" fill="none"/><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
          break;
        default:
          color = "#6366f1";
          svgInner = `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="${color}" stroke-width="2" fill="none"/><polyline points="9 22 9 12 15 12 15 22" stroke="${color}" stroke-width="2" fill="none"/>`;
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">${svgInner}</svg>`;
      const faviconUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    };

    updateFavicon(pathname);
  }, [pathname]);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  // Theme now lives in the root ThemeProvider (all design-system themes).
  // Downstream shell components only need a light/dark hint for their CSS pairs.
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";

  // Header Dropdowns visibility states
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);

  // Search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [dynamicAppNav, setDynamicAppNav] = useState<any>(null);

  useEffect(() => {
    if (!pathname.startsWith("/app/")) {
      setDynamicAppNav(null);
      return;
    }
    const slug = pathname.split("/")[2];
    if (!slug) {
      setDynamicAppNav(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const shell = await client.get<{
          modules?: Array<{
            enabled?: boolean;
            name: string;
            pages?: Array<{ title: string; slug: string; type?: string }>;
          }>;
          app?: { name?: string };
        }>(`/admin/marketplace/installed/${slug}/modules`);
        const pageIcon = (t: string) => {
          const k = (t || "").toUpperCase();
          if (k === "LIST") return ClipboardList;
          if (k === "FORM") return FileText;
          if (k === "DASHBOARD" || k === "CUSTOM") return BarChart3;
          return LayoutGrid;
        };
        const items = [{ name: "Overview", href: `/app/${slug}`, icon: Home }];
        if (slug === "healthcare")
          items.push({
            name: "Clinical Tools",
            href: `/app/${slug}/clinical`,
            icon: Activity,
          });
        for (const m of (shell.modules || []).filter((m: any) => m.enabled)) {
          items.push({
            name: m.name,
            isHeader: true,
            items: (m.pages || []).map((p: any) => ({
              name: p.title,
              href: `/app/${slug}/${p.slug}`,
              icon: pageIcon(p.type),
            })),
          } as any);
        }
        items.push({
          name: "Manage Modules",
          isHeader: true,
          items: [
            {
              name: "Admin Console",
              href: `/app/${slug}?view=admin`,
              icon: Settings,
            },
          ],
        } as any);
        if (mounted)
          setDynamicAppNav({
            slug,
            title: shell.app?.name || slug,
            icon: Activity,
            items,
          });
      } catch {
        if (mounted) setDynamicAppNav(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pathname, client]);

  const userDropdownRef = React.useRef<HTMLDivElement>(null);
  const tenantDropdownRef = React.useRef<HTMLDivElement>(null);
  const appsDropdownRef = React.useRef<HTMLDivElement>(null);
  const searchDropdownRef = React.useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [presenceColor, setPresenceColor] = useState<string | undefined>(
    undefined,
  );
  const PRESENCE_COLORS: Record<string, string> = {
    ACTIVE: "#10b981",
    IN_MEETING: "#10b981",
    FOCUSING: "#10b981",
    AWAY: "#f59e0b",
    BRB: "#f59e0b",
    DND: "#ef4444",
    OOO: "#94a3b8",
    INACTIVE: "#94a3b8",
  };
  const [currentTenant, setCurrentTenant] = useState<{
    id?: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  }>({ name: "…", slug: "" });
  const [subscription, setSubscription] = useState<any>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(true);

  const trialDaysLeft = useMemo(() => {
    if (!subscription?.trialEndsAt) return 0;
    return Math.max(
      0,
      Math.ceil(
        (new Date(subscription.trialEndsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  }, [subscription]);
  // Real memberships from the API — every tenant this account can sign in to.
  const [tenants, setTenants] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        tenantDropdownRef.current &&
        !tenantDropdownRef.current.contains(event.target as Node)
      ) {
        setTenantDropdownOpen(false);
      }
      if (
        appsDropdownRef.current &&
        !appsDropdownRef.current.contains(event.target as Node)
      ) {
        setAppsDropdownOpen(false);
      }
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const profile = await client.get<{
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          avatar?: string;
          tenant?: { name: string; slug: string };
        }>("/auth/me");
        if (!mounted) return;
        setUser(profile);
        if (profile.tenant) setCurrentTenant(profile.tenant);
        setIsLoading(false);

        client
          .get<any>("/saas/subscription")
          .then((sub) => {
            if (mounted) setSubscription(sub);
          })
          .catch(() => {});

        client
          .get<
            Array<{ userId: string; presence: string; visibility?: string }>
          >("/communication/presence")
          .then((rows) => {
            if (!mounted) return;
            const mine = rows.find((r) => r.userId === profile.id);
            setPresenceColor(
              mine
                ? (PRESENCE_COLORS[mine.presence] ?? PRESENCE_COLORS.INACTIVE)
                : PRESENCE_COLORS.ACTIVE,
            );
          })
          .catch(() => {});

        client
          .get<Array<{ id: string; name: string; slug: string }>>(
            "/auth/tenants",
          )
          .then((list) => {
            if (mounted && Array.isArray(list)) setTenants(list);
          })
          .catch(() => {});

        const installedList = await client.get<string[]>(
          "/saas/installed-apps",
        );
        if (!mounted) return;
        setInstalledApps(installedList);
        const activeSegment = pathname.split("/")[1];
        // Segment -> slug map is sourced from the API (single source of truth in
        // apps/api/src/common/app-slug-map.ts) instead of being hardcoded here.
        // Fall back to a static copy if the fetch hasn't resolved yet / fails, so
        // route gating behavior is unaffected on first paint.
        let segmentToSlug: Record<string, string> = {
          education: "education",
          "real-estate": "real-estate",
          "field-service": "field-service",
          finance: "finance",
          hr: "hr",
          crm: "crm",
          inventory: "inventory",
          procurement: "procurement",
          sales: "sales",
          "supply-chain": "supply-chain",
          projects: "projects",
          manufacturing: "manufacturing",
          analytics: "analytics",
          drive: "drive",
          storage: "drive",
          connect: "communication",
          communication: "communication",
          pos: "pos",
          builder: "builder",
          ecommerce: "ecommerce",
          ai: "ai",
        };
        try {
          const slugMap = await client.get<{
            gatedModules?: { slug: string; segments: string[] }[];
            industryAppSlugs?: string[];
          }>("/admin/marketplace/slug-map");
          if (mounted && slugMap) {
            const fetched: Record<string, string> = {};
            for (const slug of slugMap.industryAppSlugs || [])
              fetched[slug] = slug;
            for (const m of slugMap.gatedModules || [])
              for (const seg of m.segments) fetched[seg] = m.slug;
            if (Object.keys(fetched).length) segmentToSlug = fetched;
          }
        } catch {
          // keep the static fallback above
        }
        const guardedSlug = activeSegment
          ? segmentToSlug[activeSegment]
          : undefined;
        if (guardedSlug && !installedList.includes(guardedSlug))
          router.push("/apps");

        client
          .get<{ loaded?: boolean }>("/admin/demo/status")
          .then((data) => {
            if (mounted && data?.loaded) setDemoDataLoaded(true);
          })
          .catch(() => {});
      } catch {
        if (mounted) router.push("/login");
      }
    };
    loadSession();
    return () => {
      mounted = false;
    };
  }, [router, pathname, client]);

  const handleLogout = async () => {
    try {
      await client.post("/auth/logout");
    } catch {}
    router.push("/login");
  };

  const handleTenantSwitch = async (t: { name: string; slug: string }) => {
    setTenantDropdownOpen(false);
    if (t.slug === currentTenant.slug) return;
    try {
      // Server re-issues the session cookie scoped to the target tenant;
      // a full reload drops every tenant-scoped cache in one stroke.
      await client.post("/auth/switch-tenant", { tenantSlug: t.slug });
      window.location.assign("/apps");
    } catch {
      // Membership missing or revoked — leave the current session untouched.
    }
  };

  const isAppsLanding = pathname === "/apps";
  const hideSidebar =
    isAppsLanding ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/");
  const appNav =
    pathname.startsWith("/app/") &&
    dynamicAppNav &&
    dynamicAppNav.slug === pathname.split("/")[2]
      ? dynamicAppNav
      : getAppSpecificNavigation(pathname);

  const pathSegments = pathname.split("/").filter(Boolean);
  const showBreadcrumbs =
    !isAppsLanding &&
    !pathname.startsWith("/builder") &&
    pathSegments.length > 0;

  const breadcrumbsList = [];
  if (showBreadcrumbs) {
    breadcrumbsList.push({
      name: "Apps",
      href: "/apps",
    });

    let currentPath = "";
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      if (segment === "apps") return;

      breadcrumbsList.push({
        name: formatSegment(segment),
        href: currentPath,
      });
    });
  }

  const activeApps = allApplications.filter(
    (app) => KERNEL_APP_IDS.has(app.id) || installedApps.includes(app.id),
  );
  const folderAppIds = switcherFolders.flatMap((f) => f.appIds);
  const rootApps = activeApps.filter((app) => !folderAppIds.includes(app.id));
  const visibleFolders = switcherFolders.filter(
    (f) => activeApps.filter((a) => f.appIds.includes(a.id)).length > 0,
  );

  const switcherItems = useMemo(
    () =>
      [
        ...visibleFolders.map((folder) => ({
          type: "folder" as const,
          id: folder.id,
          name: folder.name,
          color: folder.color,
          apps: activeApps
            .filter((a) => folder.appIds.includes(a.id))
            .sort((a, b) => a.name.localeCompare(b.name)),
        })),
        ...rootApps.map((app) => ({
          type: "app" as const,
          id: app.id,
          name: app.name,
          href: app.href,
          icon: app.icon,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    [visibleFolders, activeApps, rootApps],
  );

  if (isLoading) {
    return (
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PermissionProvider>
      <div suppressHydrationWarning className={styles.s2}>
        {/* Sidebar Component */}
        {!hideSidebar && (
          <AppSidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            appNav={appNav}
            pathname={pathname}
            user={user}
          />
        )}

        {/* Main Workspace Section */}
        <div className={styles.s3}>
          {/* Header Component */}
          <AppHeader
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            theme={theme}
            currentTenant={currentTenant}
            tenants={tenants.length > 0 ? tenants : [currentTenant]}
            handleTenantSwitch={handleTenantSwitch}
            user={user}
            presenceColor={presenceColor}
            handleLogout={handleLogout}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            appsDropdownOpen={appsDropdownOpen}
            setAppsDropdownOpen={setAppsDropdownOpen}
            tenantDropdownOpen={tenantDropdownOpen}
            setTenantDropdownOpen={setTenantDropdownOpen}
            userDropdownOpen={userDropdownOpen}
            setUserDropdownOpen={setUserDropdownOpen}
            cmdPaletteOpen={cmdPaletteOpen}
            setCmdPaletteOpen={setCmdPaletteOpen}
            isAppsLanding={isAppsLanding}
            switcherItems={switcherItems}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            appsDropdownRef={appsDropdownRef}
            tenantDropdownRef={tenantDropdownRef}
            userDropdownRef={userDropdownRef}
            searchDropdownRef={searchDropdownRef}
            GLOBAL_SEARCH_ITEMS={GLOBAL_SEARCH_ITEMS}
          />

          {/* Content View Workspace */}
          <main
            id="main-content"
            role="main"
            style={{
              padding: pathname.startsWith("/builder")
                ? "0"
                : "var(--space-2) var(--space-6)",
            }}
            className={styles.s4}
          >
            <div
              style={{
                maxWidth: pathname.startsWith("/builder")
                  ? "100%"
                  : "var(--content-max-width)",
              }}
              className={styles.s5}
            >
              {showBreadcrumbs && breadcrumbsList.length > 0 && (
                <nav className="ui-breadcrumb" aria-label="breadcrumb">
                  {breadcrumbsList.map((crumb, idx) => {
                    const isLast = idx === breadcrumbsList.length - 1;
                    return (
                      <React.Fragment key={crumb.href}>
                        {idx > 0 && (
                          <span className="ui-breadcrumb-separator">/</span>
                        )}
                        {isLast ? (
                          <span className="ui-breadcrumb-active">
                            {crumb.name}
                          </span>
                        ) : (
                          <Link
                            href={crumb.href}
                            className="ui-breadcrumb-link"
                          >
                            {crumb.name}
                          </Link>
                        )}
                      </React.Fragment>
                    );
                  })}
                </nav>
              )}
              {demoDataLoaded && (
                <DemoBanner
                  currentModule={pathname.split("/")[1]}
                  onRemoved={() => setDemoDataLoaded(false)}
                />
              )}
              {subscription?.status === "TRIAL" && showTrialBanner && (
                <div className={`${styles.trialBanner} ui-animate-in`}>
                  <div className={styles.trialInfo}>
                    <Clock size={16} className={styles.trialIcon} />
                    <span>
                      Your <strong>Free Trial</strong> is active. You have{" "}
                      <strong>{trialDaysLeft} days left</strong>.
                    </span>
                  </div>
                  <div className={styles.trialActions}>
                    <Link
                      href="/saas/portal"
                      className={styles.trialUpgradeLink}
                    >
                      Upgrade Plan
                    </Link>
                    <button
                      onClick={() => setShowTrialBanner(false)}
                      className={styles.trialDismissBtn}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              {children}
            </div>
          </main>
        </div>

        {/* Command Palette (Ctrl+K) */}
        <CommandPalette
          isOpen={cmdPaletteOpen}
          onClose={() => setCmdPaletteOpen(false)}
          GLOBAL_SEARCH_ITEMS={GLOBAL_SEARCH_ITEMS}
          onLogout={handleLogout}
        />

        {/* Floating AI Chatbot Companion */}
        <AICopilot theme={theme} />
      </div>
    </PermissionProvider>
  );
}
