'use client';

import React, { useState, useEffect } from 'react';
import { Card, StatusBadge, Button, Modal, FormField, Input, Select, useToast } from '@unerp/ui';
import { Plus } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './AssetsTab.module.css';

interface Asset { id: string; employeeId: string; assetType: string; assetName: string; serialNumber: string | null; assignedDate: string; status: string; }

export default function AssetsTab() {
  const client = useApiClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', assetType: 'LAPTOP', assetName: '', serialNumber: '' });
  const toast = useToast();

  useEffect(() => { fetchData(); }, [client]);

  const fetchData = async () => {
    try {
      const [assetsData, employeesData] = await Promise.all([
        client.get<Asset[] | { data?: Asset[] }>('/advanced-hr/assets'),
        client.get<Array<{ id: string; firstName: string; lastName: string }> | { data?: Array<{ id: string; firstName: string; lastName: string }> }>('/hr/employees'),
      ]);
      setAssets(Array.isArray(assetsData) ? assetsData : (assetsData.data || []));
      setEmployees(Array.isArray(employeesData) ? employeesData : (employeesData.data || []));
    } catch {}
  };

  const assignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/advanced-hr/assets', form);
      toast.success('Asset assigned'); setForm({ employeeId: '', assetType: 'LAPTOP', assetName: '', serialNumber: '' }); setShowForm(false); fetchData();
    } catch { toast.error('Error assigning asset'); }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setShowForm(true)}><Plus size={14} /> Assign Asset</Button>
      </div>
      <Card padding="none" className="builder-table-wrapper">
        <table className={styles.s0}>
          <thead><tr className={styles.s1}><th className="p-4">Asset</th><th className="p-4">Type</th><th className="p-4">Serial</th><th className="p-4">Assigned</th><th className="p-4">Status</th></tr></thead>
          <tbody>{assets.map(a => (<tr key={a.id} className="border-b"><td className="p-4">{a.assetName}</td><td className="p-4">{a.assetType}</td><td className="p-4">{a.serialNumber || '--'}</td><td className="p-4">{new Date(a.assignedDate).toLocaleDateString()}</td><td className="p-4"><StatusBadge status={a.status} /></td></tr>))}</tbody>
        </table>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Assign Asset"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button variant="primary" onClick={assignAsset as any}>Assign</Button></>}
      >
        <form onSubmit={assignAsset} className="ui-stack-3">
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

