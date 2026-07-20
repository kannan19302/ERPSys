'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, Badge, Button } from '@unerp/ui';
import {
  ArrowLeft, Download, Star, Heart, Shield, Clock, ExternalLink,
  FileText, MessageSquare, History, Loader2, ThumbsUp, ChevronLeft,
  ChevronRight, X,
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'changelog' | 'support'>('overview');
  const [isInstalled, setIsInstalled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // All reviews
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);

  // All changelogs
  const [allChangelogs, setAllChangelogs] = useState<Changelog[]>([]);

  // Screenshot lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadApp = useCallback(async () => {
    try {
      const data = await client.get<AppDetail>(`/admin/marketplace/apps/${slug}`);
      setApp(data);
      setAllReviews(data.reviews || []);
      setAllChangelogs(data.changelogs || []);
    } catch {}
  }, [slug, client]);

  const loadInstallStatus = useCallback(async () => {
    try {
      const list = await client.get<Array<{ appSlug: string }>>('/admin/marketplace/installed');
      setIsInstalled(list.some(a => a.appSlug === slug));
    } catch {}
  }, [slug, client]);

  const loadFavStatus = useCallback(async () => {
    try {
      const list = await client.get<Array<{ app?: { slug?: string } }>>('/admin/marketplace/favorites');
      setIsFavorite(list.some(f => f.app?.slug === slug));
    } catch {}
  }, [slug, client]);

  useEffect(() => {
    Promise.all([loadApp(), loadInstallStatus(), loadFavStatus()]).finally(() => setLoading(false));
  }, [loadApp, loadInstallStatus, loadFavStatus]);

  const loadReviews = useCallback(async (p: number) => {
    try {
      const data = await client.get<{ reviews: Review[]; total: number }>(`/admin/marketplace/apps/${slug}/reviews?page=${p}&limit=10`);
      setAllReviews(data.reviews);
      setReviewTotal(data.total);
      setReviewPage(p);
    } catch {}
  }, [slug, client]);

  const loadChangelogs = useCallback(async () => {
    try {
      setAllChangelogs(await client.get<Changelog[]>(`/admin/marketplace/apps/${slug}/changelog`));
    } catch {}
  }, [slug, client]);

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews(1);
    if (activeTab === 'changelog') loadChangelogs();
  }, [activeTab, loadReviews, loadChangelogs]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await client.post(`/admin/marketplace/install/${slug}`);
      setIsInstalled(true); showToast('App installed successfully!');
    } catch { showToast('Failed to install', 'error'); }
    finally { setInstalling(false); }
  };

  const handleUninstall = async () => {
    setInstalling(true);
    try {
      await client.delete(`/admin/marketplace/uninstall/${slug}`);
      setIsInstalled(false); showToast('App uninstalled');
    } catch { showToast('Failed to uninstall', 'error'); }
    finally { setInstalling(false); }
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
      await client.post(`/admin/marketplace/apps/${slug}/reviews`, { rating: reviewRating, title: reviewTitle || undefined, body: reviewBody || undefined });
      {
        showToast('Review submitted!');
        setShowReviewForm(false);
        setReviewTitle('');
        setReviewBody('');
        setReviewRating(5);
        loadReviews(1);
        loadApp();
      }
    } catch { showToast('Failed to submit review', 'error'); }
    finally { setSubmittingReview(false); }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      await client.post(`/admin/marketplace/reviews/${reviewId}/helpful`);
      setAllReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
    } catch {}
  };

  const renderStars = (rating: number, size = 14) => {
    const r = Number(rating) || 0;
    return (
      <div className="ui-hstack-1">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={size} className={s <= Math.floor(r) ? 'ui-text-warning' : 'ui-text-tertiary'} fill={s <= Math.floor(r) ? 'var(--color-warning)' : 'none'} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ui-flex-center" style={{ height: 400 }}>
        <Loader2 size={32} className="animate-spin ui-text-primary" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center p-12">
        <h3>App not found</h3>
        <Link href="/apps/store" className="ui-text-primary">Back to App Store</Link>
      </div>
    );
  }

  const screenshots = (app.screenshots || []) as { url: string; caption: string }[];

  const ratingDistItems = [5, 4, 3, 2, 1].map(star => {
    const dist = (app.ratingDistribution || []).find(d => d.rating === star);
    const count = dist?.count || 0;
    const pct = app.reviewCount > 0 ? (count / app.reviewCount) * 100 : 0;
    return (
      <div key={star} className="ui-hstack-2 mb-1">
        <span className="ui-text-xs-muted text-right" style={{ width: 16 }}>{star}</span>
        <Star size={10} className="ui-text-warning" fill='var(--color-warning)' />
        <div className="ui-progress">
          <div className="ui-progress-bar ui-progress-bar-warning" style={{ width: `${pct}%` }} />
        </div>
        <span className="ui-text-xs-tertiary text-right" style={{ width: 28 }}>{count}</span>
      </div>
    );
  });

  return (
    <RouteGuard permission="apps.store.detail.read">
    <div className="ui-animate-in ui-stack-6 mx-auto" style={{ maxWidth: 1100, width: '100%' }}>
      {toast && (
        <div className="fixed top-6 right-6 z-1000 px-5 py-3 rounded-md shadow-lg text-sm font-semibold" style={{ background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', color: 'var(--color-bg-elevated)' }}>
          {toast.message}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && screenshots.length > 0 && (
        <div className="ui-modal-overlay" onClick={() => setLightboxIndex(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }} className="absolute top-5 right-5 flex-center w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-bg-elevated)', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
          {lightboxIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }} className="absolute left-5 flex-center w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-bg-elevated)', border: 'none', cursor: 'pointer' }}>
              <ChevronLeft size={20} />
            </button>
          )}
          {lightboxIndex < screenshots.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }} className="absolute right-5 flex-center w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-bg-elevated)', border: 'none', cursor: 'pointer' }}>
              <ChevronRight size={20} />
            </button>
          )}
          <div onClick={e => e.stopPropagation()} className="flex-center" style={{ maxHeight: '80vh', maxWidth: '80vw', textAlign: 'center' }}>
            <div className="ui-stack-3 flex-center p-6 rounded-xl" style={{ background: 'var(--color-bg-elevated)', minHeight: 250, minWidth: 400 }}>
              {screenshots[lightboxIndex]?.url ? (
                <img src={screenshots[lightboxIndex].url} alt={screenshots[lightboxIndex]?.caption || ''} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
              ) : (
                <div style={{ fontSize: 48, marginBottom: 'var(--space-2)' }}>🖼️</div>
              )}
              <p className="ui-text-sm-muted m-0">{screenshots[lightboxIndex]?.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="ui-breadcrumb">
        <Link href="/apps/store" className="ui-breadcrumb-link ui-hstack-2">
          <ArrowLeft size={14} /> App Store
        </Link>
        <span className="ui-breadcrumb-separator">/</span>
        <span className="ui-breadcrumb-active">{app.name}</span>
      </div>

      {/* App Header + Sidebar */}
      <div className="ui-detail-layout">
        <div>
          <div className="ui-hstack-4">
            <div className="ui-flex-center flex-shrink-0 w-[72px] h-[72px] text-[36px] rounded-xl border" style={{ background: 'var(--color-bg-sunken)' }}>
              {app.icon || '📦'}
            </div>
            <div className="flex-1">
              <div className="ui-hstack-2 mb-1">
                <h1 className="m-0">{app.name}</h1>
                {app.verified && <Shield size={18} className="ui-text-success" />}
                {app.featured && <Badge variant="warning">Featured</Badge>}
              </div>
              <div className="ui-text-sm-muted mb-2">
                by <span className="ui-text-primary">{app.publisher}</span> · v{app.version}
              </div>
              <div className="ui-hstack-3 ui-flex-wrap">
                <div className="ui-flex ui-items-center ui-gap-1">
                  {renderStars(app.rating, 16)}
                  <span className="text-sm font-semibold ml-1">
                    {Number(app.rating).toFixed(1)}
                  </span>
                  <span className="ui-text-sm-muted">
                    ({app.reviewCount} reviews)
                  </span>
                </div>
                <span className="ui-hstack-1 ui-text-sm-muted">
                  <Download size={14} /> {app.installs.toLocaleString()} installs
                </span>
                <Badge variant="default">{app.category}</Badge>
              </div>
            </div>
          </div>

          <p className="ui-text-sm-muted mt-4" style={{ lineHeight: 1.6 }}>
            {app.description}
          </p>
        </div>

        {/* Sidebar */}
        <div className="ui-stack-3">
          <Card padding="lg">
            <div className="text-xl font-bold text-center mb-3" style={{ color: app.pricing === 'FREE' ? 'var(--color-success)' : 'var(--color-text)' }}>
              {app.pricing === 'FREE' ? 'Free' : app.pricing === 'FREEMIUM' ? 'Freemium' : `$${app.price}/mo`}
            </div>

            <div className="ui-hstack-2 mb-3">
              {app.metadata?.isSystem ? (
                <Button variant="outline" disabled className="flex-1">
                  System App
                </Button>
              ) : isInstalled ? (
                <Button variant="danger" onClick={handleUninstall} isLoading={installing} className="flex-1">
                  {installing ? 'Uninstalling...' : 'Uninstall'}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleInstall} isLoading={installing} className="flex-1">
                  {installing ? 'Installing...' : 'Install App'}
                </Button>
              )}
              {!app.metadata?.isSystem && (
                <Button variant="ghost" onClick={toggleFavorite} className="px-[10px] py-[10px]">
                  <Heart size={18} fill={isFavorite ? 'var(--color-primary)' : 'none'} className={isFavorite ? 'ui-text-primary' : 'ui-text-muted'} />
                </Button>
              )}
            </div>

            {app.metadata?.isSystem && (
              <div className="ui-alert ui-alert-info mb-3">
                <Shield size={14} className="ui-text-primary flex-shrink-0" style={{ marginTop: 1 }} />
                <div>
                  This is a core system application. It is pre-installed and cannot be uninstalled.
                </div>
              </div>
            )}

            <div className="ui-stack-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="ui-flex-between">
                <span>Version</span><span className="ui-text-primary">{app.version}</span>
              </div>
              <div className="ui-flex-between">
                <span>Category</span><span className="ui-text-primary">{app.category}</span>
              </div>
              <div className="ui-flex-between">
                <span>Publisher</span><span className="ui-text-primary">{app.publisher}</span>
              </div>
              <div className="ui-flex-between">
                <span>Last Updated</span>
                <span className="ui-text-primary">
                  {new Date(app.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="ui-flex-between">
                <span>Installs</span><span className="ui-text-primary">{app.installs.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {(app.tags as string[])?.length > 0 && (
            <div className="ui-chip-group">
              {(app.tags as string[]).map((tag: string) => (
                <span key={tag} className="ui-chip">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div>
          <h3 className="ui-heading-base mb-3">Screenshots</h3>
          <div className="ui-hstack-3 overflow-x-auto pb-2">
            {screenshots.map((ss, i) => (
              <div key={i} onClick={() => setLightboxIndex(i)} className={`${styles.screenshotCard}`}>
                <div className="ui-flex-center" style={{ background: 'var(--color-bg-sunken)', height: 140, fontSize: 32 }}>
                  {ss.url ? (
                    <img src={ss.url} alt={ss.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  ) : '🖼️'}
                </div>
                <div className="p-2" style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
                  {ss.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ui-tabs">
        {([
          { key: 'overview' as const, label: 'Overview', icon: <FileText size={14} /> },
          { key: 'reviews' as const, label: `Reviews (${app.reviewCount})`, icon: <MessageSquare size={14} /> },
          { key: 'changelog' as const, label: 'Changelog', icon: <History size={14} /> },
          { key: 'support' as const, label: 'Support', icon: <ExternalLink size={14} /> },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`ui-tab ${activeTab === tab.key ? 'ui-tab-active' : ''}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="ui-stack-5">
          {app.longDescription && (
            <div>
              <h3 className="ui-heading-base mb-3">About</h3>
              <div className="ui-text-sm-muted" style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {app.longDescription}
              </div>
            </div>
          )}

          {(app.features as string[])?.length > 0 && (
            <div>
              <h3 className="ui-heading-base mb-3">Features</h3>
              <div className="ui-grid-auto">
                {(app.features as string[]).map((f: string) => (
                  <div key={f} className="ui-hstack-2 ui-card-flat p-2 px-3 text-sm">
                    <div className="flex-shrink-0 w-[6px] h-[6px] rounded-full" style={{ background: 'var(--color-primary)' }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(app.requiresApps as string[])?.length > 0 && (
            <div>
              <h3 className="ui-heading-sm mb-2">Requirements</h3>
              <p className="ui-text-sm-muted">
                This app requires: {(app.requiresApps as string[]).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="ui-stack-5">
          {/* Rating Summary */}
          <Card padding="lg">
            <div className="ui-hstack-6 ui-flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ lineHeight: 1 }}>{Number(app.rating).toFixed(1)}</div>
                <div className="mt-1 mb-1">{renderStars(app.rating, 18)}</div>
                <div className="ui-text-xs-muted">{app.reviewCount} reviews</div>
              </div>
              <div className="ui-flex-1" style={{ minWidth: 200 }}>
                {ratingDistItems}
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                  Write a Review
                </Button>
              </div>
            </Card>

            {/* Review Form */}
            {showReviewForm && (
              <Card padding="lg" style={{ borderColor: 'var(--color-primary)' }}>
                <h4 className="ui-heading-sm mb-3">Write Your Review</h4>
                <div className="ui-form-group">
                  <label className="ui-label">Rating</label>
                  <div className="ui-hstack-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setReviewRating(s)} className="bg-none border-none cursor-pointer p-[2px]">
                        <Star size={24} className={s <= reviewRating ? 'ui-text-warning' : 'ui-text-tertiary'} fill={s <= reviewRating ? 'var(--color-warning)' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Title (optional)</label>
                  <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Summary of your review"
                    className="ui-input" />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Review</label>
                  <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} placeholder="Share your experience..."
                    rows={4} className="ui-textarea" />
                </div>
                <div className="ui-flex ui-gap-2">
                  <Button variant="primary" onClick={submitReview} isLoading={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Review List */}
            {allReviews.length === 0 ? (
              <div className="ui-empty-state">
                <MessageSquare size={32} className="ui-empty-state-icon" />
                <p className="ui-empty-state-text">No reviews yet. Be the first to review this app!</p>
              </div>
            ) : (
              <div className="ui-stack-3">
                {allReviews.map(review => (
                  <Card key={review.id} padding="md">
                    <div className="ui-flex-between mb-2">
                      <div>
                        <div className="ui-hstack-2">
                          <span className="ui-heading-sm">{review.userName}</span>
                          {review.verifiedPurchase && <span style={{ fontSize: 9 }}><Badge variant="success">Verified</Badge></span>}
                        </div>
                        {renderStars(review.rating, 12)}
                      </div>
                      <div className="ui-hstack-2">
                        <span className="ui-text-xs-tertiary ui-hstack-1">
                          <Clock size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {review.title && <h4 className="ui-heading-sm mb-1">{review.title}</h4>}
                    {review.body && <p className="ui-text-sm-muted mb-2" style={{ lineHeight: 1.5 }}>{review.body}</p>}
                    <button onClick={() => markHelpful(review.id)} className="ui-hstack-1 rounded-full border px-[10px] py-[2px] text-11px" style={{ background: 'none', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', cursor: 'pointer' }}>
                      <ThumbsUp size={10} /> Helpful ({review.helpfulCount})
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'changelog' && (
          <div>
            {allChangelogs.length === 0 ? (
              <div className="ui-empty-state">
                <History size={32} className="ui-empty-state-icon" />
                <p className="ui-empty-state-text">No changelog available yet.</p>
              </div>
            ) : (
              <div className="pl-6 relative">
                <div className="absolute left-[9px] top-0 bottom-0 w-[2px]" style={{ background: 'var(--color-border)' }} />
                {allChangelogs.map((cl, i) => (
                  <div key={cl.id} className="mb-5 relative">
                    <div className="absolute w-3 h-3 rounded-full border-2" style={{ left: -19, top: 4, background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)', borderColor: 'var(--color-bg)' }} />
                    <div className="ui-hstack-2 mb-2">
                      <Badge variant={i === 0 ? 'info' : 'default'}>v{cl.version}</Badge>
                      <span className="ui-text-xs-tertiary">
                        {new Date(cl.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="ui-text-sm-muted" style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {cl.changes}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <Card padding="lg">
            <div className="ui-grid-auto">
              {app.documentationUrl && (
                <a href={app.documentationUrl} target="_blank" rel="noopener noreferrer" className="ui-card-clickable ui-hstack-3 p-4 rounded-lg border text-decoration-none" style={{ color: 'var(--color-text)' }}>
                  <FileText size={20} className="ui-text-primary" />
                  <div>
                    <div className="ui-heading-sm">Documentation</div>
                    <div className="ui-text-xs-muted">Read the docs</div>
                  </div>
                </a>
              )}
              {app.supportUrl && (
                <a href={app.supportUrl} target="_blank" rel="noopener noreferrer" className="ui-card-clickable ui-hstack-3 p-4 rounded-lg border text-decoration-none" style={{ color: 'var(--color-text)' }}>
                  <MessageSquare size={20} className="ui-text-success" />
                  <div>
                    <div className="ui-heading-sm">Support</div>
                    <div className="ui-text-xs-muted">Get help</div>
                  </div>
                </a>
              )}
              {app.privacyPolicyUrl && (
                <a href={app.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="ui-card-clickable ui-hstack-3 p-4 rounded-lg border text-decoration-none" style={{ color: 'var(--color-text)' }}>
                  <Shield size={20} className="ui-text-muted" />
                  <div>
                    <div className="ui-heading-sm">Privacy Policy</div>
                    <div className="ui-text-xs-muted">Data handling</div>
                  </div>
                </a>
              )}
              {!app.documentationUrl && !app.supportUrl && !app.privacyPolicyUrl && (
                <div className="ui-empty-state" style={{ gridColumn: '1 / -1' }}>
                  <p className="ui-empty-state-text">No support links provided for this app. Contact the publisher ({app.publisher}) for assistance.</p>
                </div>
              )}
            </div>
          </Card>
        )}

      {/* Related Apps */}
      {(app.relatedApps || []).length > 0 && (
        <div>
          <h3 className="ui-heading-base mb-3">Related Apps</h3>
          <div className="ui-grid-auto">
            {(app.relatedApps || []).map((rel: any) => (
              <Link key={rel.slug} href={`/apps/store/${rel.slug}`} className="text-decoration-none" style={{ color: 'inherit' }}>
                <Card padding="md" className={`${styles.relatedCard} ui-card-clickable ui-hstack-3`}>
                  <div className="ui-flex-center flex-shrink-0 w-10 h-10 rounded-md text-[20px]" style={{ background: 'var(--color-bg-sunken)' }}>
                    {rel.icon || '📦'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="ui-heading-sm">{rel.name}</div>
                    <div className="ui-hstack-1 ui-text-xs-muted">
                      {renderStars(rel.rating, 10)}
                      <span>{Number(rel.rating).toFixed(1)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
