"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
  Search,
  Star,
  Heart,
  Loader2,
  Sparkles,
  Package,
  BarChart3,
  Cpu,
  Users,
  Zap,
  DollarSign,
  ShoppingBag,
  Factory,
  Shield,
  HeartPulse,
  Briefcase,
  ShoppingCart,
  Receipt,
  Truck,
  HardDrive,
  MessageSquare,
  CreditCard,
  Cloud,
  Target,
  ChevronDown,
  X,
  SlidersHorizontal,
  LayoutGrid as LayoutGridIcon,
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
      return <DollarSign size={36} strokeWidth={1.5} />;
    case "hr":
      return <Users size={36} strokeWidth={1.5} />;
    case "crm":
      return <Target size={36} strokeWidth={1.5} />;
    case "inventory":
      return <Package size={36} strokeWidth={1.5} />;
    case "procurement":
      return <ShoppingCart size={36} strokeWidth={1.5} />;
    case "sales":
      return <Receipt size={36} strokeWidth={1.5} />;
    case "supply-chain":
      return <Truck size={36} strokeWidth={1.5} />;
    case "projects":
      return <Briefcase size={36} strokeWidth={1.5} />;
    case "manufacturing":
      return <Factory size={36} strokeWidth={1.5} />;
    case "bi":
      return <BarChart3 size={36} strokeWidth={1.5} />;
    case "dashboard":
      return <LayoutGridIcon size={36} strokeWidth={1.5} />;
    case "drive":
      return <HardDrive size={36} strokeWidth={1.5} />;
    case "connect":
      return <MessageSquare size={36} strokeWidth={1.5} />;
    case "pos":
      return <CreditCard size={36} strokeWidth={1.5} />;
    case "api-keys":
      return <Cpu size={36} strokeWidth={1.5} />;
    case "saas":
      return <Cloud size={36} strokeWidth={1.5} />;
    case "admin":
      return <Shield size={36} strokeWidth={1.5} />;
    case "builder":
      return <Sparkles size={36} strokeWidth={1.5} />;
    case "healthcare":
      return <HeartPulse size={36} strokeWidth={1.5} />;
    default:
      return fallback ? (
        <span className="text-4xl">{fallback}</span>
      ) : (
        <Package size={36} strokeWidth={1.5} />
      );
  }
};

const allCategories = [
  "Analytics",
  "AI & Automation",
  "HR",
  "Integrations",
  "Operations",
  "Manufacturing",
  "Finance",
  "Sales",
  "Healthcare",
];

const pricingOptions = [
  { value: "", label: "All" },
  { value: "FREE", label: "Free" },
  { value: "FREEMIUM", label: "Freemium" },
  { value: "PAID", label: "Paid" },
];

