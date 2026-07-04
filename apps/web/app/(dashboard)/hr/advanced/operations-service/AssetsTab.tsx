'use client';

import React, { useState, useEffect } from 'react';
import { Card, StatusBadge, Button, Modal, FormField, Input, Select, useToast } from '@unerp/ui';
import { Plus } from 'lucide-react';

interface Asset { id: string; employeeId: string; assetType: string; assetName: string; serialNumber: string | null; assignedDate: string; status: string; }

export default function AssetsTab() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', assetType: 'LAPTOP', assetName: '', serialNumber: '' });
  const toast = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token') || '';
    try {
      const [assetsRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/assets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (assetsRes.ok) setAssets(await assetsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (empRes.ok) setEmployees(await empRes.json());
    } catch {}
  };

  const assignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch('/api/v1/advanced-hr/assets', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (res.ok) { toast.success('Asset assigned'); setForm({ employeeId: '', assetType: 'LAPTOP', assetName: '', serialNumber: '' }); setShowForm(false); fetchData(); }
    } catch { toast.error('Error assigning asset'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => setShowForm(true)}><Plus size={14} /> Assign Asset</Button>
      </div>
      <Card padding="none" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}><th style={{ padding: 'var(--space-4)' }}>Asset</th><th style={{ padding: 'var(--space-4)' }}>Type</th><th style={{ padding: 'var(--space-4)' }}>Serial</th><th style={{ padding: 'var(--space-4)' }}>Assigned</th><th style={{ padding: 'var(--space-4)' }}>Status</th></tr></thead>
          <tbody>{assets.map(a => (<tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: 'var(--space-4)' }}>{a.assetName}</td><td style={{ padding: 'var(--space-4)' }}>{a.assetType}</td><td style={{ padding: 'var(--space-4)' }}>{a.serialNumber || '--'}</td><td style={{ padding: 'var(--space-4)' }}>{new Date(a.assignedDate).toLocaleDateString()}</td><td style={{ padding: 'var(--space-4)' }}><StatusBadge status={a.status} /></td></tr>))}</tbody>
        </table>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Assign Asset"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button variant="primary" onClick={assignAsset as any}>Assign</Button></>}
      >
        <form onSubmit={assignAsset} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField label="Employee" required>
            <Select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required>
              <option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </Select>
          </FormField>
          <FormField label="Asset Type">
            <Select value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value })}>
              <option value="LAPTOP">Laptop</option><option value="PHONE">Phone</option><option value="BADGE">Badge</option><option value="FURNITURE">Furniture</option><option value="VEHICLE">Vehicle</option>
            </Select>
          </FormField>
          <FormField label="Asset Name" required>
            <Input placeholder="Asset Name" value={form.assetName} onChange={e => setForm({ ...form, assetName: e.target.value })} required />
          </FormField>
          <FormField label="Serial Number">
            <Input placeholder="Serial Number (optional)" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
