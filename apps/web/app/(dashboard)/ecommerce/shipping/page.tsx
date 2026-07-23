'use client';
import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function EcommerceShippingPage() {
  const client = useApiClient(); const [zones, setZones] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(''); const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [showRateModal, setShowRateModal] = useState(false); const [rateForm, setRateForm] = useState({ zoneId: '', name: '', type: 'FLAT', baseRate: 0, perUnitRate: 0 });
  const [form, setForm] = useState({ name: '', description: '', countries: [] as string[], regions: [] as string[], sortOrder: 0 });
  useEffect(() => { if (storeId) load(); }, [storeId]);
  const load = async () => { setLoading(true); try { const d = await client.get<any>(`/ecommerce/exp/${storeId}/shipping-zones`); setZones(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { if (editId) { await client.put(`/ecommerce/exp/shipping-zones/${editId}`, form); } else { await client.post(`/ecommerce/exp/${storeId}/shipping-zones`, form); } setShowModal(false); setEditId(null); load(); } catch {} };
  const saveRate = async () => { try { await client.post('/ecommerce/exp/shipping-rates', rateForm); setShowRateModal(false); load(); } catch {} };
  return (
    <RouteGuard permission="ecommerce.storefront.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Truck className="ui-text-primary" /> Shipping Zones</h1><p className="ui-text-sm-muted">Configure shipping zones and rates.</p></div>
          <div className="ui-hstack-2"><input className="ui-input" placeholder="Store ID" value={storeId} onChange={e => setStoreId(e.target.value)} /><button className="ui-btn" disabled={!storeId} onClick={() => { setEditId(null); setForm({ name: '', description: '', countries: [], regions: [], sortOrder: 0 }); setShowModal(true); }}><Plus size={14} /> Add Zone</button></div>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Name</th><th>Countries</th><th>Rates</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr> : zones.map(z => (
              <tr key={z.id}><td>{z.name}</td><td>{(z.countries || []).join(', ') || 'All'}</td><td>{(z.rates || []).length} rates</td><td>{z.isActive ? <span className="ui-badge-success">Active</span> : <span className="ui-badge">Inactive</span>}</td>
                <td className="ui-hstack-1">
                  <button className="ui-btn-icon" onClick={() => { setRateForm({ zoneId: z.id, name: '', type: 'FLAT', baseRate: 0, perUnitRate: 0 }); setShowRateModal(true); }} title="Add Rate">+Rate</button>
                  <button className="ui-btn-icon" onClick={() => { setEditId(z.id); setForm(z); setShowModal(true); }}><Edit2 size={14} /></button>
                </td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Add'} Shipping Zone</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Countries (comma separated)</label><input className="ui-input" value={form.countries.join(',')} onChange={e => setForm({ ...form, countries: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
        {showRateModal && (
          <div className="ui-modal-overlay" onClick={() => setShowRateModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Shipping Rate</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={rateForm.name} onChange={e => setRateForm({ ...rateForm, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Base Rate</label><input type="number" className="ui-input" value={rateForm.baseRate} onChange={e => setRateForm({ ...rateForm, baseRate: Number(e.target.value) })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={saveRate}>Save</button><button className="ui-btn-secondary" onClick={() => setShowRateModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
