'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge, Button, Modal } from '@unerp/ui';
import { ArrowLeft, Code2, Plus, Upload, CheckCircle2, XCircle, Clock, Package, Send, Loader2, Shield } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Bundle { id: string; version: string; status: string; channel: string; reviewNotes?: string | null; changelog?: string | null; }
interface AppPkg { id: string; slug: string; name: string; category: string; status: string; currentVersionId?: string | null; bundles: Bundle[]; }
interface Vendor { id: string; name: string; slug: string; verified: boolean; contactEmail?: string | null; }
interface PendingBundle extends Bundle { package: { name: string; slug: string; vendor: { name: string } } }

const CATEGORIES = ['Healthcare', 'Analytics', 'AI & Automation', 'HR', 'Integrations', 'Operations', 'Manufacturing', 'Finance', 'Sales'];

const SAMPLE_MANIFEST = `{
  "name": "My App",
  "version": "1.0.0",
  "runtime": "declarative",
  "description": "What my app does",
  "icon": "\ud83e\udde9",
  "pricing": "FREE",
  "tags": ["custom"],
  "schemas": [
    { "slug": "ticket", "name": "Ticket",
      "fields": [
        { "name": "title", "type": "text", "required": true },
        { "name": "priority", "type": "select", "options": ["Low","High"] }
      ] }
  ],
  "pages": [
    { "slug": "tickets", "title": "Tickets", "type": "list", "schema": "ticket" },
    { "slug": "new-ticket", "title": "New Ticket", "type": "form", "schema": "ticket" }
  ]
}`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={styles.fieldGroup}><label className="ui-label">{label}</label>{children}</div>;
}

const statusBadgeVariant = (s: string) =>
  s === 'PUBLISHED' ? 'success' : s === 'IN_REVIEW' ? 'warning' : s === 'REJECTED' ? 'danger' : 'default';

