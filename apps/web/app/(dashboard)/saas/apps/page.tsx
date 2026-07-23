'use client';
import React, { useState, useEffect } from 'react';
import { Puzzle, Plus, Edit2, Search, Download, Eye, Trash2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasAppsPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', shortDescription: '', category: '', isPublished: false, isFree: false, price: 0, billingMode: 'ONE_TIME', trialDays: 0 });
  useEffect(() => { load(); }, [page, search]);
  const load = async () => { setLoading(true); try { const params = new URLSearchParams({ page: String(page), limit: '20', search }); const d = await client.get<any>(`/saas/exp/apps?${params}`); if (d?.data) { setItems(d.data); setTotalPages(d.meta?.totalPages || 1); } } catch {} setLoading(false); };
  const save = async () => { try { if (editId) { await client.put(`/saas/exp/apps/${editId}`, form); } else { await client.post('/saas/exp/apps', form); } setShowModal(false); setEditId(null); load(); } catch {} };
  const remove = async (id: string) => { try { await client.delete(`/saas/exp/apps/${id}`); load(); } catch {} };
  return (
    <RouteGuard permission="saas.app.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Puzzle className="ui-text-primary" /> Marketplace Apps</h1><p className="ui-text-sm-muted">Manage the app marketplace.</p></div>
          <button className="ui-btn" onClick={() => { setEditId(null); setForm({ name: '', slug: '', description: '', shortDescription: '', category: '', isPublished: false, isFree: false, price: 0, billingMode: 'ONE_TIME', trialDays: 0 }); setShowModal(true); }}><Plus size={14} /> Add App</button>
        </div>
        <div className="ui-card"><input className="ui-input" placeholder="Search apps..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Category</th><th>Price</th><th>Published</th><th>Installs</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.name}</td><td><code>{i.slug}</code></td><td>{i.category || '-'}</td><td>{i.isFree ? 'Free' : `$${Number(i.price).toFixed(2)}`}</td><td>{i.isPublished ? <span className="ui-badge-success">Yes</span> : <span className="ui-badge">No</span>}</td><td>{i._count?.installations || i.installCount || 0}</td>
                <td className="ui-hstack-1"><button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/saas/exp/apps/${i.id}`); alert(JSON.stringify(d, null, 2)); }}><Eye size={14} /></button><button className="ui-btn-icon" onClick={() => { setEditId(i.id); setForm(i); setShowModal(true); }}><Edit2 size={14} /></button><button className="ui-btn-icon ui-text-error" onClick={() => remove(i.id)}><Trash2 size={14} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Add'} App</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Slug</label><input className="ui-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              <div className="ui-form-group"><label>Category</label><input className="ui-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div className="ui-form-group"><label>Price</label><input type="number" className="ui-input" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} /> Free</label>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
