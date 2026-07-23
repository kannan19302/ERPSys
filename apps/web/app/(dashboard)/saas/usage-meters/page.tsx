'use client';
import React, { useState, useEffect } from 'react';
import { Gauge, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasUsageMetersPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', unit: 'requests', aggregationType: 'SUM', resetPeriod: 'MONTHLY', billingUnit: 1000, unitPrice: 0.01 });
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const d = await client.get<any>('/saas/exp/usage-meters'); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { if (editId) { await client.put(`/saas/exp/usage-meters/${editId}`, form); } else { await client.post('/saas/exp/usage-meters', form); } setShowModal(false); setEditId(null); load(); } catch {} };
  const remove = async (id: string) => { try { await client.delete(`/saas/exp/usage-meters/${id}`); load(); } catch {} };
  return (
    <RouteGuard permission="saas.billing.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Gauge className="ui-text-primary" /> Usage Meters</h1><p className="ui-text-sm-muted">Define metered billing units.</p></div>
          <button className="ui-btn" onClick={() => { setEditId(null); setForm({ name: '', code: '', description: '', unit: 'requests', aggregationType: 'SUM', resetPeriod: 'MONTHLY', billingUnit: 1000, unitPrice: 0.01 }); setShowModal(true); }}><Plus size={14} /> Add Meter</button>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Name</th><th>Code</th><th>Unit</th><th>Aggregation</th><th>Reset</th><th>Price</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.name}</td><td><code>{i.code}</code></td><td>{i.unit}</td><td>{i.aggregationType}</td><td>{i.resetPeriod}</td><td>${Number(i.unitPrice).toFixed(4)}/{i.billingUnit}</td>
                <td className="ui-hstack-1"><button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/saas/exp/usage-meters/${i.id}`); alert(JSON.stringify(d, null, 2)); }}><Eye size={14} /></button><button className="ui-btn-icon" onClick={() => { setEditId(i.id); setForm(i); setShowModal(true); }}><Edit2 size={14} /></button><button className="ui-btn-icon ui-text-error" onClick={() => remove(i.id)}><Trash2 size={14} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Add'} Usage Meter</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Code</label><input className="ui-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="ui-form-group"><label>Unit</label><input className="ui-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="ui-form-group"><label>Unit Price</label><input type="number" step="0.0001" className="ui-input" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: Number(e.target.value) })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
