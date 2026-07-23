'use client';
import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit2, Trash2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function EcommerceCouponsPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(''); const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', description: '', type: 'PERCENTAGE', value: 0, minOrderAmount: 0, maxDiscount: 0, validFrom: '', validTo: '' });
  useEffect(() => { if (storeId) load(); }, [storeId]);
  const load = async () => { setLoading(true); try { const d = await client.get<any>(`/ecommerce/exp/${storeId}/coupons`); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { if (editId) { await client.put(`/ecommerce/exp/coupons/${editId}`, form); } else { await client.post(`/ecommerce/exp/${storeId}/coupons`, form); } setShowModal(false); setEditId(null); load(); } catch {} };
  const remove = async (id: string) => { try { await client.delete(`/ecommerce/exp/coupons/${id}`); load(); } catch {} };
  return (
    <RouteGuard permission="ecommerce.order.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Ticket className="ui-text-primary" /> Coupons</h1><p className="ui-text-sm-muted">Manage discount coupons for your storefront.</p></div>
          <div className="ui-hstack-2"><input className="ui-input" placeholder="Store ID" value={storeId} onChange={e => setStoreId(e.target.value)} /><button className="ui-btn" disabled={!storeId} onClick={() => { setEditId(null); setForm({ code: '', description: '', type: 'PERCENTAGE', value: 0, minOrderAmount: 0, maxDiscount: 0, validFrom: '', validTo: '' }); setShowModal(true); }}><Plus size={14} /> Add</button></div>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td><code>{i.code}</code></td><td>{i.type}</td><td>{i.type === 'PERCENTAGE' ? `${i.value}%` : `$${i.value}`}</td><td>${Number(i.minOrderAmount || 0).toFixed(2)}</td><td>{i.usedCount}/{i.usageLimit || '∞'}</td><td>{i.isActive ? <span className="ui-badge-success">Active</span> : <span className="ui-badge">Inactive</span>}</td>
                <td className="ui-hstack-1"><button className="ui-btn-icon" onClick={() => { setEditId(i.id); setForm(i); setShowModal(true); }}><Edit2 size={14} /></button><button className="ui-btn-icon ui-text-error" onClick={() => remove(i.id)}><Trash2 size={14} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Add'} Coupon</h2>
              <div className="ui-form-group"><label>Code</label><input className="ui-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="ui-form-group"><label>Type</label><select className="ui-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed</option><option value="FREE_SHIPPING">Free Shipping</option></select></div>
              <div className="ui-form-group"><label>Value</label><input type="number" className="ui-input" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
