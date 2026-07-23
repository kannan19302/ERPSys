'use client';
import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit2, Eye, Globe } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function EcommerceStoresPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', currency: 'USD', language: 'en', taxCalculation: 'EXCLUSIVE' });
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const d = await client.get<any>('/ecommerce/exp/stores'); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { if (editId) { await client.put(`/ecommerce/exp/stores/${editId}`, form); } else { await client.post('/ecommerce/exp/stores', form); } setShowModal(false); setEditId(null); load(); } catch {} };
  return (
    <RouteGuard permission="ecommerce.storefront.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Store className="ui-text-primary" /> Stores</h1><p className="ui-text-sm-muted">Manage ecommerce storefronts and configurations.</p></div>
          <button className="ui-btn" onClick={() => { setEditId(null); setForm({ name: '', slug: '', description: '', currency: 'USD', language: 'en', taxCalculation: 'EXCLUSIVE' }); setShowModal(true); }}><Plus size={14} /> Create Store</button>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Currency</th><th>Published</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.name}</td><td><code>{i.slug}</code></td><td>{i.currency}</td><td>{i.isPublished ? <span className="ui-badge-success">Yes</span> : <span className="ui-badge">No</span>}</td><td>{i.isActive ? <span className="ui-badge-success">Active</span> : <span className="ui-badge">Inactive</span>}</td>
                <td className="ui-hstack-1"><button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/ecommerce/exp/stores/${i.id}`); alert(JSON.stringify(d, null, 2)); }}><Eye size={14} /></button><button className="ui-btn-icon" onClick={() => { setEditId(i.id); setForm(i); setShowModal(true); }}><Edit2 size={14} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Create'} Store</h2>
              <div className="ui-form-group"><label>Store Name</label><input className="ui-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Slug</label><input className="ui-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              <div className="ui-form-group"><label>Currency</label><select className="ui-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
