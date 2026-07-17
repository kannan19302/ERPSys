'use client';
import styles from './page.module.css';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Settings, LayoutGrid, Loader2, ChevronRight, Power, ArrowLeft, Stethoscope, PanelLeft } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface ModulePage { slug: string; title: string; type: string; }
interface AppModule { slug: string; name: string; description: string | null; icon: string | null; enabled: boolean; roles?: string[]; pages: ModulePage[]; }
interface AppShell { app: { slug: string; name: string; icon: string | null; description: string | null; version: string | null }; modules: AppModule[]; }

export default function AppShellPage() {
  const client = useApiClient();
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
      setShell(await client.get<AppShell>(`/admin/marketplace/installed/${moduleSlug}/modules`));
    } catch { setNotFound(true); } finally { setLoading(false); }
  }, [moduleSlug, client]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (slug: string, enabled: boolean) => {
    setBusy(slug);
    // optimistic
    setShell(s => s ? { ...s, modules: s.modules.map(m => m.slug === slug ? { ...m, enabled } : m) } : s);
    try {
      await client.request(`/admin/marketplace/installed/${moduleSlug}/modules/${slug}`, { method: 'PUT', body: JSON.stringify({ enabled }) });
    } catch {
      setShell(s => s ? { ...s, modules: s.modules.map(m => m.slug === slug ? { ...m, enabled: !enabled } : m) } : s); // revert
    } finally { setBusy(null); }
  };

  if (loading) return <div className={styles.s1}><Loader2 size={32} className={styles.s28} /></div>;

  if (notFound || !shell) {
    return (
      <div className={styles.s2}>
        <h2 className={styles.s3}>App not installed</h2>
        <p className="ui-text-muted">This app isn’t installed for your workspace.</p>
        <Link href="/apps/store" className="ui-text-primary">Go to App Store →</Link>
      </div>
    );
  }

  const enabledModules = shell.modules.filter(m => m.enabled);

  return (
    <RouteGuard permission="apps.shell.read">
    <div className={styles.s4}>
      {/* Header */}
      <div className={styles.s5}>
        <div className={styles.s6}>
          <Link href="/apps" className={styles.s30}><ArrowLeft size={18} /></Link>
          <div className={styles.s7}>{shell.app.icon || '📦'}</div>
          <div>
            <h1 className={styles.s8}>{shell.app.name}</h1>
            <p className={styles.s9}>{shell.app.description || 'Industry application'} {shell.app.version && <span className="ui-text-tertiary">· v{shell.app.version}</span>}</p>
          </div>
        </div>
        <div className={styles.s10}>
          {shell.app.slug === 'healthcare' && (
            <Link href={`/app/${moduleSlug}/clinical`} style={{ ...tabBtn(false) }} className={styles.s31}><Stethoscope size={15} /> Clinical Tools</Link>
          )}
          {view === 'admin'
            ? <Link href={`/app/${moduleSlug}`} style={{ ...tabBtn(false) }} className={styles.s31}><LayoutGrid size={15} /> Overview</Link>
            : <Link href={`/app/${moduleSlug}?view=admin`} style={{ ...tabBtn(false) }} className={styles.s31}><Settings size={15} /> Admin Console</Link>}
        </div>
      </div>

      {/* OVERVIEW: lightweight landing — navigation lives in the left sidebar */}
      {view === 'home' && (
        <>
          {enabledModules.length === 0 ? (
            <div className={styles.s11}>
              <p className="ui-text-muted">All modules are disabled. Enable one in the <Link href={`/app/${moduleSlug}?view=admin`} className="ui-text-primary">Admin Console</Link>.</p>
            </div>
          ) : (
            <>
              <div className={styles.s12}>
                <PanelLeft size={16} className="ui-text-primary" />
                Use the sidebar to navigate this app’s modules and pages. {enabledModules.length} module{enabledModules.length === 1 ? '' : 's'} enabled.
              </div>
              <div className={styles.s13}>
                {enabledModules.map(m => {
                  const first = m.pages[0];
                  const inner = (
                    <>
                      <span className={styles.s14}>{m.icon || '📦'}</span>
                      <div className={styles.s15}>
                        <div className={styles.s16}>{m.name}</div>
                        <div className="ui-text-caption ui-text-tertiary">{m.pages.length} page{m.pages.length === 1 ? '' : 's'}</div>
                      </div>
                      {first && <ChevronRight size={14} className={styles.s29} />}
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
        <div className={styles.s17}>
          <div className={styles.s18}>
            <div className={styles.s19}><Settings size={16} /> Module Management</div>
            <p className={styles.s20}>Enable or disable functionality for this app. Disabled modules are hidden from the sidebar; data is preserved and returns when re-enabled.</p>
          </div>
          {shell.modules.map(m => (
            <div key={m.slug} className={styles.s21}>
              <span className={styles.s22}>{m.icon || '📦'}</span>
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                {m.description && <div className={styles.s23}>{m.description}</div>}
                <div className={styles.s24}>
                  <span className="ui-text-caption ui-text-tertiary">{m.pages.length} page{m.pages.length === 1 ? '' : 's'}</span>
                  {(m.roles || []).map(role => (
                    <span key={role} className={styles.s25}>{role}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => toggle(m.slug, !m.enabled)} disabled={busy === m.slug}
                title={m.enabled ? 'Disable module' : 'Enable module'}
                style={{ cursor: busy === m.slug ? 'wait' : 'pointer', background: m.enabled ? 'var(--color-success)' : 'var(--color-border)' }} className={styles.s26}>
                <span style={{ left: m.enabled ? 23 : 3 }} className={styles.s27}>
                  <Power size={11} style={{ color: m.enabled ? 'var(--color-success)' : 'var(--color-text-tertiary)' }} />
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }`}</style>
    </div>
    </RouteGuard>
  );
}

function tabBtn(active: boolean): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: active ? 'var(--color-primary)' : 'var(--color-bg-elevated)', color: active ? '#fff' : 'var(--color-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
}
