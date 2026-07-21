"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Heart,
  Shield,
  Clock,
  Download,
  FileText,
  MessageSquare,
  History,
  Loader2,
  ThumbsUp,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface AppDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string | null;
  category: string;
  icon: string | null;
  publisher: string;
  publisherLogo: string | null;
  publisherWebsite: string | null;
  version: string;
  pricing: string;
  price: number | null;
  rating: number;
  reviewCount: number;
  installs: number;
  features: string[];
  screenshots: { url: string; caption: string }[];
  tags: string[];
  requiresApps: string[];
  supportUrl: string | null;
  documentationUrl: string | null;
  privacyPolicyUrl: string | null;
  featured: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  reviews: Review[];
  changelogs: Changelog[];
  ratingDistribution: { rating: number; count: number }[];
  relatedApps: AppDetail[];
  metadata?: { isSystem?: boolean };
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string | null;
  helpfulCount: number;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface Changelog {
  id: string;
  version: string;
  changes: string;
  publishedAt: string;
}

export default function AppDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const slug = params.slug as string;

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "reviews" | "changelog" | "support"
  >("overview");
  const [isInstalled, setIsInstalled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // All reviews
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);

  // All changelogs
  const [allChangelogs, setAllChangelogs] = useState<Changelog[]>([]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadApp = useCallback(async () => {
    try {
      const data = await client.get<AppDetail>(
        `/admin/marketplace/apps/${slug}`,
      );
      setApp(data);
      setAllReviews(data.reviews || []);
      setAllChangelogs(data.changelogs || []);
    } catch {}
  }, [slug, client]);

  const loadInstallStatus = useCallback(async () => {
    try {
      const list = await client.get<Array<{ appSlug: string }>>(
        "/admin/marketplace/installed",
      );
      setIsInstalled(list.some((a) => a.appSlug === slug));
    } catch {}
  }, [slug, client]);

  const loadFavStatus = useCallback(async () => {
    try {
      const list = await client.get<Array<{ app?: { slug?: string } }>>(
        "/admin/marketplace/favorites",
      );
      setIsFavorite(list.some((f) => f.app?.slug === slug));
    } catch {}
  }, [slug, client]);

  useEffect(() => {
    Promise.all([loadApp(), loadInstallStatus(), loadFavStatus()]).finally(() =>
      setLoading(false),
    );
  }, [loadApp, loadInstallStatus, loadFavStatus]);

  const loadReviews = useCallback(
    async (p: number) => {
      try {
        const data = await client.get<{ reviews: Review[]; total: number }>(
          `/admin/marketplace/apps/${slug}/reviews?page=${p}&limit=10`,
        );
        setAllReviews(data.reviews);
        setReviewTotal(data.total);
        setReviewPage(p);
      } catch {}
    },
    [slug, client],
  );

  const loadChangelogs = useCallback(async () => {
    try {
      setAllChangelogs(
        await client.get<Changelog[]>(
          `/admin/marketplace/apps/${slug}/changelog`,
        ),
      );
    } catch {}
  }, [slug, client]);

  useEffect(() => {
    if (activeTab === "reviews") loadReviews(1);
    if (activeTab === "changelog") loadChangelogs();
  }, [activeTab, loadReviews, loadChangelogs]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await client.post(`/admin/marketplace/install/${slug}`);
      setIsInstalled(true);
      showToast("Installed");
    } catch {
      showToast("Install failed", "error");
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async () => {
    const confirmed = window.confirm(
      `Uninstall ${app?.name ?? "this app"}? Your data is preserved and you can reinstall it later without losing anything.`,
    );
    if (!confirmed) return;
    setInstalling(true);
    try {
      await client.delete(`/admin/marketplace/uninstall/${slug}`);
      setIsInstalled(false);
      showToast("Uninstalled");
    } catch {
      showToast("Uninstall failed", "error");
    } finally {
      setInstalling(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await client.delete(`/admin/marketplace/favorites/${slug}`);
        setIsFavorite(false);
      } else {
        await client.post(`/admin/marketplace/favorites/${slug}`);
        setIsFavorite(true);
      }
    } catch {}
  };

  const submitReview = async () => {
    setSubmittingReview(true);
    try {
      await client.post(`/admin/marketplace/apps/${slug}/reviews`, {
        rating: reviewRating,
        title: reviewTitle || undefined,
        body: reviewBody || undefined,
      });
      showToast("Review submitted");
      setShowReviewForm(false);
      setReviewTitle("");
      setReviewBody("");
      setReviewRating(5);
      loadReviews(1);
      loadApp();
    } catch {
      showToast("Failed to submit", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      await client.post(`/admin/marketplace/reviews/${reviewId}/helpful`);
      setAllReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r,
        ),
      );
    } catch {}
  };

  const renderStars = (rating: number, size = 14) => {
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

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2
          size={28}
          className="animate-spin"
          color="var(--color-primary)"
        />
      </div>
    );
  }

  if (!app) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.navBar}>
          <Link href="/apps/store" className={styles.backBtn}>
            <ArrowLeft size={20} /> App Store
          </Link>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--color-text-secondary)",
          }}
        >
          <h3
            style={{ margin: "0 0 var(--space-2)", color: "var(--color-text)" }}
          >
            App not found
          </h3>
          <Link href="/apps/store" style={{ color: "var(--color-text-link)" }}>
            Back to App Store
          </Link>
        </div>
      </div>
    );
  }

  const screenshots = (app.screenshots || []) as {
    url: string;
    caption: string;
  }[];

  const ratingDistItems = [5, 4, 3, 2, 1].map((star) => {
    const dist = (app.ratingDistribution || []).find((d) => d.rating === star);
    const count = dist?.count || 0;
    const pct = app.reviewCount > 0 ? (count / app.reviewCount) * 100 : 0;
    return (
      <div key={star} className={styles.ratingBarRow}>
        <span className={styles.ratingBarLabel}>{star}</span>
        <Star
          size={9}
          color="var(--color-warning)"
          fill="var(--color-warning)"
        />
        <div className={styles.ratingBar}>
          <div className={styles.ratingBarFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.ratingBarCount}>{count}</span>
      </div>
    );
  });

  return (
    <RouteGuard permission="apps.store.detail.read">
      <div className={styles.detailPage}>
        {toast && (
          <div
            className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}
          >
            {toast.message}
          </div>
        )}

        {/* Nav Bar */}
        <div className={styles.navBar}>
          <Link href="/apps/store" className={styles.backBtn}>
            <ArrowLeft size={20} /> App Store
          </Link>
        </div>

        {/* Hero */}
        <div className={styles.heroSection}>
          <div
            className={styles.heroIcon}
            style={{
              background: "var(--color-primary-light)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            {app.icon || "📦"}
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.heroTitle}>{app.name}</h1>
            <p className={styles.heroSub}>
              {app.publisher} · v{app.version}
            </p>
            <div className="ui-hstack-3 ui-flex-wrap">
              <div className="ui-hstack-1">
                {renderStars(app.rating, 12)}
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                    fontWeight: "var(--weight-medium)",
                  }}
                >
                  {Number(app.rating).toFixed(1)}
                </span>
              </div>
              <span className="ui-text-xs-muted ui-hstack-1">
                <Download size={12} /> {app.installs.toLocaleString()}
              </span>
            </div>
            <div
              className="ui-hstack-2"
              style={{ marginTop: "var(--space-3)" }}
            >
              {app.metadata?.isSystem ? (
                <button
                  className={`${styles.getBtnLarge} ${styles.getBtnLargeCore}`}
                >
                  System App
                </button>
              ) : isInstalled ? (
                <button
                  onClick={handleUninstall}
                  className={`${styles.getBtnLarge} ${styles.getBtnLargeOpen}`}
                >
                  {installing ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                      color="var(--color-primary)"
                    />
                  ) : (
                    "Uninstall"
                  )}
                </button>
              ) : (
                <button onClick={handleInstall} className={styles.getBtnLarge}>
                  {installing ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    "Get"
                  )}
                </button>
              )}
              {!app.metadata?.isSystem && (
                <button
                  onClick={toggleFavorite}
                  style={{
                    background: "none",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                    padding: "var(--space-2)",
                    color: isFavorite
                      ? "var(--color-danger)"
                      : "var(--color-text-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Heart
                    size={18}
                    fill={isFavorite ? "var(--color-danger)" : "none"}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className={styles.metaRow}>
          <span
            className={styles.metaBadge}
            style={{
              background: "var(--color-primary-light)",
              color: "var(--color-primary)",
            }}
          >
            {app.pricing === "FREE"
              ? "Free"
              : app.pricing === "FREEMIUM"
                ? "Freemium"
                : `$${app.price}/mo`}
          </span>
          <span
            className={styles.metaBadge}
            style={{
              background: "var(--color-bg-sunken)",
              color: "var(--color-text-secondary)",
            }}
          >
            {app.category}
          </span>
          {app.verified && (
            <span className={styles.verifyBadge}>
              <Shield size={11} /> Verified
            </span>
          )}
        </div>

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <div className={styles.screenshotRow}>
            <div
              className={styles.sectionLabel}
              style={{
                padding: "0 var(--space-4)",
                marginBottom: "var(--space-3)",
              }}
            >
              Screenshots
            </div>
            <div className={styles.screenshotScroll}>
              {screenshots.map((ss, i) => (
                <div
                  key={i}
                  className={styles.screenshotFrame}
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-sunken)",
                  }}
                >
                  {ss.url ? (
                    <img
                      src={ss.url}
                      alt={ss.caption || ""}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "🖼️"
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className={styles.infoSection}>
          <div className={styles.sectionLabel}>Description</div>
          <p className={styles.description}>
            {app.longDescription || app.description}
          </p>
        </div>

        {/* Features */}
        {(app.features as string[])?.length > 0 && (
          <div
            className={styles.infoSection}
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <div className={styles.sectionLabel}>Features</div>
            <ul className={styles.featuresList}>
              {(app.features as string[]).map((f: string) => (
                <li key={f} className={styles.featureItem}>
                  <span
                    className={styles.featureDot}
                    style={{
                      background: "var(--color-primary)",
                      borderRadius: "50%",
                    }}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info Metadata */}
        <div
          className={styles.infoSection}
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <div className={styles.sectionLabel}>Information</div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Version</span>
            <span className={styles.infoValue}>{app.version}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Category</span>
            <span className={styles.infoValue}>{app.category}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Publisher</span>
            <span className={styles.infoValue}>{app.publisher}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Updated</span>
            <span className={styles.infoValue}>
              {new Date(app.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Installs</span>
            <span className={styles.infoValue}>
              {app.installs.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabRow}>
          {[
            { key: "overview" as const, label: "Overview" },
            { key: "reviews" as const, label: `Reviews (${app.reviewCount})` },
            { key: "changelog" as const, label: "Changelog" },
            { key: "support" as const, label: "Support" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === "overview" && (
            <div>
              {(app.requiresApps as string[])?.length > 0 && (
                <div className="ui-card" style={{ padding: "var(--space-4)" }}>
                  <div className={styles.sectionLabel}>Requirements</div>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text)",
                      margin: 0,
                    }}
                  >
                    Requires: {(app.requiresApps as string[]).join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              {/* Rating Summary */}
              <div className={`ui-card ${styles.ratingCard}`}>
                <div className={styles.ratingBig}>
                  <div className={styles.ratingNum}>
                    {Number(app.rating).toFixed(1)}
                  </div>
                  <div style={{ marginTop: "var(--space-1)" }}>
                    {renderStars(app.rating, 14)}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-secondary)",
                      marginTop: "var(--space-1)",
                    }}
                  >
                    {app.reviewCount} reviews
                  </div>
                </div>
                <div className={styles.ratingBars}>{ratingDistItems}</div>
              </div>

              {/* Write Review Button */}
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="ui-btn ui-btn-secondary"
                style={{
                  width: "100%",
                  marginTop: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <MessageSquare size={14} />
                {showReviewForm ? "Cancel" : "Write a Review"}
              </button>

              {/* Review Form */}
              {showReviewForm && (
                <div className={`ui-card ${styles.reviewForm}`}>
                  <h4 className={styles.reviewFormTitle}>Write Your Review</h4>
                  <div className="ui-form-group">
                    <label className="ui-label">Rating</label>
                    <div className="ui-hstack-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setReviewRating(s)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 2,
                          }}
                        >
                          <Star
                            size={22}
                            color={
                              s <= reviewRating
                                ? "var(--color-warning)"
                                : "var(--color-border)"
                            }
                            fill={
                              s <= reviewRating
                                ? "var(--color-warning)"
                                : "none"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Title (optional)</label>
                    <input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Summary of your review"
                      className="ui-input"
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Review</label>
                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Share your experience..."
                      rows={4}
                      className="ui-textarea"
                    />
                  </div>
                  <button
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="ui-btn ui-btn-primary"
                  >
                    {submittingReview ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                </div>
              )}

              {/* Reviews */}
              {allReviews.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageSquare
                    size={28}
                    style={{ marginBottom: "var(--space-2)" }}
                  />
                  <p style={{ margin: 0 }}>
                    No reviews yet. Be the first to review this app!
                  </p>
                </div>
              ) : (
                <div>
                  {allReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`ui-card ${styles.reviewCard}`}
                    >
                      <div className={styles.reviewHeader}>
                        <div>
                          <span className={styles.reviewName}>
                            {review.userName}
                          </span>
                          {review.verifiedPurchase && (
                            <span className={styles.verifyBadge}>
                              {" "}
                              · Verified
                            </span>
                          )}
                        </div>
                        <span className={styles.reviewDate}>
                          <Clock
                            size={10}
                            style={{ verticalAlign: "middle", marginRight: 2 }}
                          />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {renderStars(review.rating, 11)}
                      {review.title && (
                        <div className={styles.reviewTitle}>{review.title}</div>
                      )}
                      {review.body && (
                        <p className={styles.reviewBody}>{review.body}</p>
                      )}
                      <button
                        onClick={() => markHelpful(review.id)}
                        className={styles.helpfulBtn}
                      >
                        <ThumbsUp size={10} /> Helpful ({review.helpfulCount})
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "changelog" && (
            <div>
              {allChangelogs.length === 0 ? (
                <div className={styles.emptyState}>
                  <History
                    size={28}
                    style={{ marginBottom: "var(--space-2)" }}
                  />
                  <p style={{ margin: 0 }}>No changelog available.</p>
                </div>
              ) : (
                <div
                  className="ui-card"
                  style={{ padding: "4px var(--space-4)" }}
                >
                  {allChangelogs.map((cl) => (
                    <div key={cl.id} className={styles.changelogItem}>
                      <span className={styles.changelogVersion}>
                        v{cl.version}
                      </span>
                      <span className={styles.changelogDate}>
                        {new Date(cl.publishedAt).toLocaleDateString()}
                      </span>
                      <div className={styles.changelogBody}>{cl.changes}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "support" && (
            <div>
              {app.documentationUrl && (
                <a
                  href={app.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ui-card ${styles.supportLink}`}
                >
                  <FileText size={18} color="var(--color-primary)" />
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--weight-semibold)",
                      }}
                    >
                      Documentation
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Read the docs
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--color-border)"
                    style={{ marginLeft: "auto" }}
                  />
                </a>
              )}
              {app.supportUrl && (
                <a
                  href={app.supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ui-card ${styles.supportLink}`}
                >
                  <MessageSquare size={18} color="var(--color-success)" />
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--weight-semibold)",
                      }}
                    >
                      Support
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Get help
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--color-border)"
                    style={{ marginLeft: "auto" }}
                  />
                </a>
              )}
              {app.privacyPolicyUrl && (
                <a
                  href={app.privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ui-card ${styles.supportLink}`}
                >
                  <Shield size={18} color="var(--color-text-tertiary)" />
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--weight-semibold)",
                      }}
                    >
                      Privacy Policy
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Data handling
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    color="var(--color-border)"
                    style={{ marginLeft: "auto" }}
                  />
                </a>
              )}
              {!app.documentationUrl &&
                !app.supportUrl &&
                !app.privacyPolicyUrl && (
                  <div className={styles.emptyState}>
                    <ExternalLink
                      size={28}
                      style={{ marginBottom: "var(--space-2)" }}
                    />
                    <p style={{ margin: 0 }}>No support links available.</p>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Related Apps */}
        {(app.relatedApps || []).length > 0 && (
          <div>
            <div
              className={styles.sectionLabel}
              style={{
                padding: "var(--space-5) var(--space-4) var(--space-3)",
              }}
            >
              Related Apps
            </div>
            <div className={styles.relatedScroll}>
              {(app.relatedApps || []).map((rel: any) => (
                <Link
                  key={rel.slug}
                  href={`/apps/store/${rel.slug}`}
                  className={`ui-card ${styles.relatedCard}`}
                >
                  <div
                    className={styles.relatedIcon}
                    style={{
                      background: "var(--color-primary-light)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    {rel.icon || "📦"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: "var(--weight-semibold)",
                      color: "var(--color-text)",
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {rel.name}
                  </div>
                  <div className="ui-hstack-1">
                    {renderStars(rel.rating, 8)}
                    <span
                      style={{
                        fontSize: "0.625rem",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {Number(rel.rating).toFixed(1)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            padding: "var(--space-5) var(--space-4)",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-tertiary)",
          }}
        >
          UniERP App Store
        </div>
      </div>
    </RouteGuard>
  );
}