export default function AppStorePage() {
  const client = useApiClient();
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [installedInfo, setInstalledInfo] = useState<
    Map<string, InstalledAppRow>
  >(new Map());
  const [favoriteSlugs, setFavoriteSlugs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [activePricing, setActivePricing] = useState("");
  const [sortBy, setSortBy] = useState<
    "popular" | "rating" | "newest" | "price_asc" | "price_desc"
  >("popular");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [uninstallTarget, setUninstallTarget] = useState<MarketplaceApp | null>(
    null,
  );
  const [installTarget, setInstallTarget] = useState<MarketplaceApp | null>(
    null,
  );
  const [kernelSlugs, setKernelSlugs] =
    useState<Set<string>>(DEFAULT_KERNEL_SLUGS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    client
      .get<{ kernelSlugs: string[] }>("/admin/marketplace/slug-map")
      .then((data) => {
        if (mounted && Array.isArray(data?.kernelSlugs))
          setKernelSlugs(new Set(data.kernelSlugs));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [client]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
      if (selectedCategories.size > 0)
        params.set("category", [...selectedCategories].join(","));
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
  }, [selectedCategories, searchQuery, activePricing, sortBy, page, client]);

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
          list.map((f) => f.app?.slug).filter((s): s is string => Boolean(s)),
        ),
      );
    } catch {}
  }, [client]);

  useEffect(() => {
    Promise.all([loadApps(), loadInstalled(), loadFavorites()]).finally(() =>
      setLoading(false),
    );
  }, [client]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setActivePricing("");
    setSearchQuery("");
    setPage(1);
  };

  const handleInstall = async (slug: string) => {
    setInstallingSlug(slug);
    try {
      await client.post(`/admin/marketplace/install/${slug}`);
      setInstalledSlugs((prev) => new Set([...prev, slug]));
      showToast("Installed");
      loadInstalled();
    } catch {
      showToast("Install failed", "error");
    } finally {
      setInstallingSlug(null);
    }
  };

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

  const requestUninstall = (app: MarketplaceApp) => setUninstallTarget(app);

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
      showToast("Uninstalled");
      loadInstalled();
    } catch {
      showToast("Uninstall failed", "error");
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

  const isInst = (slug: string) => installedSlugs.has(slug);
  const isFav = (slug: string) => favoriteSlugs.has(slug);
  const isBusy = (slug: string) => installingSlug === slug;
  const isSystem = (slug: string) => kernelSlugs.has(slug);

  const renderStars = (rating: number, size = 11) => {
    const r = Number(rating) || 0;
    return (
      <div className="ui-hstack-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={size}
            color={
              s <= Math.floor(r)
                ? "var(--color-warning)"
                : "var(--color-border)"
            }
            fill={s <= Math.floor(r) ? "var(--color-warning)" : "none"}
          />
        ))}
      </div>
    );
  };

  const activeFilterCount =
    (selectedCategories.size > 0 ? 1 : 0) + (activePricing ? 1 : 0);

  if (loading) {
    return (
      <RouteGuard permission="apps.store.read">
        <div className={styles.loadingWrap}>
          <Loader2
            size={28}
            className="animate-spin"
            color="var(--color-primary)"
          />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="apps.store.read">
      <div className={styles.container}>
        {toast && (
          <div
            className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}
          >
            {toast.message}
          </div>
        )}

        {/* Search bar */}
        <div className={styles.searchRow}>
          <div
            className="ui-search-wrapper"
            style={{ flex: 1, maxWidth: "none" }}
          >
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
              style={{ maxWidth: "none" }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-tertiary)",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter dropdown */}
          <div className={styles.filterWrap} ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterBtnActive : ""}`}
            >
              <SlidersHorizontal size={16} />
              <span>
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </span>
              <ChevronDown
                size={14}
                className={filterOpen ? styles.chevUp : ""}
              />
            </button>
            {filterOpen && (
              <div className={styles.filterDropdown}>
                <div className={styles.filterSection}>
                  <div className={styles.filterLabel}>Category</div>
                  {allCategories.map((cat) => (
                    <label key={cat} className={styles.filterCheckItem}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.has(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.filterDivider} />
                <div className={styles.filterSection}>
                  <div className={styles.filterLabel}>Pricing</div>
                  {pricingOptions.map((opt) => (
                    <label key={opt.value} className={styles.filterCheckItem}>
                      <input
                        type="radio"
                        name="pricing"
                        checked={activePricing === opt.value}
                        onChange={() => {
                          setActivePricing(opt.value);
                          setPage(1);
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className={styles.clearBtn}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className={styles.sortSelect}
          >
            <option value="popular">Popular</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low</option>
            <option value="price_desc">Price: High</option>
          </select>
        </div>

        {/* App count */}
        <div className={styles.resultInfo}>
          <span>
            {total} app{total !== 1 ? "s" : ""}
          </span>
          {(searchQuery || activeFilterCount > 0) && (
            <button onClick={clearFilters} className={styles.clearLink}>
              Clear all
            </button>
          )}
        </div>

        {/* App Grid */}
        {apps.length > 0 ? (
          <div className={styles.appGrid}>
            {apps.map((app) => {
              const slug = app.slug;
              const installed = isInst(slug);
              const busy = isBusy(slug);
              const sys = isSystem(slug);
              const updateAvail = !!installedInfo.get(slug)?.updateAvailable;
              const fav = isFav(slug);
              return (
                <Link
                  key={slug}
                  href={`/apps/store/${slug}`}
                  className={styles.gridCard}
                >
                  <div className={styles.cardTop}>
                    <div
                      className={styles.gridIcon}
                      style={{
                        background: "var(--color-primary-light)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {getAppIcon(slug, app.icon)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(slug);
                      }}
                      className={styles.heartBtn}
                    >
                      <Heart
                        size={14}
                        fill={fav ? "var(--color-danger)" : "none"}
                        color={
                          fav ? "var(--color-danger)" : "var(--color-border)"
                        }
                      />
                    </button>
                  </div>
                  <div className={styles.cardName}>{app.name}</div>
                  <div className={styles.cardCat}>{app.category}</div>
                  <div
                    className="ui-hstack-1"
                    style={{ justifyContent: "center" }}
                  >
                    {renderStars(app.rating, 9)}
                    <span className={styles.ratingNum}>
                      {Number(app.rating).toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.cardActions}>
                    {sys ? (
                      <button
                        className={`${styles.getBtn} ${styles.getBtnCore}`}
                        disabled
                      >
                        Core
                      </button>
                    ) : installed ? (
                      <button
                        className={`${styles.getBtn} ${styles.getBtnInstalled}`}
                        onClick={(e) => {
                          e.preventDefault();
                          updateAvail && requestInstall(app);
                        }}
                      >
                        {updateAvail ? "Update" : "Open"}
                      </button>
                    ) : busy ? (
                      <button className={styles.getBtn} disabled>
                        <Loader2 size={12} className="animate-spin" />
                      </button>
                    ) : (
                      <button
                        className={styles.getBtn}
                        onClick={(e) => {
                          e.preventDefault();
                          requestInstall(app);
                        }}
                      >
                        Get
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Search size={36} style={{ color: "var(--color-text-tertiary)" }} />
            <div className={styles.emptyTitle}>No Apps Found</div>
            <div className={styles.emptyDesc}>
              Try adjusting your search or filters.
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pageNav}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={styles.pageBtn}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>
        )}

        {/* Dialogs */}
        {uninstallTarget && (
          <div
            className={styles.dialogOverlay}
            onClick={() => setUninstallTarget(null)}
          >
            <div
              className={styles.dialogCard}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.dialogTitle}>
                Uninstall {uninstallTarget.name}?
              </h3>
              <p className={styles.dialogDesc}>
                {!uninstallTarget.isCore && uninstallTarget.bundleId
                  ? `This removes extracted files and provisioned pages for ${uninstallTarget.name}. Data in the app's own tables will be deleted.`
                  : `Your data is preserved and you can reinstall ${uninstallTarget.name} later without losing anything.`}
              </p>
              <div className={styles.dialogBtnRow}>
                <button
                  onClick={() => setUninstallTarget(null)}
                  className={`${styles.dialogBtn} ${styles.dialogBtnSecondary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUninstall(uninstallTarget.slug)}
                  className={`${styles.dialogBtn} ${styles.dialogBtnDanger}`}
                >
                  {isBusy(uninstallTarget.slug) ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Uninstall"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {installTarget && (
          <div
            className={styles.dialogOverlay}
            onClick={() => setInstallTarget(null)}
          >
            <div
              className={styles.dialogCard}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.dialogTitle}>
                Install {installTarget.name}
              </h3>
              <p className={styles.dialogDesc}>{installTarget.description}</p>
              {installTarget.features?.length > 0 && (
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <div className={styles.dialogSectionLabel}>Features</div>
                  <ul className={styles.dialogList}>
                    {installTarget.features.slice(0, 6).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className={styles.dialogPrice}>
                {installTarget.pricing === "FREE"
                  ? "Free"
                  : installTarget.pricing === "FREEMIUM"
                    ? "Free with in-app purchases"
                    : `$${installTarget.price}/mo`}
              </div>
              <div className={styles.dialogBtnRow}>
                <button
                  onClick={() => setInstallTarget(null)}
                  className={`${styles.dialogBtn} ${styles.dialogBtnSecondary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmInstall}
                  className={`${styles.dialogBtn} ${styles.dialogBtnPrimary}`}
                >
                  {isBusy(installTarget.slug) ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Install"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
