'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Modal, TextField, Badge, StatusBadge, Tabs, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Plus, Search, TrendingUp } from 'lucide-react';

interface SupplyPlan {
  id: string; planName: string; planType: string; status: string; description: string | null;
  planningHorizon: number; startDate: string | null; endDate: string | null; demandSource: string | null;
  approvedBy: string | null; approvedAt: string | null; createdAt: string;
  _count?: { lines: number; scenarios: number };
}

export default function SupplyPlanningPage() {
  const client = useApiClient();
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState<SupplyPlan[]>([]);
  const [sopPlans, setSopPlans] = useState<any[]>([]);
  const [demandRuns, setDemandRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ planName: '', planType: 'TACTICAL', planningHorizon: 12, description: '' });
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, d] = await Promise.all([
        client.get<SupplyPlan[]>('/supply-chain/supply-plans').catch(() => []),
        client.get<any[]>('/supply-chain/sop-plans').catch(() => []),
        client.get<any[]>('/supply-chain/demand-sense-runs').catch(() => []),
      ]);
      setPlans(p); setSopPlans(s); setDemandRuns(d);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.planName) return;
    setCreating(true);
    try {
      await client.post('/supply-chain/supply-plans', form);
      setCreateOpen(false); fetchAll();
    } catch { /* empty */ }
    finally { setCreating(false); }
  };

  const planColumns: Column<SupplyPlan>[] = [
    { key: 'planName', header: 'Plan Name' },
    { key: 'planType', header: 'Type', render: (r) => <Badge>{r.planType}</Badge> },
    { key: 'planningHorizon', header: 'Horizon (mo)' },
    { key: 'lines', header: 'Lines', render: (r) => r._count?.lines ?? 0 },
    { key: 'scenarios', header: 'Scenarios', render: (r) => r._count?.scenarios ?? 0 },
    { key: 'approvedBy', header: 'Approved By' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: 'Created', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const sopColumns: Column<any>[] = [
    { key: 'planName', header: 'Plan Name' },
    { key: 'fiscalYear', header: 'Fiscal Year' },
    { key: 'period', header: 'Period' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <div className="ui-page"><PageHeader title="Supply Planning" /><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div></div>;

  return (
    <div className="ui-page">
      <PageHeader title="Supply Planning" description="Demand sensing, supply plans, and S&OP"
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Supply Plan</Button>} />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab}
        tabs={[{ id: 'plans', label: `Supply Plans (${plans.length})` }, { id: 'sop', label: `S&OP Plans (${sopPlans.length})` }, { id: 'demand', label: `Demand Runs (${demandRuns.length})` }]} />
      <Card>
        {activeTab === 'plans' && <DataTable columns={planColumns} data={plans} rowKey={r => r.id}
          emptyTitle="No supply plans" emptyIcon={<TrendingUp size={48} />} />}
        {activeTab === 'sop' && <DataTable columns={sopColumns} data={sopPlans} rowKey={r => r.id}
          emptyTitle="No S&OP plans" />}
        {activeTab === 'demand' && <DataTable columns={[{ key: 'name', header: 'Run Name' }, { key: 'runType', header: 'Type' }, { key: 'algorithm', header: 'Algorithm' }, { key: 'horizonMonths', header: 'Horizon' }, { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> }, { key: 'createdAt', header: 'Created', render: (r: any) => new Date(r.createdAt).toLocaleDateString() }]} data={demandRuns} rowKey={r => r.id}
          emptyTitle="No demand sensing runs" />}
      </Card>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Supply Plan" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField label="Plan Name" required value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} />
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <TextField label="Planning Horizon (months)" type="number" value={form.planningHorizon} onChange={e => setForm({ ...form, planningHorizon: parseInt(e.target.value) || 12 })} />
        </form>
      </Modal>
    </div>
  );
}
