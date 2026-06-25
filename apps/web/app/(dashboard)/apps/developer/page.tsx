'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code2, Plus, Upload, CheckCircle2, XCircle, Clock, Package, Send, Loader2, Shield } from 'lucide-react';

const API = '/api/v1/developer';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

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
        fetch(`${API}/me`, { headers: authHeaders() }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/apps`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/review/pending`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
      ]);
      setVendor(me); setApps(myApps || []); setPending(pend || []);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createApp = async () => {
    if (!newApp.name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/apps`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(newApp) });
      if (!res.ok) throw new Error();
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
      const res = await fetch(`${API}/apps/${bundleFor.id}/bundles`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ manifest, changelog }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'failed');
      showToast(`Version ${data.version} created (draft)`);
      setBundleFor(null); setChangelog('');
      await load();
    } catch (e: any) { showToast(typeof e?.message === 'string' ? e.message : 'Failed to create version', 'error'); } finally { setBusy(false); }
  };

  const submitBundle = async (bundleId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/bundles/${bundleId}/submit`, { method: 'PUT', headers: authHeaders() });
      if (!res.ok) throw new Error();
      showToast('Submitted for review');
      await load();
    } catch { showToast('Failed to submit', 'error'); } finally { setBusy(false); }
  };

  const review = async (bundleId: string, action: 'approve' | 'reject') => {
    setBusy(true);
    try {
      const body = action === 'reject' ? JSON.stringify({ reviewNotes: 'Needs changes' }) : undefined;
      const res = await fetch(`${API}/review/${bundleId}/${action}`, { method: 'PUT', headers: authHeaders(), body });
      if (!res.ok) throw new Error();
      showToast(action === 'approve' ? 'Published to marketplace' : 'Rejected');
      await load();
    } catch { showToast(`Failed to ${action}`, 'error'); } finally { setBusy(false); }
  };

  const statusColor = (s: string) => s === 'PUBLISHED' ? 'var(--color-success)' : s === 'IN_REVIEW' ? '#f59e0b' : s === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-text-tertiary)';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, padding: '12px 20px', borderRadius: 8, background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', color: '#fff', fontWeight: 600, boxShadow: 'var(--shadow-lg)' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/apps/store" style={{ color: 'var(--color-text-secondary)' }}><ArrowLeft size={18} /></Link>
        <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 style={{ color: 'var(--color-primary)' }} /> Developer Portal
        </h1>
      </div>
      {vendor && <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Publishing as <strong>{vendor.name}</strong> {vendor.verified && <Shield size={12} style={{ color: 'var(--color-success)', verticalAlign: 'middle' }} />} · vendor slug <code>{vendor.slug}</code></p>}

      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)' }}>
        {(['apps', 'review'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', border: 'none', background: 'none', borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent', color: tab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
            {t === 'apps' ? 'My Apps' : `Review Queue${pending.length ? ` (${pending.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'apps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}><Plus size={16} /> New App</button>
          </div>

          {apps.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}><Package size={40} style={{ opacity: 0.4 }} /><p>No apps yet. Create one and publish a version.</p></div>}

          {apps.map(app => (
            <div key={app.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, background: 'var(--color-bg-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{app.name} <span style={{ fontSize: 11, color: statusColor(app.status), marginLeft: 6 }}>{app.status}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{app.category} · /{app.slug}</div>
                </div>
                <button onClick={() => { setBundleFor(app); setManifestText(SAMPLE_MANIFEST.replace('"My App"', JSON.stringify(app.name))); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}><Upload size={14} /> New Version</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {app.bundles.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '6px 10px', borderRadius: 6, background: 'var(--color-bg)' }}>
                    <span style={{ fontWeight: 600 }}>v{b.version}</span>
                    <span style={{ fontSize: 11, color: statusColor(b.status), fontWeight: 600 }}>{b.status}</span>
                    {b.reviewNotes && <span style={{ fontSize: 11, color: 'var(--color-danger)' }}>— {b.reviewNotes}</span>}
                    <span style={{ flex: 1 }} />
                    {(b.status === 'DRAFT' || b.status === 'REJECTED') && <button onClick={() => submitBundle(b.id)} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12, cursor: 'pointer' }}><Send size={12} /> Submit</button>}
                  </div>
                ))}
                {app.bundles.length === 0 && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No versions yet.</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pending.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}><Clock size={40} style={{ opacity: 0.4 }} /><p>No bundles awaiting review.</p></div>}
          {pending.map(b => (
            <div key={b.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{b.package.name} <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)' }}>v{b.version}</span></div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>by {b.package.vendor.name} · /{b.package.slug}</div>
                {b.changelog && <div style={{ fontSize: 12, marginTop: 4 }}>{b.changelog}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => review(b.id, 'approve')} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--color-success)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}><CheckCircle2 size={16} /> Approve & Publish</button>
                <button onClick={() => review(b.id, 'reject')} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', fontWeight: 600, cursor: 'pointer' }}><XCircle size={16} /> Reject</button>
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
          <Field label="Short description"><textarea value={newApp.description} onChange={e => setNewApp(s => ({ ...s, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} /></Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={() => setShowCreate(false)} style={btnGhost}>Cancel</button>
            <button onClick={createApp} disabled={busy} style={btnPrimary}>{busy ? 'Creating…' : 'Create'}</button>
          </div>
        </Modal>
      )}

      {/* Create Bundle modal */}
      {bundleFor && (
        <Modal title={`New Version — ${bundleFor.name}`} onClose={() => setBundleFor(null)} wide>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 0 }}>Define the app manifest (schemas + pages). The <code>slug</code> and <code>vendor</code> are pinned to your app automatically.</p>
          <textarea value={manifestText} onChange={e => setManifestText(e.target.value)} spellCheck={false} style={{ ...inputStyle, minHeight: 320, fontFamily: 'monospace', fontSize: 12 }} />
          <Field label="Changelog (optional)"><input value={changelog} onChange={e => setChangelog(e.target.value)} style={inputStyle} placeholder="What changed in this version" /></Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={() => setBundleFor(null)} style={btnGhost}>Cancel</button>
            <button onClick={createBundle} disabled={busy} style={btnPrimary}>{busy ? 'Saving…' : 'Create Draft Version'}</button>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 14, outline: 'none' };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</label>{children}</div>;
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-bg-elevated)', borderRadius: 12, padding: 24, width: '100%', maxWidth: wide ? 680 : 440, maxHeight: '85vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 'var(--text-lg)', fontWeight: 700 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
