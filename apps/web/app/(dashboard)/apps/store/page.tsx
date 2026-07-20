"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, ConfirmDialog } from "@unerp/ui";
import {
  Search,
  ArrowLeft,
  Download,
  Star,
  TrendingUp,
  Heart,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Loader2,
  Sparkles,
  Package,
  BarChart3,
  Cpu,
  Users,
  Settings,
  Zap,
  DollarSign,
  ShoppingBag,
  Factory,
  Shield,
  ChevronLeft,
  HeartPulse,
  Code2,
  Briefcase,
  ShoppingCart,
  Receipt,
  Truck,
  HardDrive,
  MessageSquare,
  CreditCard,
  Cloud,
  Target,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface MarketplaceApp {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  icon: string | null;
  publisher: string;
  publisherLogo?: string;
  version: string;
  pricing: string;
  price: number | null;
  rating: number;
  reviewCount: number;
  installs: number;
  features: string[];
  tags: string[];
  screenshots: { url: string; caption: string }[];
  featured: boolean;
  verified: boolean;
  status: string;
  metadata?: { isSystem?: boolean };
  isCore?: boolean;
  bundleId?: string | null;
  configSchema?: Record<string, unknown>;
}

interface InstalledAppRow {
  appSlug: string;
  installedVersion?: string;
  latestVersion?: string;
  updateAvailable?: boolean;
  source?: string;
}

interface AppCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  items: { app: MarketplaceApp }[];
}

// Kernel apps are locked (never uninstallable) so an admin surface is always available.
// Every other app — gated core business modules and industry bundles — is install/uninstall-able.
// Fallback used only until GET /admin/marketplace/slug-map resolves; source of truth lives in
// apps/api/src/common/app-slug-map.ts.
const DEFAULT_KERNEL_SLUGS = new Set([
  "dashboard",
  "admin",
  "builder",
  "api-keys",
  "saas",
]);

const getAppIcon = (slug: string, fallback?: string | null) => {
  switch (slug) {
    case "finance":
      return <DollarSign size={40} strokeWidth={1.5} />;
    case "hr":
      return <Users size={40} strokeWidth={1.5} />;
    case "crm":
      return <Target size={40} strokeWidth={1.5} />;
    case "inventory":
      return <Package size={40} strokeWidth={1.5} />;
    case "procurement":
      return <ShoppingCart size={40} strokeWidth={1.5} />;
    case "sales":
      return <Receipt size={40} strokeWidth={1.5} />;
    case "supply-chain":
      return <Truck size={40} strokeWidth={1.5} />;
    case "projects":
      return <Briefcase size={40} strokeWidth={1.5} />;
    case "manufacturing":
      return <Factory size={40} strokeWidth={1.5} />;
    case "bi":
      return <BarChart3 size={40} strokeWidth={1.5} />;
    case "dashboard":
      return <LayoutGrid size={40} strokeWidth={1.5} />;
    case "drive":
      return <HardDrive size={40} strokeWidth={1.5} />;
    case "connect":
      return <MessageSquare size={40} strokeWidth={1.5} />;
    case "pos":
      return <CreditCard size={40} strokeWidth={1.5} />;
    case "api-keys":
      return <Cpu size={40} strokeWidth={1.5} />;
    case "saas":
      return <Cloud size={40} strokeWidth={1.5} />;
    case "admin":
      return <Shield size={40} strokeWidth={1.5} />;
    case "builder":
      return <Sparkles size={40} strokeWidth={1.5} />;
    case "healthcare":
      return <HeartPulse size={40} strokeWidth={1.5} />;
    default:
      return fallback ? (
        <span className="text-4xl">{fallback}</span>
      ) : (
        <Package size={40} strokeWidth={1.5} />
      );
  }
};

const categoryMeta: Record<string, { icon: React.ReactNode; color: string }> = {
  Analytics: { icon: <BarChart3 size={20} />, color: "var(--color-primary)" },
  "AI & Automation": { icon: <Cpu size={20} />, color: "var(--color-primary)" },
  HR: { icon: <Users size={20} />, color: "var(--color-primary)" },
  Integrations: { icon: <Zap size={20} />, color: "var(--color-primary)" },
  Operations: { icon: <Settings size={20} />, color: "var(--color-primary)" },
  Manufacturing: { icon: <Factory size={20} />, color: "var(--color-primary)" },
  Finance: { icon: <DollarSign size={20} />, color: "var(--color-primary)" },
  Sales: { icon: <ShoppingBag size={20} />, color: "var(--color-primary)" },
  Healthcare: { icon: <HeartPulse size={20} />, color: "var(--color-primary)" },
};

