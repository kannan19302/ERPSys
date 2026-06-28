/* eslint-disable */
// @ts-nocheck
'use client';

import React, { useEffect, useState, use } from 'react';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import { ArrowLeft, Globe, Plus, Trash2, FileText, Bot, Save, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const PAGE_TYPES = ['PAGE', 'BLOG', 'DOCS', 'LANDING'];

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [site, setSite] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [chatbot, setChatbot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pages' | 'domains' | 'chatbot' | 'theme'>('pages');
  const [msg, setMsg] = useState('');

  // New page form
  const [np, setNp] = useState({ path: '/', title: '', type: 'PAGE', status: 'DRAFT' });
  // New domain form
  const [newHost, setNewHost] = useState('');

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, c] = await Promise.all([
        apiGet(`/builder/web-studio/sites/${id}`),
        apiGet(`/builder/web-studio/sites/${id}/pages`),
        apiGet(`/builder/web-studio/sites/${id}/chatbot`),
      ]);
      setSite(s); setPages(p); setChatbot(c);
    } catch { /* */ }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const addPage = async () => {
    if (!np.title.trim()) return;
    await apiPut(`/builder/web-studio/sites/${id}/pages`, np);
    setNp({ path: '/', title: '', type: 'PAGE', status: 'DRAFT' });
    flash('Page created'); await load();
  };
  const publishPage = async (p: any) => {
    await apiPut(`/builder/web-studio/sites/${id}/pages`, { ...p, status: p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' });
    flash('Status updated'); await load();
  };
  const delPage = async (pid: string) => { await apiDelete(`/builder/web-studio/sites/${id}/pages/${pid}`); await load(); };

  const addDomain = async () => {
    if (!newHost.trim()) return;
    await apiPost(`/builder/web-studio/sites/${id}/domains`, { host: newHost.trim(), isPrimary: !site.domains?.length });
    setNewHost(''); flash('Domain added'); await load();
  };
  const delDomain = async (did: string) => { await apiDelete(`/builder/web-studio/sites/${id}/domains/${did}`); await load(); };

  const saveChatbot = async () => {
    await apiPatch(`/builder/web-studio/sites/${id}/chatbot`, chatbot);
    flash('Chatbot saved'); await load();
  };

  const saveTheme = async () => {
    await apiPatch(`/builder/web-studio/sites/${id}`, { theme: site.theme, settings: site.settings });
    flash('Theme saved');
  };

  if (loading) return <div style={{ padding: 'var(--space-6)' }}>Loading…</div>;
  if (!site) return <div style={{ padding: 'var(--space-6)' }}>Site not found</div>;

  const tabStyle = (t: string) => ({
    padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
    border: t === tab ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
    background: t === tab ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
    color: t === tab ? '#fff' : 'var(--color-text)',
  });

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 980, margin: '0 auto' }}>
      <Link href="/builder/web/sites" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
        <ArrowLeft size={14} /> Back to Sites
      </Link>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--space-1)' }}>{site.name}</h1>
      <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4)' }}>
        {site.domains?.map((d: any) => d.host).join(', ') || 'No custom domain yet'}
      </p>

      {msg && <div style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-success-bg, #ecfdf5)', color: 'var(--color-success, #047857)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <button onClick={() => setTab('pages')} style={tabStyle('pages')}><FileText size={14} /> Pages</button>
        <button onClick={() => setTab('domains')} style={tabStyle('domains')}><Globe size={14} /> Domains</button>
        <button onClick={() => setTab('chatbot')} style={tabStyle('chatbot')}><Bot size={14} /> Chatbot</button>
        <button onClick={() => setTab('theme')} style={tabStyle('theme')}>Theme</button>
      </div>

      {tab === 'pages' && (
        <section>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
            <input value={np.path} onChange={(e) => setNp({ ...np, path: e.target.value })} placeholder="Path, e.g. /about" style={inp} />
            <input value={np.title} onChange={(e) => setNp({ ...np, title: e.target.value })} placeholder="Page title" style={{ ...inp, flex: 2 }} />
            <select value={np.type} onChange={(e) => setNp({ ...np, type: e.target.value })} style={inp}>
              {PAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button onClick={addPage} style={primaryBtn}><Plus size={14} /> Add</button>
          </div>
          {pages.length === 0 ? <Empty text="No pages yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {pages.map((p) => (
                <div key={p.id} style={row}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{p.title}</span>
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', marginLeft: 8 }}>{p.path} · {p.type}</span>
                  </div>
                  <button onClick={() => publishPage(p)} style={{ ...ghostBtn, color: p.status === 'PUBLISHED' ? 'var(--color-success, #047857)' : 'var(--color-text-secondary)' }}>
                    {p.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </button>
                  <button onClick={() => delPage(p.id)} style={iconBtn}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'domains' && (
        <section>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <input value={newHost} onChange={(e) => setNewHost(e.target.value)} placeholder="e.g. www.example.com" style={{ ...inp, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && addDomain()} />
            <button onClick={addDomain} style={primaryBtn}><Plus size={14} /> Add domain</button>
          </div>
          {!site.domains?.length ? <Empty text="No custom domains" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {site.domains.map((d: any) => (
                <div key={d.id} style={row}>
                  <Globe size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{d.host} {d.isPrimary && <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-xs)' }}>primary</span>}</span>
                  <button onClick={() => delDomain(d.id)} style={iconBtn}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'chatbot' && chatbot && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={label}>Name</label>
          <input value={chatbot.name || ''} onChange={(e) => setChatbot({ ...chatbot, name: e.target.value })} style={inp} />
          <label style={label}>Enabled</label>
          <select value={chatbot.enabled ? 'true' : 'false'} onChange={(e) => setChatbot({ ...chatbot, enabled: e.target.value === 'true' })} style={inp}>
            <option value="true">Yes</option><option value="false">No</option>
          </select>
          <label style={label}>Persona (system prompt)</label>
          <textarea value={chatbot.config?.persona || ''} onChange={(e) => setChatbot({ ...chatbot, config: { ...chatbot.config, persona: e.target.value } })} rows={3} style={{ ...inp, resize: 'vertical' }} />
          <label style={label}>Greeting</label>
          <input value={chatbot.config?.greeting || ''} onChange={(e) => setChatbot({ ...chatbot, config: { ...chatbot.config, greeting: e.target.value } })} style={inp} />
          <label style={label}>Accent colour</label>
          <input value={chatbot.config?.accent || '#6366f1'} onChange={(e) => setChatbot({ ...chatbot, config: { ...chatbot.config, accent: e.target.value } })} style={{ ...inp, width: 120 }} type="color" />
          <button onClick={saveChatbot} style={{ ...primaryBtn, alignSelf: 'flex-start' }}><Save size={14} /> Save chatbot</button>
        </section>
      )}

      {tab === 'theme' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={label}>Theme tokens (JSON)</label>
          <textarea value={JSON.stringify(site.theme || {}, null, 2)} onChange={(e) => { try { setSite({ ...site, theme: JSON.parse(e.target.value) }); } catch {} }} rows={8} style={{ ...inp, fontFamily: 'monospace', resize: 'vertical' }} />
          <label style={label}>Site settings (JSON)</label>
          <textarea value={JSON.stringify(site.settings || {}, null, 2)} onChange={(e) => { try { setSite({ ...site, settings: JSON.parse(e.target.value) }); } catch {} }} rows={6} style={{ ...inp, fontFamily: 'monospace', resize: 'vertical' }} />
          <button onClick={saveTheme} style={{ ...primaryBtn, alignSelf: 'flex-start' }}><Save size={14} /> Save theme</button>
        </section>
      )}
    </div>
  );
}

const Empty = ({ text }: { text: string }) => (
  <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>{text}</div>
);
const inp: React.CSSProperties = { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' };
const primaryBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as any };
const ghostBtn: React.CSSProperties = { padding: 'var(--space-1) var(--space-2)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 'var(--text-xs)' };
const iconBtn: React.CSSProperties = { padding: 'var(--space-1)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' };
const label: React.CSSProperties = { fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as any };
