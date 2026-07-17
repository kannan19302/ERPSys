'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  "icon": "🧩",
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
    } catch { /* noop */ } finally { setLoading(false); }
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

  const statusColor = (s: string) => s === 'PUBLISHED' ? 'var(--color-success)' : s === 'IN_REVIEW' ? '#f59e0b' : s === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-text-tertiary)';

  if (loading) return <div className={styles.s1}><Loader2 size={32} className={styles.s39} /></div>;

  return (
    <RouteGuard permission="apps.developer.read">
    <div className={styles.s2}>
      {toast && <div style={{ background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s3}>{toast.msg}</div>}

      <div className={styles.s4}>
        <Link href="/apps/store" className="ui-text-muted"><ArrowLeft size={18} /></Link>
        <h1 className={styles.s5}>
          <Code2 className="ui-text-primary" /> Developer Portal
        </h1>
      </div>
      {vendor && <p className={styles.s6}>Publishing as <strong>{vendor.name}</strong> {vendor.verified && <Shield size={12} className={styles.s40} />} · vendor slug <code>{vendor.slug}</code></p>}

      <div className={styles.s7}>
        {(['apps', 'review'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent', color: tab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s8}>
            {t === 'apps' ? 'My Apps' : `Review Queue${pending.length ? ` (${pending.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'apps' && (
        <div className={styles.s9}>
          <div className="ui-flex-end">
            <button onClick={() => setShowCreate(true)} className={styles.s10}><Plus size={16} /> New App</button>
          </div>

          {apps.length === 0 && <div className={styles.s11}><Package size={40} className={styles.s41} /><p>No apps yet. Create one and publish a version.</p></div>}

          {apps.map(app => (
            <div key={app.id} className={styles.s12}>
              <div className={styles.s13}>
                <div>
                  <div className={styles.s14}>{app.name} <span style={{ color: statusColor(app.status) }} className={styles.s15}>{app.status}</span></div>
                  <div className={styles.s16}>{app.category} · /{app.slug}</div>
                </div>
                <button onClick={() => { setBundleFor(app); setManifestText(SAMPLE_MANIFEST.replace('"My App"', JSON.stringify(app.name))); }} className={styles.s17}><Upload size={14} /> New Version</button>
              </div>
              <div className={styles.s18}>
                {app.bundles.map(b => (
                  <div key={b.id} className={styles.s19}>
                    <span className="font-semibold">v{b.version}</span>
                    <span style={{ color: statusColor(b.status) }} className={styles.s20}>{b.status}</span>
                    {b.reviewNotes && <span className={styles.s21}>— {b.reviewNotes}</span>}
                    <span className="flex-1" />
                    {(b.status === 'DRAFT' || b.status === 'REJECTED') && <button onClick={() => submitBundle(b.id)} disabled={busy} className={styles.s22}><Send size={12} /> Submit</button>}
                  </div>
                ))}
                {app.bundles.length === 0 && <span className={styles.s16}>No versions yet.</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'review' && (
        <div className={styles.s23}>
          {pending.length === 0 && <div className={styles.s11}><Clock size={40} className={styles.s41} /><p>No bundles awaiting review.</p></div>}
          {pending.map(b => (
            <div key={b.id} className={styles.s24}>
              <div>
                <div className={styles.s14}>{b.package.name} <span className={styles.s25}>v{b.version}</span></div>
                <div className={styles.s16}>by {b.package.vendor.name} · /{b.package.slug}</div>
                {b.changelog && <div className={styles.s26}>{b.changelog}</div>}
              </div>
              <div className={styles.s27}>
                <button onClick={() => review(b.id, 'approve')} disabled={busy} className={styles.s28}><CheckCircle2 size={16} /> Approve & Publish</button>
                <button onClick={() => review(b.id, 'reject')} disabled={busy} className={styles.s29}><XCircle size={16} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create App modal */}
      {showCreate && (
        <Modal title="New App" onClose={() => setShowCreate(false)}>
          <Field label="Name"><input value={newApp.name} onChange={e => setNewApp(s => ({ ...s, name: e.target.value }))} style={inputStyle} placeholder="e.g. Telehealth Visits" /></Field>
          <Field label="Category">
            <select value={newApp.category} onChange={e => setNewApp(s => ({ ...s, category: e.target.value }))} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Short description"><textarea value={newApp.description} onChange={e => setNewApp(s => ({ ...s, description: e.target.value }))} style={{ ...inputStyle }} className={styles.s30} /></Field>
          <div className={styles.s31}>
            <button onClick={() => setShowCreate(false)} style={btnGhost}>Cancel</button>
            <button onClick={createApp} disabled={busy} style={btnPrimary}>{busy ? 'Creating…' : 'Create'}</button>
          </div>
        </Modal>
      )}

      {/* Create Bundle modal */}
      {bundleFor && (
        <Modal title={`New Version — ${bundleFor.name}`} onClose={() => setBundleFor(null)} wide>
          <p className={styles.s32}>Define the app manifest (schemas + pages). The <code>slug</code> and <code>vendor</code> are pinned to your app automatically.</p>
          <textarea value={manifestText} onChange={e => setManifestText(e.target.value)} spellCheck={false} style={{ ...inputStyle }} className={styles.s33} />
          <Field label="Changelog (optional)"><input value={changelog} onChange={e => setChangelog(e.target.value)} style={inputStyle} placeholder="What changed in this version" /></Field>
          <div className={styles.s31}>
            <button onClick={() => setBundleFor(null)} style={btnGhost}>Cancel</button>
            <button onClick={createBundle} disabled={busy} style={btnPrimary}>{busy ? 'Saving…' : 'Create Draft Version'}</button>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
    </RouteGuard>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 14, outline: 'none' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={styles.s34}><label className={styles.s35}>{label}</label>{children}</div>;
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div onClick={onClose} className={styles.s36}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: wide ? 680 : 440 }} className={styles.s37}>
        <h3 className={styles.s38}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
