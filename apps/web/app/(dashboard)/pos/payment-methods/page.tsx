'use client';
import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function POSPaymentMethodsPage() {
  const client = useApiClient();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', type: 'CASH', sortOrder: 0, requiresRef: false });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const d = await client.get<any>('/pos/exp/payment-methods'); setMethods(Array.isArray(d) ? d : []); } catch {}
    setLoading(false);
  };

  const save = async () => {
    try {
      if (editId) { await client.put(`/pos/exp/payment-methods/${editId}`, form); } else { await client.post('/pos/exp/payment-methods', form); }
      setShowModal(false); setEditId(null); load();
    } catch {}
  };

  const remove = async (id: string) => {
    try { await client.delete(`/pos/exp/payment-methods/${id}`); load(); } catch {}
  };

  return (
    <RouteGuard permission="pos.payment-method.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><CreditCard className="ui-text-primary" /> Payment Methods</h1><p className="ui-text-sm-muted">Configure accepted payment methods.</p></div>
          <button className="ui-btn" onClick={() => { setEditId(null); setForm({ name: '', code: '', type: 'CASH', sortOrder: 0, requiresRef: false }); setShowModal(true); }}><Plus size={14} /> Add</button>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Active</th><th>Order</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> :
                methods.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td><td>{m.code}</td><td>{m.type}</td>
                    <td>{m.isActive ? <span className="ui-badge-success">Active</span> : <span className="ui-badge">Inactive</span>}</td>
                    <td>{m.sortOrder}</td>
                    <td className="ui-hstack-1">
                      <button className="ui-btn-icon" onClick={() => { setEditId(m.id); setForm(m); setShowModal(true); }}><Edit2 size={14} /></button>
                      <button className="ui-btn-icon ui-text-error" onClick={() => remove(m.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Add'} Payment Method</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Code</label><input className="ui-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="ui-form-group"><label>Type</label><select className="ui-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="CASH">Cash</option><option value="CARD">Card</option><option value="MOBILE">Mobile</option><option value="GIFT_CARD">Gift Card</option><option value="CREDIT">Credit</option><option value="OTHER">Other</option></select></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
