'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, Badge } from '@unerp/ui';
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
      <div className={styles.s1}>
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={size} style={{ color: s <= Math.floor(r) ? 'var(--color-primary)' : 'var(--color-border)' }} fill={s <= Math.floor(r) ? 'var(--color-primary)' : 'none'} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.s2}>
        <Loader2 size={32} className={styles.s3} />
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

  return (
    <RouteGuard permission="apps.store.detail.read">
    <div className={styles.s4}>
      {toast && (
        <div style={{ background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s5}>
          {toast.message}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && screenshots.length > 0 && (
        <div className={styles.s6} onClick={() => setLightboxIndex(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }} className={styles.s7}>
            <X size={20} />
          </button>
          {lightboxIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }} className={styles.s8}>
              <ChevronLeft size={20} />
            </button>
          )}
          {lightboxIndex < screenshots.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }} className={styles.s9}>
              <ChevronRight size={20} />
            </button>
          )}
          <div onClick={e => e.stopPropagation()} className={styles.s10}>
            <div className={styles.s11}>
              <div className={styles.s12}>🖼️</div>
              <p className={styles.s13}>{screenshots[lightboxIndex]?.caption}</p>
              <p className={styles.s14}>{screenshots[lightboxIndex]?.url}</p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className={styles.s15}>
        <Link href="/apps/store" className={styles.s16}>
          <ArrowLeft size={14} /> App Store
        </Link>
        <span>/</span>
        <span className={styles.s17}>{app.name}</span>
      </div>

      {/* App Header */}
      <div className={styles.s18}>
        <div className={styles.s19}>
          <div className={styles.s20}>
            <div className={styles.s21}>
              {app.icon || '📦'}
            </div>
            <div className="flex-1">
              <div className={styles.s22}>
                <h1 className={styles.s23}>{app.name}</h1>
                {app.verified && <Shield size={18} className="ui-text-success" />}
                {app.featured && <Badge variant="warning">Featured</Badge>}
              </div>
              <div className={styles.s24}>
                by <span className={styles.s25}>{app.publisher}</span> · v{app.version}
              </div>
              <div className={styles.s26}>
                <div className="ui-flex ui-items-center ui-gap-1">
                  {renderStars(app.rating, 16)}
                  <span className={styles.s27}>
                    {Number(app.rating).toFixed(1)}
                  </span>
                  <span className="ui-text-sm-muted">
                    ({app.reviewCount} reviews)
                  </span>
                </div>
                <span className={styles.s28}>
                  <Download size={14} /> {app.installs.toLocaleString()} installs
                </span>
                <Badge variant="default">{app.category}</Badge>
              </div>
            </div>
          </div>

          <p className={styles.s29}>
            {app.description}
          </p>
        </div>

        {/* Sidebar */}
        <div className={styles.s30}>
          <Card padding="lg" className={styles.s31}>
            <div style={{ color: app.pricing === 'FREE' ? 'var(--color-success)' : 'var(--color-text)' }} className={styles.s32}>
              {app.pricing === 'FREE' ? 'Free' : app.pricing === 'FREEMIUM' ? 'Freemium' : `$${app.price}/mo`}
            </div>

            <div className={styles.s33}>
              {app.metadata?.isSystem ? (
                <button disabled className={styles.s34}>
                  System App
                </button>
              ) : isInstalled ? (
                <button onClick={handleUninstall} disabled={installing} style={{ cursor: installing ? 'wait' : 'pointer' }} className={styles.s35}>
                  {installing ? 'Uninstalling...' : 'Uninstall'}
                </button>
              ) : (
                <button onClick={handleInstall} disabled={installing} style={{ cursor: installing ? 'wait' : 'pointer' }} className={styles.s36}>
                  {installing ? 'Installing...' : 'Install App'}
                </button>
              )}
              {!app.metadata?.isSystem && (
                <button onClick={toggleFavorite} style={{ color: isFavorite ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s37}>
                  <Heart size={18} fill={isFavorite ? 'var(--color-primary)' : 'none'} />
                </button>
              )}
            </div>

            {app.metadata?.isSystem && (
              <div className={styles.s38}>
                <Shield size={14} className={styles.s39} />
                <div>
                  This is a core system application. It is pre-installed and cannot be uninstalled.
                </div>
              </div>
            )}

            <div className={styles.s40}>
              <div className="ui-flex-between">
                <span>Version</span><span className={styles.s25}>{app.version}</span>
              </div>
              <div className="ui-flex-between">
                <span>Category</span><span className={styles.s25}>{app.category}</span>
              </div>
              <div className="ui-flex-between">
                <span>Publisher</span><span className={styles.s25}>{app.publisher}</span>
              </div>
              <div className="ui-flex-between">
                <span>Last Updated</span>
                <span className={styles.s25}>
                  {new Date(app.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="ui-flex-between">
                <span>Installs</span><span className={styles.s25}>{app.installs.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {(app.tags as string[])?.length > 0 && (
            <div className={styles.s41}>
              {(app.tags as string[]).map((tag: string) => (
                <span key={tag} className={styles.s42}>
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
          <h3 className={styles.s43}>Screenshots</h3>
          <div className={styles.s44}>
            {screenshots.map((ss, i) => (
              <div key={i} onClick={() => setLightboxIndex(i)} className={`${styles.s45} ${styles.screenshotCard}`}>
                <div className={styles.s46}>
                  🖼️
                </div>
                <div className={styles.s47}>
                  {ss.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.s48}>
        {([
          { key: 'overview' as const, label: 'Overview', icon: <FileText size={14} /> },
          { key: 'reviews' as const, label: `Reviews (${app.reviewCount})`, icon: <MessageSquare size={14} /> },
          { key: 'changelog' as const, label: 'Changelog', icon: <History size={14} /> },
          { key: 'support' as const, label: 'Support', icon: <ExternalLink size={14} /> },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s49}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className={styles.s50}>
          {app.longDescription && (
            <div>
              <h3 className={styles.s43}>About</h3>
              <div className={styles.s51}>
                {app.longDescription}
              </div>
            </div>
          )}

          {(app.features as string[])?.length > 0 && (
            <div>
              <h3 className={styles.s43}>Features</h3>
              <div className={styles.s52}>
                {(app.features as string[]).map((f: string) => (
                  <div key={f} className={styles.s53}>
                    <div className={styles.s54} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(app.requiresApps as string[])?.length > 0 && (
            <div>
              <h3 className={styles.s55}>Requirements</h3>
              <p className="ui-text-sm-muted">
                This app requires: {(app.requiresApps as string[]).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className={styles.s50}>
          {/* Rating Summary */}
          <Card padding="lg" className={styles.s31}>
            <div className={styles.s56}>
              <div className={styles.s57}>
                <div className={styles.s58}>{Number(app.rating).toFixed(1)}</div>
                <div className={styles.s59}>{renderStars(app.rating, 18)}</div>
                <div className="ui-text-xs-muted">{app.reviewCount} reviews</div>
              </div>
              <div className={styles.s60}>
                {[5, 4, 3, 2, 1].map(star => {
                  const dist = (app.ratingDistribution || []).find(d => d.rating === star);
                  const count = dist?.count || 0;
                  const pct = app.reviewCount > 0 ? (count / app.reviewCount) * 100 : 0;
                  return (
                    <div key={star} className={styles.s22}>
                      <span className={styles.s61}>{star}</span>
                      <Star size={10} className={styles.s62} fill='var(--color-primary)' />
                      <div className={styles.s63}>
                        <div style={{ width: `${pct}%` }} className={styles.s64} />
                      </div>
                      <span className={styles.s65}>{count}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowReviewForm(!showReviewForm)} className={styles.s66}>
                Write a Review
              </button>
            </div>
          </Card>

          {/* Review Form */}
          {showReviewForm && (
            <Card padding="lg" className={styles.s67}>
              <h4 className={styles.s68}>Write Your Review</h4>
              <div className={styles.s69}>
                <label className={styles.s70}>Rating</label>
                <div className={styles.s71}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setReviewRating(s)} className={styles.s72}>
                      <Star size={24} style={{ color: s <= reviewRating ? 'var(--color-primary)' : 'var(--color-border)' }} fill={s <= reviewRating ? 'var(--color-primary)' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.s69}>
                <label className={styles.s70}>Title (optional)</label>
                <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Summary of your review"
                  className={styles.s73} />
              </div>
              <div className={styles.s69}>
                <label className={styles.s70}>Review</label>
                <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} placeholder="Share your experience..."
                  rows={4} className={styles.s74} />
              </div>
              <div className="ui-flex ui-gap-2">
                <button onClick={submitReview} disabled={submittingReview} style={{ cursor: submittingReview ? 'wait' : 'pointer' }} className={styles.s75}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button onClick={() => setShowReviewForm(false)} className={styles.s76}>
                  Cancel
                </button>
              </div>
            </Card>
          )}

          {/* Review List */}
          {allReviews.length === 0 ? (
            <div className={styles.s77}>
              <MessageSquare size={32} className={styles.s78} />
              <p className="text-sm">No reviews yet. Be the first to review this app!</p>
            </div>
          ) : (
            <div className="ui-stack-3">
              {allReviews.map(review => (
                <Card key={review.id} padding="md" className={styles.s31}>
                  <div className={styles.s79}>
                    <div>
                      <div className="ui-hstack-2">
                        <span className="ui-heading-sm">{review.userName}</span>
                        {review.verifiedPurchase && <span className={styles.s80}><Badge variant="success">Verified</Badge></span>}
                      </div>
                      {renderStars(review.rating, 12)}
                    </div>
                    <div className="ui-hstack-2">
                      <span className={styles.s81}>
                        <Clock size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {review.title && <h4 className={styles.s82}>{review.title}</h4>}
                  {review.body && <p className={styles.s83}>{review.body}</p>}
                  <button onClick={() => markHelpful(review.id)} className={styles.s84}>
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
            <div className={styles.s77}>
              <History size={32} className={styles.s78} />
              <p className="text-sm">No changelog available yet.</p>
            </div>
          ) : (
            <div className={styles.s85}>
              <div className={styles.s86} />
              {allChangelogs.map((cl, i) => (
                <div key={cl.id} className={styles.s87}>
                  <div style={{ background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)' }} className={styles.s88} />
                  <div className={styles.s89}>
                    <Badge variant={i === 0 ? 'info' : 'default'}>v{cl.version}</Badge>
                    <span className={styles.s90}>
                      {new Date(cl.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.s51}>
                    {cl.changes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <Card padding="lg" className={styles.s31}>
          <div className={styles.s91}>
            {app.documentationUrl && (
              <a href={app.documentationUrl} target="_blank" rel="noopener noreferrer" className={styles.s92}>
                <FileText size={20} className="ui-text-primary" />
                <div>
                  <div className="ui-heading-sm">Documentation</div>
                  <div className={styles.s93}>Read the docs</div>
                </div>
              </a>
            )}
            {app.supportUrl && (
              <a href={app.supportUrl} target="_blank" rel="noopener noreferrer" className={styles.s92}>
                <MessageSquare size={20} className="ui-text-success" />
                <div>
                  <div className="ui-heading-sm">Support</div>
                  <div className={styles.s93}>Get help</div>
                </div>
              </a>
            )}
            {app.privacyPolicyUrl && (
              <a href={app.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className={styles.s92}>
                <Shield size={20} className="ui-text-muted" />
                <div>
                  <div className="ui-heading-sm">Privacy Policy</div>
                  <div className={styles.s93}>Data handling</div>
                </div>
              </a>
            )}
            {!app.documentationUrl && !app.supportUrl && !app.privacyPolicyUrl && (
              <div className={styles.s94}>
                <p className="text-sm">No support links provided for this app. Contact the publisher ({app.publisher}) for assistance.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Related Apps */}
      {(app.relatedApps || []).length > 0 && (
        <div>
          <h3 className={styles.s43}>Related Apps</h3>
          <div className={styles.s95}>
            {(app.relatedApps || []).map((rel: any) => (
              <Link key={rel.slug} href={`/apps/store/${rel.slug}`} className={styles.s96}>
                <Card padding="md" className={`${styles.s97} ${styles.relatedCard}`}>
                  <div className={styles.s98}>
                    {rel.icon || '📦'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="ui-heading-sm">{rel.name}</div>
                    <div className={styles.s99}>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
    </RouteGuard>
  );
}
