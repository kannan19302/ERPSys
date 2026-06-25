'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Settings, LayoutGrid, Loader2, ChevronRight, Power, ArrowLeft, Stethoscope, PanelLeft } from 'lucide-react';

interface ModulePage { slug: string; title: string; type: string; }
interface AppModule { slug: string; name: string; description: string | null; icon: string | null; enabled: boolean; roles?: string[]; pages: ModulePage[]; }
interface AppShell { app: { slug: string; name: string; icon: string | null; description: string | null; version: string | null }; modules: AppModule[]; }

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const API = '/api/v1/admin/marketplace';

export default function AppShellPage() {
  const params = useParams();
  const moduleSlug = params.module as string;

  const searchParams = useSearchParams();
  const view: 'home' | 'admin' = searchParams.get('view') === 'admin' ? 'admin' : 'home';

  const [shell, setShell] = useState<AppShell | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/installed/${moduleSlug}/modules`, { headers: authHeaders() });
      if (res.ok) setShell(await res.json());
      else setNotFound(true);
    } catch { setNotFound(true); } finally { setLoading(false); }
  }, [moduleSlug]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (slug: string, enabled: boolean) => {
    setBusy(slug);
    // optimistic
    setShell(s => s ? { ...s, modules: s.modules.map(m => m.slug === slug ? { ...m, enabled } : m) } : s);
    try {
      const res = await fetch(`${API}/installed/${moduleSlug}/modules/${slug}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ enabled }) });
      if (!res.ok) throw new Error();
    } catch {
      setShell(s => s ? { ...s, modules: s.modules.map(m => m.slug === slug ? { ...m, enabled: !enabled } : m) } : s); // revert
    } finally { setBusy(null); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} /></div>;

  if (notFound || !shell) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ marginBottom: 8 }}>App not installed</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>This app isn’t installed for your workspace.</p>
        <Link href="/apps/store" style={{ color: 'var(--color-primary)' }}>Go to App Store →</Link>
      </div>
    );
  }

  const enabledModules = shell.modules.filter(m => m.enabled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/apps" style={{ color: 'var(--color-text-secondary)', display: 'flex' }}><ArrowLeft size={18} /></Link>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#ef444422,#ef444408)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{shell.app.icon || '📦'}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{shell.app.name}</h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{shell.app.description || 'Industry application'} {shell.app.version && <span style={{ color: 'var(--color-text-tertiary)' }}>· v{shell.app.version}</span>}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {shell.app.slug === 'healthcare' && (
            <Link href={`/app/${moduleSlug}/clinical`} style={{ ...tabBtn(false), textDecoration: 'none' }}><Stethoscope size={15} /> Clinical Tools</Link>
          )}
          {view === 'admin'
            ? <Link href={`/app/${moduleSlug}`} style={{ ...tabBtn(false), textDecoration: 'none' }}><LayoutGrid size={15} /> Overview</Link>
            : <Link href={`/app/${moduleSlug}?view=admin`} style={{ ...tabBtn(false), textDecoration: 'none' }}><Settings size={15} /> Admin Console</Link>}
        </div>
      </div>

      {/* OVERVIEW: lightweight landing — navigation lives in the left sidebar */}
      {view === 'home' && (
        <>
          {enabledModules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, border: '1px dashed var(--color-border)', borderRadius: 12 }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>All modules are disabled. Enable one in the <Link href={`/app/${moduleSlug}?view=admin`} style={{ color: 'var(--color-primary)' }}>Admin Console</Link>.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                <PanelLeft size={16} style={{ color: 'var(--color-primary)' }} />
                Use the sidebar to navigate this app’s modules and pages. {enabledModules.length} module{enabledModules.length === 1 ? '' : 's'} enabled.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                {enabledModules.map(m => {
                  const first = m.pages[0];
                  const inner = (
                    <>
                      <span style={{ fontSize: 22 }}>{m.icon || '📦'}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{m.pages.length} page{m.pages.length === 1 ? '' : 's'}</div>
                      </div>
                      {first && <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)', marginLeft: 'auto' }} />}
                    </>
                  );
                  const cardStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 16px', background: 'var(--color-bg-elevated)', textDecoration: 'none', color: 'var(--color-text)' };
                  return first
                    ? <Link key={m.slug} href={`/app/${moduleSlug}/${first.slug}`} style={cardStyle}>{inner}</Link>
                    : <div key={m.slug} style={cardStyle}>{inner}</div>;
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ADMIN CONSOLE: enable/disable modules without leaving the app */}
      {view === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={16} /> Module Management</div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>Enable or disable functionality for this app. Disabled modules are hidden from the sidebar; data is preserved and returns when re-enabled.</p>
          </div>
          {shell.modules.map(m => (
            <div key={m.slug} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-bg-elevated)' }}>
              <span style={{ fontSize: 24 }}>{m.icon || '📦'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                {m.description && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{m.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{m.pages.length} page{m.pages.length === 1 ? '' : 's'}</span>
                  {(m.roles || []).map(role => (
                    <span key={role} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{role}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => toggle(m.slug, !m.enabled)} disabled={busy === m.slug}
                title={m.enabled ? 'Disable module' : 'Enable module'}
                style={{ position: 'relative', width: 46, height: 26, borderRadius: 13, border: 'none', cursor: busy === m.slug ? 'wait' : 'pointer', background: m.enabled ? 'var(--color-success)' : 'var(--color-border)', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 3, left: m.enabled ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Power size={11} style={{ color: m.enabled ? 'var(--color-success)' : 'var(--color-text-tertiary)' }} />
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }`}</style>
    </div>
  );
}

function tabBtn(active: boolean): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: active ? 'var(--color-primary)' : 'var(--color-bg-elevated)', color: active ? '#fff' : 'var(--color-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
}
