'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Modal, TextField, Badge, KPICard } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Plus, BarChart3 } from 'lucide-react';

interface Kpi {
  id: string; warehouseId: string | null; kpiDate: string; linesPicked: number | null;
  linesPutaway: number | null; ordersShipped: number | null; ordersReceived: number | null;
  picksPerHour: number; putawayPerHour: number; orderAccuracyPct: number;
  totalLaborHours: number; activeWorkers: number | null; laborCostPerOrder: number;
}

export default function WarehouseKpisPage() {
  const client = useApiClient();
  const [data, setData] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await client.get('/inventory/warehouse-kpis')); }
    catch { /* empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await client.post('/inventory/warehouse-kpis', form);
      setCreateOpen(false); setForm({}); fetchData();
    } catch { /* empty */ }
    finally { setCreating(false); }
  };

  const avgPicks = data.length ? Math.round(data.reduce((s, k) => s + Number(k.picksPerHour || 0), 0) / data.length) : 0;
  const avgAccuracy = data.length ? Math.round(data.reduce((s, k) => s + Number(k.orderAccuracyPct || 0), 0) / data.length) : 0;
  const avgLabor = data.length ? (data.reduce((s, k) => s + Number(k.laborCostPerOrder || 0), 0) / data.length).toFixed(2) : '0';

  const columns: Column<Kpi>[] = [
    { key: 'kpiDate', header: 'Date', render: (r) => new Date(r.kpiDate).toLocaleDateString() },
    { key: 'linesPicked', header: 'Lines Picked' },
    { key: 'ordersShipped', header: 'Shipped' },
    { key: 'picksPerHour', header: 'Picks/hr', render: (r) => Number(r.picksPerHour || 0).toFixed(1) },
    { key: 'orderAccuracyPct', header: 'Accuracy %', render: (r) => `${Number(r.orderAccuracyPct || 0).toFixed(1)}%` },
    { key: 'activeWorkers', header: 'Workers' },
    { key: 'laborCostPerOrder', header: 'Cost/Order', render: (r) => `$${Number(r.laborCostPerOrder || 0).toFixed(2)}` },
  ];

  return (
    <div className="ui-page">
      <PageHeader title="Warehouse KPIs" description="Track warehouse performance metrics"
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Record KPI</Button>} />
      <div className="ui-grid-4" style={{ marginBottom: '1.5rem' }}>
        <KPICard title="Avg Picks/Hour" value={avgPicks} icon={<BarChart3 size={20} />} color="var(--primary-600)" />
        <KPICard title="Avg Accuracy" value={`${avgAccuracy}%`} icon={<BarChart3 size={20} />} color="var(--success-600)" />
        <KPICard title="Avg Cost/Order" value={`$${avgLabor}`} icon={<BarChart3 size={20} />} color="var(--warning-600)" />
        <KPICard title="Total Records" value={data.length} icon={<BarChart3 size={20} />} color="var(--info-600)" />
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} rowKey={r => r.id}
          emptyTitle="No KPIs recorded" emptyMessage="Record your first warehouse KPI snapshot." emptyIcon={<BarChart3 size={48} />} />
      </Card>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Record KPI" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Saving...' : 'Save'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField label="Lines Picked" type="number" value={form.linesPicked || ''} onChange={e => setForm({ ...form, linesPicked: parseInt(e.target.value) || 0 })} />
          <TextField label="Orders Shipped" type="number" value={form.ordersShipped || ''} onChange={e => setForm({ ...form, ordersShipped: parseInt(e.target.value) || 0 })} />
          <TextField label="Picks Per Hour" type="number" step="0.1" value={form.picksPerHour || ''} onChange={e => setForm({ ...form, picksPerHour: parseFloat(e.target.value) || 0 })} />
          <TextField label="Order Accuracy %" type="number" step="0.1" value={form.orderAccuracyPct || ''} onChange={e => setForm({ ...form, orderAccuracyPct: parseFloat(e.target.value) || 0 })} />
          <TextField label="Active Workers" type="number" value={form.activeWorkers || ''} onChange={e => setForm({ ...form, activeWorkers: parseInt(e.target.value) || 0 })} />
        </form>
      </Modal>
    </div>
  );
}
