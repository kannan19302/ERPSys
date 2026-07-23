'use client';
import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function EcommerceTaxPage() {
  const client = useApiClient(); const [classes, setClasses] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(''); const [showClassModal, setShowClassModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [classForm, setClassForm] = useState({ name: '', description: '', isDefault: false });
  const [rateForm, setRateForm] = useState({ classId: '', name: '', rate: 0, country: '', region: '', priority: 10 });
  useEffect(() => { if (storeId) load(); }, [storeId]);
  const load = async () => { setLoading(true); try { const d = await client.get<any>(`/ecommerce/exp/${storeId}/tax-classes`); setClasses(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const saveClass = async () => { try { await client.post(`/ecommerce/exp/${storeId}/tax-classes`, classForm); setShowClassModal(false); load(); } catch {} };
  const saveRate = async () => { try { await client.post('/ecommerce/exp/tax-rates', rateForm); setShowRateModal(false); load(); } catch {} };
  const delRate = async (id: string) => { try { await client.delete(`/ecommerce/exp/tax-rates/${id}`); load(); } catch {} };
  return (
    <RouteGuard permission="ecommerce.storefront.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Calculator className="ui-text-primary" /> Tax Configuration</h1><p className="ui-text-sm-muted">Manage tax classes and rates.</p></div>
          <div className="ui-hstack-2"><input className="ui-input" placeholder="Store ID" value={storeId} onChange={e => setStoreId(e.target.value)} /><button className="ui-btn" disabled={!storeId} onClick={() => { setClassForm({ name: '', description: '', isDefault: false }); setShowClassModal(true); }}><Plus size={14} /> Add Class</button></div>
        </div>
        {classes.map(c => (
          <div key={c.id} className="ui-card p-4">
            <div className="flex justify-between items-center mb-3"><h3>{c.name} {c.isDefault && <span className="ui-badge-success ml-2">Default</span>}</h3><button className="ui-btn" onClick={() => { setRateForm({ classId: c.id, name: '', rate: 0, country: '', region: '', priority: 10 }); setShowRateModal(true); }}>+ Rate</button></div>
            <table className="ui-table">
              <thead><tr><th>Name</th><th>Rate</th><th>Country</th><th>Region</th><th>Priority</th><th>Actions</th></tr></thead>
              <tbody>{(c.rates || []).map((r: any) => (
                <tr key={r.id}><td>{r.name}</td><td>{r.rate}%</td><td>{r.country || 'All'}</td><td>{r.region || 'All'}</td><td>{r.priority}</td><td><button className="ui-btn-icon ui-text-error" onClick={() => delRate(r.id)}><Trash2 size={14} /></button></td></tr>
              ))}</tbody>
            </table>
          </div>
        ))}
        {showClassModal && (
          <div className="ui-modal-overlay" onClick={() => setShowClassModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Tax Class</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={saveClass}>Save</button><button className="ui-btn-secondary" onClick={() => setShowClassModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
        {showRateModal && (
          <div className="ui-modal-overlay" onClick={() => setShowRateModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Tax Rate</h2>
              <div className="ui-form-group"><label>Name</label><input className="ui-input" value={rateForm.name} onChange={e => setRateForm({ ...rateForm, name: e.target.value })} /></div>
              <div className="ui-form-group"><label>Rate (%)</label><input type="number" step="0.01" className="ui-input" value={rateForm.rate} onChange={e => setRateForm({ ...rateForm, rate: Number(e.target.value) })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={saveRate}>Save</button><button className="ui-btn-secondary" onClick={() => setShowRateModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
