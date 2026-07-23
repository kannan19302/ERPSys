'use client';
import React, { useState, useEffect } from 'react';
import { Palette, Plus, CheckCircle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function EcommerceThemesPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(''); const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', isActive: false, config: {} as any });
  useEffect(() => { if (storeId) load(); }, [storeId]);
  const load = async () => { setLoading(true); try { const d = await client.get<any>(`/ecommerce/exp/${storeId}/themes`); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { await client.post(`/ecommerce/exp/${storeId}/themes`, form); setShowModal(false); load(); } catch {} };
  const activate = async (id: string) => { try { await client.post(`/ecommerce/exp/${storeId}/themes/${id}/activate`, {}); load(); } catch {} };
  return (
    <RouteGuard permission="ecommerce.storefront.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Palette className="ui-text-primary" /> Store Themes</h1><p className="ui-text-sm-muted">Manage visual themes for your storefront.</p></div>
          <div className="ui-hstack-2"><input className="ui-input" placeholder="Store ID" value={storeId} onChange={e => setStoreId(e.target.value)} /><button className="ui-btn" disabled={!storeId} onClick={() => setShowModal(true)}><Plus size={14} /> Create Theme</button></div>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Name</th><th>Active</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.name}</td><td>{i.isActive ? <span className="ui-badge-success"><CheckCircle size={14} /> Active</span> : <span className="ui-badge">Inactive</span>}</td><td>{new Date(i.createdAt).toLocaleDateString()}</td>
                <td>{!i.isActive && <button className="ui-btn" onClick={() => activate(i.id)}>Activate</button>}</td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Create Theme</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