export default function AppStorePage() {
  const router = useRouter();
  const client = useApiClient();
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [collections, setCollections] = useState<AppCollection[]>([]);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [installedInfo, setInstalledInfo] = useState<
    Map<string, InstalledAppRow>
  >(new Map());
  const [favoriteSlugs, setFavoriteSlugs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activePricing, setActivePricing] = useState("");
  const [sortBy, setSortBy] = useState<
    "popular" | "rating" | "newest" | "price_asc" | "price_desc"
  >("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryStats, setCategoryStats] = useState<
    { category: string; count: number }[]
  >([]);
  const [uninstallTarget, setUninstallTarget] = useState<MarketplaceApp | null>(
    null,
  );
  const [installTarget, setInstallTarget] = useState<MarketplaceApp | null>(
    null,
  );
  const [kernelSlugs, setKernelSlugs] = useState<Set<string>>(DEFAULT_KERNEL_SLUGS);
  const [appStorage, setAppStorage] = useState<
    Map<string, { estimatedMb: number; rowCount: number }>
  >(new Map());

  useEffect(() => {
    let mounted = true;
    client
      .get<{ kernelSlugs: string[] }>("/admin/marketplace/slug-map")
      .then((data) => {
        if (mounted && Array.isArray(data?.kernelSlugs)) {
          setKernelSlugs(new Set(data.kernelSlugs));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [client]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadApps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (searchQuery) params.set("search", searchQuery);
      if (activePricing) params.set("pricing", activePricing);
      params.set("sort", sortBy);
      params.set("page", String(page));
      params.set("limit", "24");
      const data = await client.get<{
        apps: MarketplaceApp[];
        totalPages: number;
        total: number;
      }>(`/admin/marketplace/apps?${params}`);
      setApps(data.apps);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {}
  }, [activeCategory, searchQuery, activePricing, sortBy, page, client]);

  const loadCollections = useCallback(async () => {
    try {
      setCollections(
        await client.get<AppCollection[]>("/admin/marketplace/collections"),
      );
    } catch {}
  }, [client]);

  const loadInstalled = useCallback(async () => {
    try {
      const list = await client.get<InstalledAppRow[]>(
        "/admin/marketplace/installed",
      );
      setInstalledSlugs(new Set(list.map((a) => a.appSlug)));
      setInstalledInfo(new Map(list.map((a) => [a.appSlug, a])));
    } catch {}
  }, [client]);

  const loadFavorites = useCallback(async () => {
    try {
      const list = await client.get<Array<{ app?: { slug?: string } }>>(
        "/admin/marketplace/favorites",
      );
      setFavoriteSlugs(
        new Set(
          list
            .map((f) => f.app?.slug)
            .filter((slug): slug is string => Boolean(slug)),
        ),
      );
    } catch {}
  }, [client]);

  const loadStats = useCallback(async () => {
    try {
      const data = await client.get<{
        categories?: { category: string; count: number }[];
      }>("/admin/marketplace/stats");
      setCategoryStats(data.categories || []);
    } catch {}
  }, [client]);

  useEffect(() => {
    Promise.all([
      loadApps(),
      loadCollections(),
      loadInstalled(),
      loadFavorites(),
      loadStats(),
      client
        .get<
          Array<{ appSlug: string; rowCount: number; estimatedBytes: string }>
        >("/saas/storage-usage")
        .then((data) => {
          const map = new Map<
            string,
            { estimatedMb: number; rowCount: number }
          >();
          for (const a of data || []) {
            map.set(a.appSlug, {
              estimatedMb: Math.round(
                Number(a.estimatedBytes) / (1024 * 1024),
              ),
              rowCount: a.rowCount,
            });
          }
          setAppStorage(map);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const handleInstall = async (slug: string) => {
    setInstallingSlug(slug);
    try {
      await client.post(`/admin/marketplace/install/${slug}`);
      setInstalledSlugs((prev) => new Set([...prev, slug]));
      showToast("App installed successfully!");
      loadInstalled();
    } catch {
      showToast("Failed to install app", "error");
    } finally {
      setInstallingSlug(null);
    }
  };

  // Opens the pre-install disclosure step instead of installing immediately —
  // surfaces what the app adds (features + config) before committing.
  const requestInstall = (app: MarketplaceApp) => {
    if (app.pricing === "FREE" && !app.configSchema) {
      handleInstall(app.slug);
      return;
    }
    setInstallTarget(app);
  };

  const confirmInstall = async () => {
    if (!installTarget) return;
    const slug = installTarget.slug;
    setInstallTarget(null);
    await handleInstall(slug);
  };

  const requestUninstall = (app: MarketplaceApp) => {
    setUninstallTarget(app);
  };

  const handleUninstall = async (slug: string) => {
    setUninstallTarget(null);
    setInstallingSlug(slug);
    try {
      await client.delete(`/admin/marketplace/uninstall/${slug}`);
      setInstalledSlugs((prev) => {
        const s = new Set(prev);
        s.delete(slug);
        return s;
      });
      showToast("App uninstalled");
      loadInstalled();
    } catch {
      showToast("Failed to uninstall", "error");
    } finally {
      setInstallingSlug(null);
    }
  };

  const toggleFavorite = async (slug: string) => {
    const isFav = favoriteSlugs.has(slug);
    try {
      if (isFav) {
        await client.delete(`/admin/marketplace/favorites/${slug}`);
        setFavoriteSlugs((prev) => {
          const s = new Set(prev);
          s.delete(slug);
          return s;
        });
      } else {
        await client.post(`/admin/marketplace/favorites/${slug}`);
        setFavoriteSlugs((prev) => new Set([...prev, slug]));
      }
    } catch {}
  };

  const seedApps = async () => {
    try {
      await client.post("/admin/marketplace/seed");
      showToast("Marketplace seeded with apps, collections & changelogs!");
      setLoading(true);
      await Promise.all([loadApps(), loadCollections(), loadStats()]);
      setLoading(false);
    } catch {}
  };

  const featuredApps = apps.filter((a) => a.featured).slice(0, 4);
  const allCategories = Object.keys(categoryMeta);

  const renderStars = (rating: number) => {
    const r = Number(rating) || 0;
    return (
      <div className="ui-flex ui-gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={11}
            className={
              s <= Math.floor(r) ? "ui-text-primary" : "ui-text-tertiary"
            }
            fill={s <= Math.floor(r) ? "var(--color-primary)" : "none"}
          />
        ))}
      </div>
    );
  };

  const renderAppCard = (app: MarketplaceApp) => {
    const isInstalled = installedSlugs.has(app.slug);
    const isFav = favoriteSlugs.has(app.slug);
    const isBusy = installingSlug === app.slug;
    // Locked = kernel app (non-uninstallable). Gated business modules are now uninstallable.
    const isSystem = kernelSlugs.has(app.slug);
    // CATALOG = code-resident in-house module (isCore or no bundle, uninstall just
    // drops the gating row and preserves data); MARKETPLACE = bundle-backed extension
    // (uninstall really tears down provisioned rows + extracted files). Mirrors
    // MarketplaceService.installApp()'s `app.isCore || !app.bundleId` branch.
    const isBundleBacked = !app.isCore && !!app.bundleId;
    const updateAvailable = !!installedInfo.get(app.slug)?.updateAvailable;

    if (viewMode === "list") {
      return (
        <div
          key={app.slug}
          className="ui-flex ui-items-center ui-gap-4 p-4 border-b border-border/40 hover:bg-muted/20 transition-colors group"
        >
          <Link href={`/apps/store/${app.slug}`} className="flex-shrink-0">
            <div
              style={{
                background:
                  categoryMeta[app.category]?.color
                    ? `${categoryMeta[app.category]!.color}15`
                    : "var(--color-primary)15",
                color:
                  categoryMeta[app.category]?.color || "var(--color-primary)",
              }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-border/50 group-hover:scale-105 transition-transform"
            >
              {getAppIcon(app.slug, app.icon)}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/apps/store/${app.slug}`} className="block">
              <div className="ui-flex ui-items-center ui-gap-2 mb-0.5">
                <span className="font-semibold text-foreground ui-truncate">
                  {app.name}
                </span>
                {app.verified && (
                  <Shield size={12} className="text-primary fill-primary/20" />
                )}
                {!isSystem && (
                  <Badge
                    variant={isBundleBacked ? "info" : "default"}
                    className="text-[9px] px-1 py-0"
                  >
                    {isBundleBacked ? "Extension" : "System"}
                  </Badge>
                )}
                {isInstalled && updateAvailable && (
                  <Badge variant="warning" className="text-[9px] px-1 py-0">
                    Update available
                  </Badge>
                )}
              </div>
              <p className="ui-text-xs-muted ui-truncate">
                {app.description}
              </p>
              {isInstalled && appStorage.has(app.slug) && (
                <div className="text-[9px] text-muted-foreground/60 mt-0.5">
                  ~{(() => {
                    const s = appStorage.get(app.slug)!;
                    return s.estimatedMb >= 1024
                      ? `${(s.estimatedMb / 1024).toFixed(1)} GB`
                      : `${s.estimatedMb} MB`;
                  })()}
                  {" · "}
                  {appStorage.get(app.slug)!.rowCount.toLocaleString()} records
                </div>
              )}
            </Link>
          </div>

          <div className="ui-flex ui-items-center ui-gap-4">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="ui-flex ui-items-center ui-gap-1 ui-text-xs-muted">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                {Number(app.rating).toFixed(1)}
                <span className="text-muted-foreground/70">
                  · {app.installs.toLocaleString()} installs
                </span>
              </div>
              <Badge
                variant={
                  app.pricing === "FREE"
                    ? "success"
                    : app.pricing === "FREEMIUM"
                      ? "info"
                      : "warning"
                }
                className="text-[10px] px-1.5 py-0"
              >
                {app.pricing === "FREE"
                  ? "Free"
                  : app.pricing === "FREEMIUM"
                    ? "Freemium"
                    : `$${app.price}/mo`}
              </Badge>
            </div>

            <div className="ui-flex ui-items-center ui-gap-2">
              {!isSystem && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(app.slug);
                  }}
                  className={`p-2 rounded-full transition-colors ${isFav ? "ui-text-danger hover:bg-danger/10" : "ui-text-muted hover:bg-muted"}`}
                >
                  <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                </button>
              )}
              {isSystem ? (
                <button
                  disabled
                  className="ui-btn ui-btn-secondary rounded-full text-xs font-semibold uppercase tracking-wider"
                >
                  Core
                </button>
              ) : isInstalled ? (
                <button
                  onClick={() => requestUninstall(app)}
                  disabled={isBusy}
                  className="ui-btn ui-btn-secondary rounded-full text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer w-[72px]"
                >
                  {isBusy ? (
                    <Loader2 size={12} className="animate-spin mx-auto" />
                  ) : (
                    "Uninstall"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => requestInstall(app)}
                  disabled={isBusy}
                  className="ui-btn ui-btn-primary rounded-full text-xs font-semibold transition-colors cursor-pointer w-[72px]"
                >
                  {isBusy ? (
                    <Loader2 size={12} className="animate-spin mx-auto" />
                  ) : (
                    "Get"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={app.slug} className="flex flex-col items-center group">
        <Link
          href={`/apps/store/${app.slug}`}
          className="flex flex-col items-center gap-3 w-full"
        >
          <div className="relative">
            <div
              style={{
                background: `${categoryMeta[app.category]?.color || "var(--color-primary)"}15`,
                color:
                  categoryMeta[app.category]?.color || "var(--color-primary)",
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] flex items-center justify-center text-4xl shadow-sm border border-border/50 group-hover:shadow-md group-hover:scale-[1.02] transition-all duration-300"
            >
              {getAppIcon(app.slug, app.icon)}
            </div>
            {!isSystem && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(app.slug);
                }}
                className={`absolute -top-2 -right-2 p-1.5 rounded-full bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${isFav ? "ui-text-danger opacity-100" : "ui-text-muted"}`}
              >
                <Heart size={12} fill={isFav ? "currentColor" : "none"} />
              </button>
            )}
            {isInstalled && updateAvailable && (
              <span
                title="Update available"
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-warning border-2 border-background"
              />
            )}
          </div>

          <div className="text-center w-full px-2 space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <h3 className="font-semibold text-sm ui-truncate max-w-full text-foreground group-hover:text-primary transition-colors">
                {app.name}
              </h3>
            </div>
            <p className="ui-text-xs-muted ui-truncate w-full">
              {app.category}
            </p>
            <div className="ui-flex ui-items-center ui-gap-1 ui-text-xs-muted">
              <Star size={9} className="fill-amber-400 text-amber-400" />
              {Number(app.rating).toFixed(1)}
              <span>· {app.installs.toLocaleString()} installs</span>
            </div>
            {isInstalled && appStorage.has(app.slug) && (
              <div className="text-[9px] text-muted-foreground/60">
                ~{(() => {
                  const s = appStorage.get(app.slug)!;
                  return s.estimatedMb >= 1024
                    ? `${(s.estimatedMb / 1024).toFixed(1)} GB`
                    : `${s.estimatedMb} MB`;
                })()}{" "}
                · {appStorage.get(app.slug)!.rowCount.toLocaleString()} records
              </div>
            )}
            <div className="ui-flex ui-items-center ui-gap-1">
              {!isSystem && (
                <Badge
                  variant={isBundleBacked ? "info" : "default"}
                  className="text-[9px] px-1 py-0"
                >
                  {isBundleBacked ? "Extension" : "System"}
                </Badge>
              )}
              {isInstalled && updateAvailable && (
                <Badge variant="warning" className="text-[9px] px-1 py-0">
                  Update
                </Badge>
              )}
            </div>
          </div>
        </Link>

        <div className="mt-3">
          {isSystem ? (
            <button
              disabled
              className="ui-btn ui-btn-secondary rounded-full text-xs font-semibold uppercase tracking-wider"
            >
              Core
            </button>
          ) : isInstalled ? (
            <button
              onClick={() => requestUninstall(app)}
              disabled={isBusy}
              className="ui-btn ui-btn-secondary rounded-full text-xs font-bold uppercase tracking-wider transition-colors w-[76px]"
            >
              {isBusy ? (
                <Loader2 size={12} className="animate-spin mx-auto" />
              ) : (
                "Uninstall"
              )}
            </button>
          ) : (
            <button
              onClick={() => requestInstall(app)}
              disabled={isBusy}
              className="ui-btn ui-btn-primary rounded-full text-xs font-bold uppercase tracking-wider transition-colors w-[76px]"
            >
              {isBusy ? (
                <Loader2 size={12} className="animate-spin mx-auto" />
              ) : (
                "Get"
              )}
            </button>
          )}
        </div>
        {!isSystem && (
          <div className="mt-1.5 text-[10px] text-muted-foreground">
            {app.pricing === "FREE"
              ? "In-App Purchases"
              : app.pricing === "FREEMIUM"
                ? "In-App Purchases"
                : "Subscription"}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ui-flex-center min-h-[500px]">
        <Loader2 size={32} className="animate-spin ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="apps.store.read">
      <div className="ui-stack-6 ui-animate-in">
        {toast && (
          <div
            className={`toastItem ${toast.type === "success" ? "toastSuccess" : "toastError"}`}
          >
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="ui-page-header">
          <div>
            <div className="ui-breadcrumb">
              <Link href="/apps" className="ui-breadcrumb-link">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="ui-page-header-title">
                <Package className="ui-text-primary" /> App Store
              </h1>
            </div>
            <p className="ui-page-header-subtitle">
              {total} apps available · Discover, install, and manage extensions
            </p>
          </div>
          <div className="ui-page-header-actions">
            <Button variant="secondary" size="sm" onClick={() => router.push("/apps/store/favorites")}>
              <Heart size={14} /> Favorites
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/apps/store/collections")}>
              <Sparkles size={14} /> Collections
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/apps/developer")}>
              <Code2 size={14} /> Developer
            </Button>
            {apps.length === 0 && (
              <Button variant="primary" size="sm" onClick={seedApps}>
                Seed Core + Healthcare
              </Button>
            )}
          </div>
        </div>

        {/* Hero Banner */}
        {featuredApps.length > 0 && !activeCategory && !searchQuery && (
          <div className="heroBanner">
            <div className="heroContent">
              <div className="ui-flex ui-items-center ui-gap-2 mb-2">
                <TrendingUp size={16} />
                <span className="ui-text-xs-label tracking-wider uppercase opacity-80">
                  Featured & Trending
                </span>
              </div>
              <h2 className="text-xl font-bold m-0 mb-2">
                Extend Your ERP with Powerful Modules
              </h2>
              <p className="text-sm m-0 mb-4 max-w-[600px] opacity-80">
                Browse {total}+ apps across {categoryStats.length} categories.
                Install with one click and start using immediately.
              </p>
              <div className="flex flex-wrap gap-3">
                {featuredApps.map((app) => (
                  <Link
                    key={app.slug}
                    href={`/apps/store/${app.slug}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    <div className="featuredApp">
                      <span className="text-[22px]">{app.icon || "📦"}</span>
                      <div>
                        <div className="ui-heading-sm">{app.name}</div>
                        <span className="text-[10px] opacity-70">
                          {Number(app.rating).toFixed(1)} ★ ·{" "}
                          {app.installs.toLocaleString()} installs
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collections Row */}
        {collections.filter((c) => c.featured).length > 0 &&
          !activeCategory &&
          !searchQuery && (
            <div className="mb-8">
              <div className="ui-flex-between mb-4">
                <h2 className="text-xl font-bold tracking-tight ui-flex ui-items-center ui-gap-2">
                  <Sparkles size={20} className="ui-text-primary" />
                  Must-Have Apps
                </h2>
                <Link
                  href="/apps/store/collections"
                  className="text-sm text-primary hover:underline ui-flex ui-items-center ui-gap-1 font-medium"
                >
                  See All <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {collections
                  .filter((c) => c.featured)
                  .slice(0, 3)
                  .map((col) => (
                    <Link
                      key={col.slug}
                      href={`/apps/store/collections/${col.slug}`}
                      className="featuredCollection group relative block overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-md transition-all duration-300"
                    >
                      <div className="h-24 bg-gradient-to-br from-primary/10 to-transparent"></div>
                      <div className="px-5 pb-5 -mt-8 relative">
                        <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center text-2xl mb-3">
                          {col.icon || "💎"}
                        </div>
                        <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                          {col.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {col.description}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

        {/* Category Grid */}
        {!activeCategory && !searchQuery && (
          <div className="mb-8">
            <div className="ui-flex-between mb-4">
              <h2 className="text-xl font-bold tracking-tight">
                Browse Categories
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allCategories.map((cat) => {
                const meta = categoryMeta[cat] || {
                  icon: "📦",
                  color: "var(--color-primary)",
                  description: "",
                };
                const stat = categoryStats.find((s) => s.category === cat);
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setPage(1);
                    }}
                    className="categoryCard flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all text-left group"
                    style={
                      { "--category-color": meta.color } as React.CSSProperties
                    }
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: `${meta.color}15`,
                        color: meta.color,
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground ui-truncate group-hover:text-primary transition-colors">
                        {cat}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search, Filter & Sort Bar */}
        <Card padding="md" className="ui-flex ui-flex-wrap ui-items-center ui-gap-3">
          <div className="ui-search-wrapper ui-flex-1" style={{ minWidth: "200px", flexBasis: "300px" }}>
            <Search size={16} className="ui-search-icon" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="ui-search-input"
            />
          </div>

          {activeCategory && (
            <div
              className="ui-chip rounded-full"
              style={{
                background: `${categoryMeta[activeCategory]?.color || "var(--color-primary)"}15`,
                color:
                  categoryMeta[activeCategory]?.color || "var(--color-primary)",
              }}
            >
              {activeCategory}
              <button
                onClick={() => {
                  setActiveCategory("");
                  setPage(1);
                }}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  marginLeft: 4,
                }}
              >
                ×
              </button>
            </div>
          )}

          <Button
            variant={showFilters ? "primary" : "outline"}
            size="sm"
            leftIcon={<SlidersHorizontal size={14} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="ui-select"
            style={{ width: "auto", minWidth: "140px" }}
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "primary" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none border-0"
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none border-0"
            >
              <List size={14} />
            </Button>
          </div>
        </Card>

        {/* Filter Panel */}
        {showFilters && (
          <Card padding="md" className="ui-flex ui-flex-wrap ui-gap-4">
            <div>
              <label className="ui-text-xs-label block mb-1">Pricing</label>
              <div className="ui-flex ui-gap-1">
                {["", "FREE", "PAID", "FREEMIUM"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setActivePricing(p);
                      setPage(1);
                    }}
                    className={`ui-pill ${activePricing === p ? "ui-pill-active" : ""}`}
                  >
                    {p || "All"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="ui-text-xs-label block mb-1">Category</label>
              <div className="ui-flex ui-flex-wrap ui-gap-1">
                <button
                  onClick={() => {
                    setActiveCategory("");
                    setPage(1);
                  }}
                  className={`ui-pill ${!activeCategory ? "ui-pill-active" : ""}`}
                >
                  All
                </button>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setPage(1);
                    }}
                    className={`ui-pill ${activeCategory === cat ? "ui-pill-active" : ""}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* App Grid/List */}
        {viewMode === "grid" ? (
          <div>
            <div className="ui-flex-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                {activeCategory
                  ? `${activeCategory} Apps`
                  : searchQuery
                    ? "Search Results"
                    : "All Apps"}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
              {apps.map(renderAppCard)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col border border-border/50 rounded-xl overflow-hidden bg-card">
            {apps.map(renderAppCard)}
          </div>
        )}

        {apps.length === 0 && !loading && (
          <div className="ui-empty-state">
            <Search size={48} className="ui-empty-state-icon" />
            <h4 className="ui-empty-state-title">No Apps Found</h4>
            <p className="ui-empty-state-text">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="ui-flex-center ui-gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`ui-btn ui-btn-icon border bg-card ${page === 1 ? "opacity-40 cursor-default" : "cursor-pointer"}`}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="ui-text-sm-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`ui-btn ui-btn-icon border bg-card ${page === totalPages ? "opacity-40 cursor-default" : "cursor-pointer"}`}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Uninstall confirmation — data-preservation copy differs by source (#1) */}
        <ConfirmDialog
          open={!!uninstallTarget}
          onClose={() => setUninstallTarget(null)}
          onConfirm={() => uninstallTarget && handleUninstall(uninstallTarget.slug)}
          title={`Uninstall ${uninstallTarget?.name || "app"}?`}
          confirmLabel="Uninstall"
          cancelLabel="Cancel"
          variant="danger"
          loading={
            !!uninstallTarget && installingSlug === uninstallTarget.slug
          }
          message={
            uninstallTarget && (
              <div className="ui-stack-2 text-sm">
                {!uninstallTarget.isCore && uninstallTarget.bundleId ? (
                  <p>
                    This removes the extracted files and provisioned pages
                    for <strong>{uninstallTarget.name}</strong> from this
                    workspace. Data stored in the app's own tables will be
                    deleted along with it — reinstalling starts fresh.
                  </p>
                ) : (
                  <>
                    <p>
                      Your data is preserved and you can reinstall{" "}
                      <strong>{uninstallTarget.name}</strong> later without
                      losing anything — uninstalling only removes it from your
                      app list.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: Uninstalling alone does not reduce your storage
                      usage. To free space, delete or export the app's records
                      before uninstalling, or manage data from the SaaS Portal.
                    </p>
                  </>
                )}
              </div>
            )
          }
        />

        {/* Pre-install disclosure — what the app adds, before committing (#3) */}
        <ConfirmDialog
          open={!!installTarget}
          onClose={() => setInstallTarget(null)}
          onConfirm={confirmInstall}
          title={`Install ${installTarget?.name || "app"}`}
          confirmLabel="Install"
          cancelLabel="Cancel"
          loading={
            !!installTarget && installingSlug === installTarget.slug
          }
          message={
            installTarget && (
              <div className="ui-stack-3 text-sm text-left">
                <p className="text-muted-foreground">
                  {installTarget.description}
                </p>
                {installTarget.features?.length > 0 && (
                  <div>
                    <div className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      This app adds
                    </div>
                    <ul className="ui-stack-1 list-disc list-inside">
                      {installTarget.features.slice(0, 8).map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {installTarget.configSchema &&
                  Object.keys(
                    (installTarget.configSchema as any)?.properties || {},
                  ).length > 0 && (
                    <div>
                      <div className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Configuration you'll be able to set
                      </div>
                      <ul className="ui-stack-1 list-disc list-inside">
                        {Object.entries(
                          (installTarget.configSchema as any).properties as Record<
                            string,
                            { title?: string; description?: string }
                          >,
                        ).map(([key, def]) => (
                          <li key={key}>{def?.title || def?.description || key}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                <p className="text-xs text-muted-foreground">
                  {installTarget.pricing === "FREE"
                    ? "Free to install."
                    : installTarget.pricing === "FREEMIUM"
                      ? "Free to install with optional in-app purchases."
                      : `Subscription: $${installTarget.price}/mo.`}
                </p>
              </div>
            )
          }
        />
      </div>
    </RouteGuard>
  );
}
