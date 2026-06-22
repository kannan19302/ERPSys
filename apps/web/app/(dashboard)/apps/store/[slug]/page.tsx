'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, Badge } from '@unerp/ui';
import {
  ArrowLeft, Download, Star, Heart, Shield, Clock, ExternalLink,
  FileText, MessageSquare, History, Loader2, ThumbsUp, ChevronLeft,
  ChevronRight, X,
} from 'lucide-react';

const API_BASE = '/api/v1/admin/marketplace';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

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
      const res = await fetch(`${API_BASE}/apps/${slug}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApp(data);
        setAllReviews(data.reviews || []);
        setAllChangelogs(data.changelogs || []);
      }
    } catch {}
  }, [slug]);

  const loadInstallStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/installed`, { headers: authHeaders() });
      if (res.ok) {
        const list = await res.json();
        setIsInstalled(list.some((a: any) => a.appSlug === slug));
      }
    } catch {}
  }, [slug]);

  const loadFavStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/favorites`, { headers: authHeaders() });
      if (res.ok) {
        const list = await res.json();
        setIsFavorite(list.some((f: any) => f.app?.slug === slug));
      }
    } catch {}
  }, [slug]);

  useEffect(() => {
    Promise.all([loadApp(), loadInstallStatus(), loadFavStatus()]).finally(() => setLoading(false));
  }, [loadApp, loadInstallStatus, loadFavStatus]);

  const loadReviews = useCallback(async (p: number) => {
    try {
      const res = await fetch(`${API_BASE}/apps/${slug}/reviews?page=${p}&limit=10`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAllReviews(data.reviews);
        setReviewTotal(data.total);
        setReviewPage(p);
      }
    } catch {}
  }, [slug]);

  const loadChangelogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/apps/${slug}/changelog`, { headers: authHeaders() });
      if (res.ok) setAllChangelogs(await res.json());
    } catch {}
  }, [slug]);

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews(1);
    if (activeTab === 'changelog') loadChangelogs();
  }, [activeTab, loadReviews, loadChangelogs]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const res = await fetch(`${API_BASE}/install/${slug}`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { setIsInstalled(true); showToast('App installed successfully!'); }
      else showToast('Failed to install', 'error');
    } catch { showToast('Failed to install', 'error'); }
    finally { setInstalling(false); }
  };

  const handleUninstall = async () => {
    setInstalling(true);
    try {
      const res = await fetch(`${API_BASE}/uninstall/${slug}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) { setIsInstalled(false); showToast('App uninstalled'); }
    } catch { showToast('Failed to uninstall', 'error'); }
    finally { setInstalling(false); }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await fetch(`${API_BASE}/favorites/${slug}`, { method: 'DELETE', headers: authHeaders() });
        setIsFavorite(false);
      } else {
        await fetch(`${API_BASE}/favorites/${slug}`, { method: 'POST', headers: authHeaders() });
        setIsFavorite(true);
      }
    } catch {}
  };

  const submitReview = async () => {
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/apps/${slug}/reviews`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ rating: reviewRating, title: reviewTitle || undefined, body: reviewBody || undefined }),
      });
      if (res.ok) {
        showToast('Review submitted!');
        setShowReviewForm(false);
        setReviewTitle('');
        setReviewBody('');
        setReviewRating(5);
        loadReviews(1);
        loadApp();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to submit review', 'error');
      }
    } catch { showToast('Failed to submit review', 'error'); }
    finally { setSubmittingReview(false); }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      await fetch(`${API_BASE}/reviews/${reviewId}/helpful`, { method: 'POST', headers: authHeaders() });
      setAllReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
    } catch {}
  };

  const renderStars = (rating: number, size = 14) => {
    const r = Number(rating) || 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={size} style={{ color: s <= Math.floor(r) ? '#f59e0b' : 'var(--color-border)' }} fill={s <= Math.floor(r) ? '#f59e0b' : 'none'} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <h3>App not found</h3>
        <Link href="/apps/store" style={{ color: 'var(--color-primary)' }}>Back to App Store</Link>
      </div>
    );
  }

  const screenshots = (app.screenshots || []) as { url: string; caption: string }[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', color: '#fff', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', boxShadow: 'var(--shadow-lg)' }}>
          {toast.message}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && screenshots.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightboxIndex(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
          {lightboxIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} />
            </button>
          )}
          {lightboxIndex < screenshots.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={20} />
            </button>
          )}
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '80vw', maxHeight: '80vh', textAlign: 'center' }}>
            <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', minWidth: 400, minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: 48, marginBottom: 'var(--space-2)' }}>🖼️</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>{screenshots[lightboxIndex]?.caption}</p>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', margin: 0 }}>{screenshots[lightboxIndex]?.url}</p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        <Link href="/apps/store" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> App Store
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text)' }}>{app.name}</span>
      </div>

      {/* App Header */}
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 600px' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, border: '1px solid var(--color-border)' }}>
              {app.icon || '📦'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{app.name}</h1>
                {app.verified && <Shield size={18} style={{ color: 'var(--color-success)' }} />}
                {app.featured && <Badge variant="warning">Featured</Badge>}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                by <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{app.publisher}</span> · v{app.version}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  {renderStars(app.rating, 16)}
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginLeft: 4 }}>
                    {Number(app.rating).toFixed(1)}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    ({app.reviewCount} reviews)
                  </span>
                </div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Download size={14} /> {app.installs.toLocaleString()} installs
                </span>
                <Badge variant="default">{app.category}</Badge>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 'var(--space-4) 0 0' }}>
            {app.description}
          </p>
        </div>

        {/* Sidebar */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Card padding="lg" style={{ border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: app.pricing === 'FREE' ? 'var(--color-success)' : 'var(--color-text)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>
              {app.pricing === 'FREE' ? 'Free' : app.pricing === 'FREEMIUM' ? 'Freemium' : `$${app.price}/mo`}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              {app.metadata?.isSystem ? (
                <button disabled style={{ flex: 1, padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', cursor: 'not-allowed' }}>
                  System App
                </button>
              ) : isInstalled ? (
                <button onClick={handleUninstall} disabled={installing} style={{ flex: 1, padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', cursor: installing ? 'wait' : 'pointer' }}>
                  {installing ? 'Uninstalling...' : 'Uninstall'}
                </button>
              ) : (
                <button onClick={handleInstall} disabled={installing} style={{ flex: 1, padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', cursor: installing ? 'wait' : 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                  {installing ? 'Installing...' : 'Install App'}
                </button>
              )}
              {!app.metadata?.isSystem && (
                <button onClick={toggleFavorite} style={{ padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: isFavorite ? '#ef4444' : 'var(--color-text-secondary)' }}>
                  <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} />
                </button>
              )}
            </div>

            {app.metadata?.isSystem && (
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <Shield size={14} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  This is a core system application. It is pre-installed and cannot be uninstalled.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Version</span><span style={{ color: 'var(--color-text)', fontWeight: 'var(--weight-medium)' }}>{app.version}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Category</span><span style={{ color: 'var(--color-text)', fontWeight: 'var(--weight-medium)' }}>{app.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Publisher</span><span style={{ color: 'var(--color-text)', fontWeight: 'var(--weight-medium)' }}>{app.publisher}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Updated</span>
                <span style={{ color: 'var(--color-text)', fontWeight: 'var(--weight-medium)' }}>
                  {new Date(app.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Installs</span><span style={{ color: 'var(--color-text)', fontWeight: 'var(--weight-medium)' }}>{app.installs.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {(app.tags as string[])?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(app.tags as string[]).map((tag: string) => (
                <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-secondary)' }}>
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
          <h3 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Screenshots</h3>
          <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            {screenshots.map((ss, i) => (
              <div key={i} onClick={() => setLightboxIndex(i)} style={{ flexShrink: 0, width: 240, cursor: 'pointer', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ height: 140, background: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  🖼️
                </div>
                <div style={{ padding: 'var(--space-2)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {ss.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--color-border)' }}>
        {([
          { key: 'overview' as const, label: 'Overview', icon: <FileText size={14} /> },
          { key: 'reviews' as const, label: `Reviews (${app.reviewCount})`, icon: <MessageSquare size={14} /> },
          { key: 'changelog' as const, label: 'Changelog', icon: <History size={14} /> },
          { key: 'support' as const, label: 'Support', icon: <ExternalLink size={14} /> },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-4)', border: 'none', borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -2, background: 'transparent', color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', transition: 'color 0.15s' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {app.longDescription && (
            <div>
              <h3 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>About</h3>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {app.longDescription}
              </div>
            </div>
          )}

          {(app.features as string[])?.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Features</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-2)' }}>
                {(app.features as string[]).map((f: string) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(app.requiresApps as string[])?.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Requirements</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                This app requires: {(app.requiresApps as string[]).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Rating Summary */}
          <Card padding="lg" style={{ border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-bold)', lineHeight: 1 }}>{Number(app.rating).toFixed(1)}</div>
                <div style={{ margin: 'var(--space-1) 0' }}>{renderStars(app.rating, 18)}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{app.reviewCount} reviews</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const dist = (app.ratingDistribution || []).find(d => d.rating === star);
                  const count = dist?.count || 0;
                  const pct = app.reviewCount > 0 ? (count / app.reviewCount) * 100 : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                      <span style={{ fontSize: '12px', width: 16, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{star}</span>
                      <Star size={10} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--color-bg-sunken)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: '#f59e0b', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', width: 28, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowReviewForm(!showReviewForm)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', alignSelf: 'flex-start' }}>
                Write a Review
              </button>
            </div>
          </Card>

          {/* Review Form */}
          {showReviewForm && (
            <Card padding="lg" style={{ border: '1px solid var(--color-primary)', background: 'var(--color-bg-elevated)' }}>
              <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Write Your Review</h4>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Rating</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setReviewRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Star size={24} style={{ color: s <= reviewRating ? '#f59e0b' : 'var(--color-border)' }} fill={s <= reviewRating ? '#f59e0b' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Title (optional)</label>
                <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Summary of your review"
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Review</label>
                <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} placeholder="Share your experience..."
                  rows={4} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button onClick={submitReview} disabled={submittingReview} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: submittingReview ? 'wait' : 'pointer' }}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button onClick={() => setShowReviewForm(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </Card>
          )}

          {/* Review List */}
          {allReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>No reviews yet. Be the first to review this app!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {allReviews.map(review => (
                <Card key={review.id} padding="md" style={{ border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{review.userName}</span>
                        {review.verifiedPurchase && <Badge variant="success" style={{ fontSize: '9px' }}>Verified</Badge>}
                      </div>
                      {renderStars(review.rating, 12)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {review.title && <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{review.title}</h4>}
                  {review.body && <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{review.body}</p>}
                  <button onClick={() => markHelpful(review.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
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
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
              <History size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>No changelog available yet.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 'var(--space-6)' }}>
              <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, background: 'var(--color-border)' }} />
              {allChangelogs.map((cl, i) => (
                <div key={cl.id} style={{ position: 'relative', marginBottom: 'var(--space-5)' }}>
                  <div style={{ position: 'absolute', left: -19, top: 4, width: 12, height: 12, borderRadius: '50%', background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)', border: '2px solid var(--color-bg)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Badge variant={i === 0 ? 'info' : 'default'}>v{cl.version}</Badge>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {new Date(cl.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {cl.changes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <Card padding="lg" style={{ border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            {app.documentationUrl && (
              <a href={app.documentationUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text)', transition: 'border-color 0.2s' }}>
                <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Documentation</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Read the docs</div>
                </div>
              </a>
            )}
            {app.supportUrl && (
              <a href={app.supportUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text)', transition: 'border-color 0.2s' }}>
                <MessageSquare size={20} style={{ color: 'var(--color-success)' }} />
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Support</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Get help</div>
                </div>
              </a>
            )}
            {app.privacyPolicyUrl && (
              <a href={app.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text)', transition: 'border-color 0.2s' }}>
                <Shield size={20} style={{ color: 'var(--color-text-secondary)' }} />
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Privacy Policy</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Data handling</div>
                </div>
              </a>
            )}
            {!app.documentationUrl && !app.supportUrl && !app.privacyPolicyUrl && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>
                <p style={{ fontSize: 'var(--text-sm)' }}>No support links provided for this app. Contact the publisher ({app.publisher}) for assistance.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Related Apps */}
      {(app.relatedApps || []).length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Related Apps</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
            {(app.relatedApps || []).map((rel: any) => (
              <Link key={rel.slug} href={`/apps/store/${rel.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card padding="md" style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', transition: 'border-color 0.2s' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {rel.icon || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{rel.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
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
  );
}
