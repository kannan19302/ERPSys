'use client';
import React, { useState, useEffect } from 'react';
import { Flag, Plus, Edit2, Trash2, Eye, ToggleLeft } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasFeatureFlagsPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', isGloballyEnabled: false, rolloutPercentage: 100, config: {} as any });
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const d = await client.get<any>('/saas/exp/feature-flags'); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { if (editId) { await client.put(`/saas/exp/feature-flags/${editId}`, form); } else { await client.post('/saas/exp/feature-flags', form); } setShowModal(false); setEditId(null); load(); } catch {} };
  const remove = async (id: string) => { try { await client.delete(`/saas/exp/feature-flags/${id}`); load(); } catch {} };
  const toggle = async (id: string, v: boolean) => { try { await client.patch(`/saas/exp/feature-flags/${id}/toggle`, { isEnabled: v }); load(); } catch {} };
  return (
    <RouteGuard permission="saas.admin.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Flag className="ui-text-primary" /> Feature Flags</h1><p className="ui-text-sm-muted">Manage feature toggles and rollout percentages.</p></div>
          <button className="ui-btn" onClick={() => { setEditId(null); setForm({ name: '', code: '', description: '', isGloballyEnabled: false, rolloutPercentage: 100, config: {} }); setShowModal(true); }}><Plus size={14} /> Add Flag</button>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Name</th><th>Code</th><th>Enabled</th><th>Rollout</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.name}</td><td><code>{i.code}</code></td><td><button onClick={() => toggle(i.id, !i.isGloballyEnabled)} className={`ui-hstack-1 ${i.isGloballyEnabled ? 'ui-text-success' : 'ui-text-muted'}`}><ToggleLeft size={16} /> {i.isGloballyEnabled ? 'ON' : 'OFF'}</button></td><td>{i.rolloutPercentage}%</td>
                <td className="ui-hstack-1"><button className="ui-btn-icon" onClick={() => { setEditId(i.id); setForm(i); setShowModal(true); }}><Edit2 size={14} /></button><button className="ui-btn-icon ui-text-error" onClick={() => remove(i.id)}><Trash2 size={14} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Add'} Feature Flag</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Code</label><input className="ui-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="ui-form-group"><label>Rollout %</label><input type="number" min="0" max="100" className="ui-input" value={form.rolloutPercentage} onChange={e => setForm({ ...form, rolloutPercentage: Number(e.target.value) })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
