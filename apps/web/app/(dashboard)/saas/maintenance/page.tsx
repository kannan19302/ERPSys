'use client';
import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Eye, Trash2, Clock } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasMaintenancePage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduledStart: '', scheduledEnd: '', affectedServices: [] as string[] });
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const d = await client.get<any>('/saas/exp/maintenance-windows'); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { await client.post('/saas/exp/maintenance-windows', form); setShowModal(false); load(); } catch {} };
  const remove = async (id: string) => { try { await client.patch(`/saas/exp/maintenance-windows/${id}/status`, { status: 'CANCELLED' }); load(); } catch {} };
  const complete = async (id: string) => { try { await client.patch(`/saas/exp/maintenance-windows/${id}/status`, { status: 'COMPLETED' }); load(); } catch {} };
  return (
    <RouteGuard permission="saas.maintenance.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Wrench className="ui-text-primary" /> Maintenance Windows</h1><p className="ui-text-sm-muted">Schedule and manage maintenance windows.</p></div>
          <button className="ui-btn" onClick={() => setShowModal(true)}><Plus size={14} /> Schedule Maintenance</button>
        </div>
        <div className="card-grid-3">
          {loading ? <p>Loading...</p> : items.length === 0 ? <p className="ui-text-muted col-span-3">No maintenance windows scheduled.</p> : items.map(i => (
            <div key={i.id} className="ui-card p-4">
              <div className="flex items-center justify-between mb-3"><h3 className="font-bold">{i.title}</h3><span className={`ui-badge-${i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS' ? 'info' : i.status === 'COMPLETED' ? 'success' : ''}`}>{i.status || (i.isActive ? 'Active' : 'Completed')}</span></div>
              <p className="ui-text-sm-muted mb-2">{i.description}</p>
              <div className="flex items-center gap-2 text-sm mb-3"><Clock size={14} /> {i.scheduledStart ? new Date(i.scheduledStart).toLocaleString() : 'TBD'} - {i.scheduledEnd ? new Date(i.scheduledEnd).toLocaleString() : 'TBD'}</div>
              <div className="flex items-center gap-1 text-xs mb-3">{(i.affectedServices || []).map((s: string) => <span key={s} className="ui-badge">{s}</span>)}</div>
              <div className="ui-hstack-1">
                <button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/saas/exp/maintenance-windows/${i.id}`); alert(JSON.stringify(d, null, 2)); }}><Eye size={14} /></button>
                {i.status !== 'COMPLETED' && i.status !== 'CANCELLED' && <button className="ui-btn-secondary" onClick={() => complete(i.id)}>Complete</button>}
                <button className="ui-btn-icon ui-text-error" onClick={() => remove(i.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Schedule Maintenance</h2>
              <div className="ui-form-group"><label>Title</label><input className="ui-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="ui-form-group"><label>Description</label><textarea className="ui-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="ui-form-group"><label>Start</label><input type="datetime-local" className="ui-input" value={form.scheduledStart} onChange={e => setForm({ ...form, scheduledStart: e.target.value })} /></div>
              <div className="ui-form-group"><label>End</label><input type="datetime-local" className="ui-input" value={form.scheduledEnd} onChange={e => setForm({ ...form, scheduledEnd: e.target.value })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Schedule</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
