'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { Inbox, Trash2, Mail, MailOpen, Archive, AlertOctagon, Search } from 'lucide-react';

const api = (path: string, opts: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(`/api/v1/builder/${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}`, ...(opts.headers || {}) } });
};

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  NEW: { label: 'New', color: '#3b82f6', icon: Mail },
  READ: { label: 'Read', color: '#6b7280', icon: MailOpen },
  ARCHIVED: { label: 'Archived', color: '#9ca3af', icon: Archive },
  SPAM: { label: 'Spam', color: '#dc2626', icon: AlertOctagon },
};

export default function WebSubmissionsPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    const qp = new URLSearchParams();
    if (filter !== 'ALL') qp.set('status', filter);
    const res = await api(`web-form-submissions?${qp}`);
    if (res.ok) setSubs(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const setStatus = async (id: string, status: string) => {
    await api(`web-form-submissions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    fetchSubs();
    if (selected?.id === id) setSelected({ ...selected, status });
  };
  const executeDeleteSub = async (id: string) => {
    await api(`web-form-submissions/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    fetchSubs();
  };
  const open = (s: any) => { setSelected(s); if (s.status === 'NEW') setStatus(s.id, 'READ'); };

  const filtered = subs.filter((s) => !search || JSON.stringify(s.data).toLowerCase().includes(search.toLowerCase()) || s.formName.toLowerCase().includes(search.toLowerCase()));
  const newCount = subs.filter((s) => s.status === 'NEW').length;

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Form Submissions"
        description="Leads, contacts and newsletter sign-ups captured from your public website"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {newCount > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: '#3b82f6', color: '#fff' }}>{newCount} new</span>}
            <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>← Web Studio</button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <div className="frappe-card" style={{ flex: selected ? '0 0 55%' : 1, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', padding: '6px 6px 6px 30px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
            </div>
            {['ALL', 'NEW', 'READ', 'ARCHIVED', 'SPAM'].map((s) => (
              <button key={s} onClick={() => setFilter(s)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', border: filter === s ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: filter === s ? 'var(--color-primary-bg)' : 'transparent', color: filter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 }}>{s === 'ALL' ? 'All' : STATUS_META[s]?.label}</button>
            ))}
          </div>
          {loading ? <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div> : filtered.length === 0 ? (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}><Inbox size={40} style={{ opacity: 0.4, marginBottom: 10 }} /><div>No submissions yet.</div></div>
          ) : (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {filtered.map((s) => {
                const meta = STATUS_META[s.status] || STATUS_META.NEW!;
                const preview = Object.values(s.data || {}).slice(0, 2).join(' · ');
                return (
                  <div key={s.id} onClick={() => open(s)} style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', background: selected?.id === s.id ? 'var(--color-primary-bg)' : s.status === 'NEW' ? 'var(--color-bg-subtle)' : 'transparent' }}>
                    <meta.icon size={16} style={{ color: meta.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: s.status === 'NEW' ? 700 : 500, fontSize: 'var(--text-sm)', color: 'var(--color-text)', textTransform: 'capitalize' }}>{s.formName}</span>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{new Date(s.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selected && (
          <div className="frappe-card" style={{ flex: 1, padding: 'var(--space-5)', alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, textTransform: 'capitalize' }}>{selected.formName}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{new Date(selected.createdAt).toLocaleString()}{selected.pageSlug ? ` · from /${selected.pageSlug}` : ''}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              {Object.entries(selected.data || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{k}</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', wordBreak: 'break-word' }}>{String(v)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {(['READ', 'ARCHIVED', 'SPAM'] as const).map((s) => (
                <button key={s} onClick={() => setStatus(selected.id, s)} className="frappe-btn frappe-btn-secondary" style={{ fontSize: 'var(--text-xs)' }}>Mark {STATUS_META[s]!.label}</button>
              ))}
              <button onClick={() => setDeleteTarget(selected.id)} className="frappe-btn frappe-btn-secondary" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDeleteSub(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Submission"
        message="Are you sure you want to delete this submission?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
