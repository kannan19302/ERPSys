'use client';
import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasAnnouncementsPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', severity: 'INFO', targetTenantId: '', startsAt: '', endsAt: '' });
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const d = await client.get<any>('/saas/exp/announcements'); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { if (editId) { await client.put(`/saas/exp/announcements/${editId}`, form); } else { await client.post('/saas/exp/announcements', form); } setShowModal(false); setEditId(null); load(); } catch {} };
  const remove = async (id: string) => { try { await client.delete(`/saas/exp/announcements/${id}`); load(); } catch {} };
  return (
    <RouteGuard permission="saas.admin.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Megaphone className="ui-text-primary" /> Announcements</h1><p className="ui-text-sm-muted">Broadcast messages to all or specific tenants.</p></div>
          <button className="ui-btn" onClick={() => { setEditId(null); setForm({ title: '', content: '', severity: 'INFO', targetTenantId: '', startsAt: '', endsAt: '' }); setShowModal(true); }}><Plus size={14} /> New Announcement</button>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Title</th><th>Severity</th><th>Target</th><th>Schedule</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.title}</td><td><span className={`ui-badge-${i.severity === 'CRITICAL' ? 'error' : i.severity === 'WARNING' ? 'warning' : 'info'}`}>{i.severity}</span></td><td>{i.targetTenantId || 'All tenants'}</td><td>{i.startsAt ? `${new Date(i.startsAt).toLocaleDateString()} - ${i.endsAt ? new Date(i.endsAt).toLocaleDateString() : 'No end'}` : 'Immediate'}</td>
                <td className="ui-hstack-1"><button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/saas/exp/announcements/${i.id}`); alert(JSON.stringify(d, null, 2)); }}><Eye size={14} /></button><button className="ui-btn-icon" onClick={() => { setEditId(i.id); setForm(i); setShowModal(true); }}><Edit2 size={14} /></button><button className="ui-btn-icon ui-text-error" onClick={() => remove(i.id)}><Trash2 size={14} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'New'} Announcement</h2>
              <div className="ui-form-group"><label>Title</label><input className="ui-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="ui-form-group"><label>Content</label><textarea className="ui-input" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
              <select className="ui-input" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}><option>INFO</option><option>WARNING</option><option>CRITICAL</option></select>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
