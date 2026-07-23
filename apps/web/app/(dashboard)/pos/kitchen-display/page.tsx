'use client';
import React, { useState, useEffect } from 'react';
import { ChefHat, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function POSKitchenDisplayPage() {
  const client = useApiClient(); const [displays, setDisplays] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [viewOrders, setViewOrders] = useState<string | null>(null); const [orders, setOrders] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', code: '', terminalIds: [] as string[] });
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const d = await client.get<any>('/pos/exp/kitchen-displays'); setDisplays(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { if (editId) { await client.put(`/pos/exp/kitchen-displays/${editId}`, form); } else { await client.post('/pos/exp/kitchen-displays', form); } setShowModal(false); setEditId(null); load(); } catch {} };
  const remove = async (id: string) => { try { await client.delete(`/pos/exp/kitchen-displays/${id}`); load(); } catch {} };
  const viewKOrders = async (id: string) => { try { const d = await client.get<any>(`/pos/exp/kitchen-displays/${id}/orders`); setOrders(Array.isArray(d) ? d : []); setViewOrders(id); } catch {} };
  const updateOrderStatus = async (id: string, status: string) => { try { await client.put(`/pos/exp/kitchen-orders/${id}/status`, { status }); viewKOrders(viewOrders!); } catch {} };
  return (
    <RouteGuard permission="pos.kitchen-display.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><ChefHat className="ui-text-primary" /> Kitchen Display</h1><p className="ui-text-sm-muted">Manage kitchen display screens and monitor food preparation orders.</p></div>
          <button className="ui-btn" onClick={() => { setEditId(null); setForm({ name: '', code: '', terminalIds: [] }); setShowModal(true); }}><Plus size={14} /> Add Display</button>
        </div>
        {viewOrders ? (
          <div className="ui-card p-5">
            <button onClick={() => setViewOrders(null)} className="ui-text-primary mb-4">← Back to Displays</button>
            <h2 className="mb-4">Kitchen Orders</h2>
            <div className="ui-grid-3">
              {orders.map(o => (
                <div key={o.id} className="ui-card p-3">
                  <div className="flex justify-between items-center mb-2">
                    <strong>{o.orderNumber}</strong>
                    <span className={`ui-badge-${o.status === 'PENDING' ? 'warning' : o.status === 'PREPARING' ? 'info' : o.status === 'READY' ? 'success' : ''}`}>{o.status}</span>
                  </div>
                  <div className="ui-text-sm-muted mb-2">{o.terminalName || '-'}</div>
                  <div className="ui-hstack-2">
                    {o.status === 'PENDING' && <button className="ui-btn" onClick={() => updateOrderStatus(o.id, 'PREPARING')}>Start Prep</button>}
                    {o.status === 'PREPARING' && <button className="ui-btn" onClick={() => updateOrderStatus(o.id, 'READY')}>Mark Ready</button>}
                    {o.status === 'READY' && <button className="ui-btn" onClick={() => updateOrderStatus(o.id, 'SERVED')}>Mark Served</button>}
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="col-span-3 text-center p-4">No orders</p>}
            </div>
          </div>
        ) : (
          <div className="ui-card">
            <table className="ui-table">
              <thead><tr><th>Name</th><th>Code</th><th>Status</th><th>Terminals</th><th>Actions</th></tr></thead>
              <tbody>{loading ? <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr> : displays.map(d => (
                <tr key={d.id}><td>{d.name}</td><td>{d.code}</td><td><span className={`ui-badge-${d.status === 'ACTIVE' ? 'success' : ''}`}>{d.status}</span></td><td>{(d.terminalIds || []).length}</td>
                  <td className="ui-hstack-1"><button className="ui-btn-icon" onClick={() => viewKOrders(d.id)} title="View Orders"><Eye size={14} /></button><button className="ui-btn-icon" onClick={() => { setEditId(d.id); setForm(d); setShowModal(true); }}><Edit2 size={14} /></button><button className="ui-btn-icon ui-text-error" onClick={() => remove(d.id)}><Trash2 size={14} /></button></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Add'} Kitchen Display</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Code</label><input className="ui-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
