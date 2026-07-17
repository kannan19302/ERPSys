'use client';
import styles from './CampaignsTab.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Badge, Modal, Drawer, DataTable, type Column,
  FormField, Input, Select, Textarea, useToast,
} from '@unerp/ui';
import { Plus, Search, Target, DollarSign, TrendingUp, Layers } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
    client.get<any>('/crm/segments')
      .then((d) => setSegments(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setSegments([]));
  }, [client]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await client.get<any>('/crm/campaigns');
      setCampaigns(Array.isArray(d) ? d : (d?.data || []));
    } catch (err) {
      toast.error('Could not load campaigns', err instanceof Error ? err.message : 'Please try again.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [toast, client]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => setForm({ name: '', status: 'PLANNED', type: 'EMAIL', budget: 0, actualCost: 0, notes: '', segmentId: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/crm/campaigns', { 
        ...form, 
        budget: Number(form.budget), 
        actualCost: Number(form.actualCost), 
        notes: form.notes || undefined, 
        segmentId: form.segmentId || undefined 
      });
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
    { key: 'name', header: 'Campaign', render: (c) => <span className="font-semibold">{c.name}</span> },
    { key: 'type', header: 'Type', render: (c) => <Badge variant="default">{c.type}</Badge> },
    { key: 'status', header: 'Status', render: (c) => <Badge variant={statusVariant(c.status)}>{c.status}</Badge> },
    { key: 'budget', header: 'Budget', align: 'right', render: (c) => `$${c.budget.toLocaleString()}` },
    { key: 'actualCost', header: 'Spend', align: 'right', render: (c) => `$${c.actualCost.toLocaleString()}` },
    { key: 'leadCount', header: 'Leads / Won', align: 'center', render: (c) => <><b>{c.leadCount}</b> <span className="ui-text-muted">/ {c.wonCount}</span></> },
    { key: 'conversionRate', header: 'Conv.', align: 'right', render: (c) => <span className={styles.style0}>{c.conversionRate}%</span> },
  ];

  const kpis = [
    { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, icon: <DollarSign size={22} />, color: 'var(--color-primary)' },
    { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, icon: <Layers size={22} />, color: 'var(--color-warning)' },
    { label: 'Avg Conversion', value: `${avgConv}%`, icon: <TrendingUp size={22} />, color: 'var(--color-success)' },
  ];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Campaign</Button>
      </div>

      <div className={styles.style1}>
        {kpis.map((k) => (
          <Card key={k.label} className={styles.style2}>
            <div style={{ color: k.color }} className={styles.s1}>{k.icon}</div>
            <div>
              <div className={styles.style3}>{k.label}</div>
              <div className={styles.style4}>{k.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className={styles.style5}>
          <div className={styles.style6}>
            <Search size={16} className={styles.style7} />
            <Input placeholder="Search campaigns…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.style8} />
          </div>
          <div className="ui-flex ui-gap-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ background: statusFilter === s ? 'var(--color-primary)' : 'var(--color-bg-elevated)', color: statusFilter === s ? 'var(--color-primary-text)' : 'var(--color-text)' }} className={styles.s2}>{s}</button>
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
          <div className={styles.style9}>
            <div>
              <div className={styles.style10}>{selected.name}</div>
              <div className={styles.style11}>
                <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
                <Badge variant="default">{selected.type}</Badge>
              </div>
            </div>
            <div className="ui-grid-2 ui-gap-3">
              {[['Budget', `$${selected.budget.toLocaleString()}`], ['Actual Cost', `$${selected.actualCost.toLocaleString()}`], ['Leads', selected.leadCount], ['Closed Won', selected.wonCount]].map(([l, v]) => (
                <div key={l as string} className={styles.style12}>
                  <div className="text-2xl">{v}</div>
                  <div className="ui-text-xs-muted">{l}</div>
                </div>
              ))}
            </div>
            {selected.notes && <p className={styles.style13}>{selected.notes}</p>}
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
        <form onSubmit={handleCreate} className="ui-stack-4">
          <FormField label="Campaign Name" required>
            <Input required placeholder="e.g. Autumn Sourcing Drive" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <div className="ui-grid-2">
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
          <div className="ui-grid-2">
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
