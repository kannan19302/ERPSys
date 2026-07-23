'use client';
import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasExpDomainsPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ domain: '', isPrimary: false });
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const d = await client.get<any>('/saas/exp/domains'); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const save = async () => { try { await client.post('/saas/exp/domains', form); setShowModal(false); load(); } catch {} };
  const remove = async (id: string) => { try { await client.delete(`/saas/exp/domains/${id}`); load(); } catch {} };
  const verify = async (id: string) => { try { await client.post(`/saas/exp/domains/${id}/verify`, {}); load(); } catch {} };
  return (
    <RouteGuard permission="saas.domain.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Globe className="ui-text-primary" /> Custom Domains</h1><p className="ui-text-sm-muted">Manage custom domains.</p></div>
          <button className="ui-btn" onClick={() => setShowModal(true)}><Plus size={14} /> Add Domain</button>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Domain</th><th>Primary</th><th>SSL Status</th><th>Verified</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.domain}</td><td>{i.isPrimary ? <span className="ui-badge-success">Primary</span> : 'No'}</td><td><span className={`ui-badge-${i.sslStatus === 'ACTIVE' ? 'success' : i.sslStatus === 'FAILED' ? 'error' : 'info'}`}>{i.sslStatus}</span></td><td>{i.isVerified ? <span className="ui-badge-success">Yes</span> : <span className="ui-badge">No</span>}</td>
                <td className="ui-hstack-1">{!i.isVerified && <button className="ui-btn-icon" onClick={() => verify(i.id)}>Verify</button>}<button className="ui-btn-icon ui-text-error" onClick={() => remove(i.id)}><Trash2 size={14} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Custom Domain</h2>
              <div className="ui-form-group"><label>Domain</label><input className="ui-input" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} /> Set as primary</label>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={save}>Save</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
