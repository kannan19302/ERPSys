'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Badge, DataTable, type Column, KPICard, Spinner } from '@unerp/ui';
import { HelpCircle, Plus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface CaseRow {
  id: string;
  caseNumber: string;
  subject: string;
  priority: string;
  status: string;
  channel: string;
  slaDeadline: string | null;
  createdAt: string;
  customer?: { id: string; name: string } | null;
}

interface SlaStatus {
  totalOpen: number;
  breached: number;
  atRisk: number;
  onTrack: number;
}

const API_BASE = 'http://localhost:3001/api/v1';

export default function CrmCasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [slaStatus, setSlaStatus] = useState<SlaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'MEDIUM', channel: 'EMAIL' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = useCallback(async () => {
    try {
      const [casesRes, slaRes] = await Promise.all([
        fetch(`${API_BASE}/crm/cases`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/crm/cases/sla-status`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (casesRes.ok) setCases(await casesRes.json());
      if (slaRes.ok) setSlaStatus(await slaRes.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/crm/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ subject: '', description: '', priority: 'MEDIUM', channel: 'EMAIL' });
        await fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isBreached = (slaDeadline: string | null, status: string) => {
    if (!slaDeadline || status === 'RESOLVED' || status === 'CLOSED') return false;
    return new Date(slaDeadline) < new Date();
  };

  const columns: Column<CaseRow>[] = [
    {
      key: 'caseNumber', header: 'Case',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)' }}>{row.subject}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.caseNumber}{row.customer ? ` · ${row.customer.name}` : ''}</div>
        </div>
      ),
    },
    { key: 'priority', header: 'Priority', render: (row) => <Badge variant={row.priority === 'URGENT' || row.priority === 'HIGH' ? 'danger' : 'default'}>{row.priority}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'RESOLVED' || row.status === 'CLOSED' ? 'success' : 'info'}>{row.status}</Badge> },
    { key: 'channel', header: 'Channel' },
    {
      key: 'slaDeadline', header: 'SLA Deadline',
      render: (row) => row.slaDeadline ? (
        <span style={{ color: isBreached(row.slaDeadline, row.status) ? 'var(--color-danger)' : 'var(--color-text)', fontWeight: isBreached(row.slaDeadline, row.status) ? 'var(--weight-bold)' : 'normal' }}>
          {isBreached(row.slaDeadline, row.status) && <AlertTriangle size={12} style={{ marginRight: 4, display: 'inline' }} />}
          {new Date(row.slaDeadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ) : '—',
    },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Customer Service Cases"
        description="Support ticketing with SLA response and resolution deadlines."
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Cases & SLA' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} style={{ marginRight: 6 }} /> New Case
          </Button>
        }
      />

      {slaStatus && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <KPICard title="Open Cases" value={slaStatus.totalOpen} icon={<HelpCircle size={20} />} color="var(--color-text-secondary)" />
          <KPICard title="SLA Breached" value={slaStatus.breached} icon={<AlertTriangle size={20} />} color="var(--color-danger)" />
          <KPICard title="At Risk (< 2h)" value={slaStatus.atRisk} icon={<Clock size={20} />} color="var(--color-warning)" />
          <KPICard title="On Track" value={slaStatus.onTrack} icon={<CheckCircle2 size={20} />} color="var(--color-success)" />
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <form onSubmit={createCase} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <input className="frappe-input" placeholder="Subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className="frappe-input" placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="frappe-grid-2">
              <select className="frappe-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <select className="frappe-input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="CHAT">Chat</option>
                <option value="WEB">Web</option>
                <option value="API">API</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Case'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card padding="none">
        <DataTable columns={columns} data={cases} rowKey={(r) => r.id} emptyTitle="No cases" emptyMessage="Log a customer service case to start tracking SLA compliance." emptyIcon={<HelpCircle size={48} />} />
      </Card>
    </div>
  );
}
