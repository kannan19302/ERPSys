/* eslint-disable */
// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { Globe, Plus, Trash2, ExternalLink, Settings, FileText, Bot } from 'lucide-react';
import Link from 'next/link';

export default function SitesListPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setSites(await apiGet('/builder/web-studio/sites')); } catch { setSites([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try { await apiPost('/builder/web-studio/sites', { name: name.trim() }); setName(''); await load(); } finally { setCreating(false); }
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this site and all its pages?')) return;
    await apiDelete(`/builder/web-studio/sites/${id}`);
    await load();
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
        <Globe size={24} style={{ color: 'var(--color-primary)' }} />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Sites</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
        Build and manage multiple websites. Each site can have its own pages, blog, docs, collections, store, chatbot, and custom domain.
      </p>

      {/* Create */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <input
          value={name} onChange={(e) => setName(e.target.value)} placeholder="New site name…"
          style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} disabled={creating} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
          <Plus size={15} /> Create site
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
      ) : sites.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          No sites yet. Create your first site above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {sites.map((site) => (
            <div key={site.id} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>{site.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {site.domains?.length ? site.domains.map((d: any) => d.host).join(', ') : `/${site.slug}`}
                    {' · '}{site._count?.pages ?? 0} page(s)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Link href={`/builder/web/sites/${site.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', textDecoration: 'none', cursor: 'pointer' }}>
                    <Settings size={14} /> Manage
                  </Link>
                  <button onClick={() => remove(site.id)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-danger, #dc2626)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
