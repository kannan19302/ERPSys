'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Modal, TextField, Badge, StatusBadge, Tabs, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Plus, Truck, Search } from 'lucide-react';
import Link from 'next/link';

interface LoadBuild {
  id: string; buildNumber: string; loadType: string; status: string; carrierName: string | null;
  transportMode: string | null; originName: string | null; destName: string | null;
  vehicleNumber: string | null; driverName: string | null; estimatedCost: number | null;
  scheduledPickup: string | null; scheduledDelivery: string | null; actualPickup: string | null;
  actualDelivery: string | null; bolNumber: string | null; createdAt: string;
}

interface Appointment {
  id: string; appointmentNumber: string; appointmentType: string; status: string;
  carrierName: string | null; warehouseId: string | null; dockDoor: string | null;
  scheduledStart: string; scheduledEnd: string | null; driverName: string | null;
}

export default function LogisticsPage() {
  const client = useApiClient();
  const [activeTab, setActiveTab] = useState('loads');
  const [loads, setLoads] = useState<LoadBuild[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<any>({ loadType: 'OUTBOUND', carrierName: '', originName: '', destName: '', notes: '' });
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [l, a, p] = await Promise.all([
        client.get<{ data: LoadBuild[] }>('/supply-chain/load-builds').catch(() => ({ data: [] })),
        client.get<{ data: Appointment[] }>('/supply-chain/appointments').catch(() => ({ data: [] })),
        client.get<{ data: any[] }>('/supply-chain/delivery-confirmations').catch(() => ({ data: [] })),
      ]);
      setLoads(l.data || []); setAppts(a.data || []); setPods(p.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await client.post('/supply-chain/load-builds', { ...form, stops: [], items: [] });
      setCreateOpen(false); fetchAll();
    } catch { /* empty */ }
    finally { setCreating(false); }
  };

  const loadColumns: Column<LoadBuild>[] = [
    { key: 'buildNumber', header: 'Load #', render: (r) => <span className="ui-link">{r.buildNumber}</span> },
    { key: 'loadType', header: 'Type', render: (r) => <Badge>{r.loadType}</Badge> },
    { key: 'carrierName', header: 'Carrier' },
    { key: 'originName', header: 'Origin' },
    { key: 'destName', header: 'Destination' },
    { key: 'estimatedCost', header: 'Est. Cost', render: (r) => r.estimatedCost ? `$${Number(r.estimatedCost).toLocaleString()}` : '—' },
    { key: 'bolNumber', header: 'BOL' },
    { key: 'scheduledPickup', header: 'Pickup', render: (r) => r.scheduledPickup ? new Date(r.scheduledPickup).toLocaleDateString() : '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const apptColumns: Column<Appointment>[] = [
    { key: 'appointmentNumber', header: 'Appt #' },
    { key: 'appointmentType', header: 'Type', render: (r) => <Badge>{r.appointmentType}</Badge> },
    { key: 'carrierName', header: 'Carrier' },
    { key: 'dockDoor', header: 'Door' },
    { key: 'scheduledStart', header: 'Start', render: (r) => new Date(r.scheduledStart).toLocaleString() },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <div className="ui-page"><PageHeader title="Logistics Execution" /><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div></div>;

  return (
    <div className="ui-page">
      <PageHeader title="Logistics Execution" description="Load builds, dock appointments, carrier rates, and delivery confirmations"
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Load Build</Button>} />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab}
        tabs={[{ id: 'loads', label: `Load Builds (${loads.length})` }, { id: 'appts', label: `Appointments (${appts.length})` }, { id: 'pods', label: `PODs (${pods.length})` }]} />
      <Card>
        {activeTab === 'loads' && <DataTable columns={loadColumns} data={loads} rowKey={r => r.id}
          emptyTitle="No load builds" emptyIcon={<Truck size={48} />} />}
        {activeTab === 'appts' && <DataTable columns={apptColumns} data={appts} rowKey={r => r.id}
          emptyTitle="No appointments" />}
        {activeTab === 'pods' && <DataTable columns={[{ key: 'confirmationNumber', header: 'POD #' }, { key: 'receivedBy', header: 'Received By' }, { key: 'carrierName', header: 'Carrier' }, { key: 'receivedAt', header: 'Received', render: (r: any) => new Date(r.receivedAt).toLocaleString() }]} data={pods} rowKey={r => r.id}
          emptyTitle="No delivery confirmations" />}
      </Card>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Load Build" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <div className="ui-grid-2">
            <TextField label="Carrier Name" value={form.carrierName} onChange={e => setForm({ ...form, carrierName: e.target.value })} />
            <TextField label="Origin" value={form.originName} onChange={e => setForm({ ...form, originName: e.target.value })} />
          </div>
          <TextField label="Destination" value={form.destName} onChange={e => setForm({ ...form, destName: e.target.value })} />
          <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
