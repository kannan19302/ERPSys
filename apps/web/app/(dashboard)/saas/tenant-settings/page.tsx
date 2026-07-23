'use client';
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasTenantSettingsPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [settingForm, setSettingForm] = useState({ category: 'general', key: '', value: '' });
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const d = await client.get<any>('/saas/exp/tenant-settings'); setItems(Array.isArray(d) ? d : []); } catch {} setLoading(false); };
  const saveSetting = async () => { try { await client.post('/saas/exp/tenant-settings', settingForm); setSettingForm({ category: 'general', key: '', value: '' }); load(); } catch {} };
  return (
    <RouteGuard permission="saas.tenant-settings.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Settings className="ui-text-primary" /> Tenant Settings</h1><p className="ui-text-sm-muted">Manage configuration settings.</p></div>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Category</th><th>Key</th><th>Value</th><th>Updated</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.category || '-'}</td><td><code>{i.key}</code></td><td className="max-w-md truncate">{typeof i.value === 'object' ? JSON.stringify(i.value) : String(i.value)}</td><td>{new Date(i.updatedAt).toLocaleString()}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="ui-card p-4">
          <h3 className="mb-3">Add / Update Setting</h3>
          <div className="ui-hstack-2"><input className="ui-input" placeholder="Category" value={settingForm.category} onChange={e => setSettingForm({ ...settingForm, category: e.target.value })} /><input className="ui-input" placeholder="Key" value={settingForm.key} onChange={e => setSettingForm({ ...settingForm, key: e.target.value })} /><input className="ui-input" placeholder="Value" value={settingForm.value} onChange={e => setSettingForm({ ...settingForm, value: e.target.value })} /><button className="ui-btn" onClick={saveSetting}>Save</button></div>
        </div>
      </div>
    </RouteGuard>
  );
}
