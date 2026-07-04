'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Badge, Modal, Drawer, DataTable, type Column,
  FormField, Input, Select, Textarea, useToast,
} from '@unerp/ui';
import { Plus, Search, Target, DollarSign, TrendingUp, Layers } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  type: string;
  budget: number;
  actualCost: number;
  notes: string | null;
  leadCount: number;
  opportunityCount: number;
  wonCount: number;
  conversionRate: number;
  createdAt: string;
}

const STATUSES = ['ALL', 'PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const statusVariant = (s: string) => (s === 'ACTIVE' ? 'success' : s === 'COMPLETED' ? 'info' : s === 'CANCELLED' ? 'danger' : 'warning');

export default function CampaignsTab() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', status: 'PLANNED', type: 'EMAIL', budget: 0, actualCost: 0, notes: '', segmentId: '' });
  const [segments, setSegments] = useState<Array<{ id: string; name: string; entity: string; memberCount?: number }>>([]);

  useEffect(() => {
    fetch('/api/v1/crm/segments', { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setSegments(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setSegments([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeaders = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}` });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/crm/campaigns', { headers: authHeaders() });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const d = await res.json();
      setCampaigns(Array.isArray(d) ? d : (d?.data || []));
    } catch (err) {
      toast.error('Could not load campaigns', err instanceof Error ? err.message : 'Please try again.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => setForm({ name: '', status: 'PLANNED', type: 'EMAIL', budget: 0, actualCost: 0, notes: '', segmentId: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ...form, budget: Number(form.budget), actualCost: Number(form.actualCost), notes: form.notes || undefined, segmentId: form.segmentId || undefined }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      toast.success('Campaign created', `"${form.name}" has been registered.`);
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error('Could not create campaign', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = campaigns.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
    return matchesSearch && (statusFilter === 'ALL' || c.status === statusFilter);
  });

  const totalBudget = campaigns.reduce((a, c) => a + c.budget, 0);
  const totalSpend = campaigns.reduce((a, c) => a + c.actualCost, 0);
  const avgConv = campaigns.length ? (campaigns.reduce((a, c) => a + c.conversionRate, 0) / campaigns.length).toFixed(2) : '0.00';

  const columns: Column<Campaign>[] = [
    { key: 'name', header: 'Campaign', render: (c) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{c.name}</span> },
    { key: 'type', header: 'Type', render: (c) => <Badge variant="default">{c.type}</Badge> },
    { key: 'status', header: 'Status', render: (c) => <Badge variant={statusVariant(c.status)}>{c.status}</Badge> },
    { key: 'budget', header: 'Budget', align: 'right', render: (c) => `$${c.budget.toLocaleString()}` },
    { key: 'actualCost', header: 'Spend', align: 'right', render: (c) => `$${c.actualCost.toLocaleString()}` },
    { key: 'leadCount', header: 'Leads / Won', align: 'center', render: (c) => <><b>{c.leadCount}</b> <span style={{ color: 'var(--color-text-secondary)' }}>/ {c.wonCount}</span></> },
    { key: 'conversionRate', header: 'Conv.', align: 'right', render: (c) => <span style={{ color: 'var(--color-success-text)', fontWeight: 'var(--weight-bold)' }}>{c.conversionRate}%</span> },
  ];

  const kpis = [
    { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, icon: <DollarSign size={22} />, color: 'var(--color-primary)' },
    { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, icon: <Layers size={22} />, color: 'var(--color-warning)' },
    { label: 'Avg Conversion', value: `${avgConv}%`, icon: <TrendingUp size={22} />, color: 'var(--color-success)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Campaign</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        {kpis.map((k) => (
          <Card key={k.label} style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-sunken)', color: k.color }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-medium)' }}>{k.label}</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 2 }}>{k.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <Input placeholder="Search campaigns…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer',
                border: '1px solid var(--color-border)', background: statusFilter === s ? 'var(--color-primary)' : 'var(--color-bg-elevated)', color: statusFilter === s ? 'var(--color-primary-text)' : 'var(--color-text)',
              }}>{s}</button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey={(c) => c.id}
          onRowClick={setSelected}
          emptyIcon={<Target size={40} />}
          emptyTitle="No campaigns found"
          emptyMessage="Create a campaign to attribute leads and compute conversion rates."
        />
      </Card>

      {/* Detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Campaign Details">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>{selected.name}</div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
                <Badge variant="default">{selected.type}</Badge>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {[['Budget', `$${selected.budget.toLocaleString()}`], ['Actual Cost', `$${selected.actualCost.toLocaleString()}`], ['Leads', selected.leadCount], ['Closed Won', selected.wonCount]].map(([l, v]) => (
                <div key={l as string} style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{v}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{l}</div>
                </div>
              ))}
            </div>
            {selected.notes && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>{selected.notes}</p>}
          </div>
        )}
      </Drawer>

      {/* Create modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Plan Marketing Campaign"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Registering…' : 'Plan Campaign'}</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Campaign Name" required>
            <Input required placeholder="e.g. Autumn Sourcing Drive" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Channel Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="EMAIL">Email Blast</option>
                <option value="SOCIAL">Social Media</option>
                <option value="SEARCH">Search Engine Ads</option>
                <option value="COLD_CALL">Outbound Calls</option>
                <option value="EVENT">Trade Show / Event</option>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.filter((s) => s !== 'ALL').map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Budget ($)">
              <Input type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            </FormField>
            <FormField label="Actual Spend ($)">
              <Input type="number" min={0} value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: Number(e.target.value) })} />
            </FormField>
          </div>
          <FormField label="Target Segment">
            <Select value={form.segmentId} onChange={(e) => setForm({ ...form, segmentId: e.target.value })}>
              <option value="">— All records (no segment) —</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.entity}{typeof s.memberCount === 'number' ? ` · ${s.memberCount}` : ''})</option>)}
            </Select>
          </FormField>
          <FormField label="Notes / Brief">
            <Textarea rows={3} placeholder="Goal, target demographics, etc." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