export default function DeveloperPortalPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<'apps' | 'review'>('apps');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [apps, setApps] = useState<AppPkg[]>([]);
  const [pending, setPending] = useState<PendingBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  // create app form
  const [showCreate, setShowCreate] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', category: 'Healthcare', description: '' });
  // create bundle form
  const [bundleFor, setBundleFor] = useState<AppPkg | null>(null);
  const [manifestText, setManifestText] = useState(SAMPLE_MANIFEST);
  const [changelog, setChangelog] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    try {
      const [me, myApps, pend] = await Promise.all([
        client.get<Vendor | null>('/developer/me'),
        client.get<AppPkg[]>('/developer/apps'),
        client.get<PendingBundle[]>('/developer/review/pending'),
      ]);
      setVendor(me); setApps(myApps || []); setPending(pend || []);
    } catch {} finally { setLoading(false); }
  }, [client]);

  useEffect(() => { load(); }, [load]);

  const createApp = async () => {
    if (!newApp.name.trim()) return;
    setBusy(true);
    try {
      await client.post('/developer/apps', newApp);
      showToast('App created');
      setShowCreate(false); setNewApp({ name: '', category: 'Healthcare', description: '' });
      await load();
    } catch { showToast('Failed to create app', 'error'); } finally { setBusy(false); }
  };

  const createBundle = async () => {
    if (!bundleFor) return;
    let manifest: any;
    try { manifest = JSON.parse(manifestText); } catch { showToast('Manifest is not valid JSON', 'error'); return; }
    setBusy(true);
    try {
      const data = await client.post<Bundle>(`/developer/apps/${bundleFor.id}/bundles`, { manifest, changelog });
      showToast(`Version ${data.version} created (draft)`);
      setBundleFor(null); setChangelog('');
      await load();
    } catch (e: any) { showToast(typeof e?.message === 'string' ? e.message : 'Failed to create version', 'error'); } finally { setBusy(false); }
  };

  const submitBundle = async (bundleId: string) => {
    setBusy(true);
    try {
      await client.request(`/developer/bundles/${bundleId}/submit`, { method: 'PUT' });
      showToast('Submitted for review');
      await load();
    } catch { showToast('Failed to submit', 'error'); } finally { setBusy(false); }
  };

  const review = async (bundleId: string, action: 'approve' | 'reject') => {
    setBusy(true);
    try {
      const body = action === 'reject' ? JSON.stringify({ reviewNotes: 'Needs changes' }) : undefined;
      await client.request(`/developer/review/${bundleId}/${action}`, { method: 'PUT', body });
      showToast(action === 'approve' ? 'Published to marketplace' : 'Rejected');
      await load();
    } catch { showToast(`Failed to ${action}`, 'error'); } finally { setBusy(false); }
  };

  if (loading) return <div className={styles.loadingContainer}><Loader2 size={32} className="animate-spin ui-text-primary" /></div>;

  return (
    <RouteGuard permission="apps.developer.read">
    <div className="ui-stack-5">
      {toast && (
        <div className={`ui-alert ${styles.toast} ${toast.type === 'success' ? 'ui-alert-success' : 'ui-alert-danger'}`}>
          {toast.msg}
        </div>
      )}

      <div className="ui-hstack-3">
        <Link href="/apps/store" className="ui-text-muted"><ArrowLeft size={18} /></Link>
        <h1 className="ui-heading-lg ui-flex ui-items-center ui-gap-2">
          <Code2 className="ui-text-primary" /> Developer Portal
        </h1>
      </div>
      {vendor && <p className="ui-text-sm-muted">Publishing as <strong>{vendor.name}</strong> {vendor.verified && <Shield size={12} className="ui-text-success" />} · vendor slug <code>{vendor.slug}</code></p>}

      <div className="ui-tabs">
        {(['apps', 'review'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`ui-tab ${tab === t ? 'ui-tab-active' : ''}`}>
            {t === 'apps' ? 'My Apps' : `Review Queue${pending.length ? ` (${pending.length})` : ''}`}
          </button>
        ))}
      </div>

      <div className="ui-tab-content">
      {tab === 'apps' && (
        <div className="ui-stack-4">
          <div className="ui-flex-end">
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New App</Button>
          </div>

          {apps.length === 0 && (
            <div className={styles.emptyState}>
              <Package size={40} className="ui-empty-state-icon" />
              <p>No apps yet. Create one and publish a version.</p>
            </div>
          )}

          {apps.map(app => (
            <div key={app.id} className={styles.appCard}>
              <div className={styles.appHeader}>
                <div>
                  <div className={styles.appName}>
                    {app.name} <Badge variant={statusBadgeVariant(app.status)}>{app.status}</Badge>
                  </div>
                  <div className={styles.appMeta}>{app.category} · /{app.slug}</div>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Upload size={14} />} onClick={() => { setBundleFor(app); setManifestText(SAMPLE_MANIFEST.replace('"My App"', JSON.stringify(app.name))); }}>
                  New Version
                </Button>
              </div>
              <div className={styles.bundleList}>
                {app.bundles.map(b => (
                  <div key={b.id} className={styles.bundleRow}>
                    <span className="ui-font-semibold">v{b.version}</span>
                    <Badge variant={statusBadgeVariant(b.status)}>{b.status}</Badge>
                    {b.reviewNotes && <span className={styles.reviewNotes}>— {b.reviewNotes}</span>}
                    {(b.status === 'DRAFT' || b.status === 'REJECTED') && (
                      <Button variant="primary" size="sm" leftIcon={<Send size={12} />} onClick={() => submitBundle(b.id)} disabled={busy} className="ml-auto">Submit</Button>
                    )}
                  </div>
                ))}
                {app.bundles.length === 0 && <span className={styles.appMeta}>No versions yet.</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'review' && (
        <div className="ui-stack-3">
          {pending.length === 0 && (
            <div className={styles.emptyState}>
              <Clock size={40} className="ui-empty-state-icon" />
              <p>No bundles awaiting review.</p>
            </div>
          )}
          {pending.map(b => (
            <div key={b.id} className={styles.reviewCard}>
              <div>
                <div className={styles.appName}>
                  {b.package.name} <span className="ui-text-tertiary font-normal">v{b.version}</span>
                </div>
                <div className={styles.appMeta}>by {b.package.vendor.name} · /{b.package.slug}</div>
                {b.changelog && <div className={styles.reviewChangelog}>{b.changelog}</div>}
              </div>
              <div className={styles.reviewActions}>
                <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={16} />} onClick={() => review(b.id, 'approve')} disabled={busy}>Approve & Publish</Button>
                <Button variant="danger" size="sm" leftIcon={<XCircle size={16} />} onClick={() => review(b.id, 'reject')} disabled={busy}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Create App modal */}
      {showCreate && (
        <Modal open={true} onClose={() => setShowCreate(false)} title="New App" footer={<>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={createApp} disabled={busy}>{busy ? 'Creating…' : 'Create'}</Button>
        </>}>
          <Field label="Name">
            <input value={newApp.name} onChange={e => setNewApp(s => ({ ...s, name: e.target.value }))} className="ui-input" placeholder="e.g. Telehealth Visits" />
          </Field>
          <Field label="Category">
            <select value={newApp.category} onChange={e => setNewApp(s => ({ ...s, category: e.target.value }))} className="ui-select">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Short description">
            <textarea value={newApp.description} onChange={e => setNewApp(s => ({ ...s, description: e.target.value }))} className="ui-textarea" />
          </Field>
        </Modal>
      )}

      {/* Create Bundle modal */}
      {bundleFor && (
        <Modal open={true} onClose={() => setBundleFor(null)} title={`New Version — ${bundleFor.name}`} size="lg" footer={<>
            <Button variant="secondary" onClick={() => setBundleFor(null)}>Cancel</Button>
            <Button variant="primary" onClick={createBundle} disabled={busy}>{busy ? 'Saving…' : 'Create Draft Version'}</Button>
        </>}>
          <p className="ui-text-sm-muted">Define the app manifest (schemas + pages). The <code>slug</code> and <code>vendor</code> are pinned to your app automatically.</p>
          <textarea value={manifestText} onChange={e => setManifestText(e.target.value)} spellCheck={false} className={styles.manifestEditor} />
          <Field label="Changelog (optional)">
            <input value={changelog} onChange={e => setChangelog(e.target.value)} className="ui-input" placeholder="What changed in this version" />
          </Field>
        </Modal>
      )}
    </div>
    </RouteGuard>
  );
}
