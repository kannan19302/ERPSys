'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, PageHeader, Spinner, Button, Badge } from '@unerp/ui';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiGet } from '../../_components/api';

interface CaseDetail {
  id: string;
  caseNumber: string;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  channel: string;
  slaFirstResponseBy?: string | null;
  slaResolveBy?: string | null;
  slaBreached?: boolean;
  firstRespondedAt?: string | null;
  createdAt: string;
  customer?: { id: string; name: string } | null;
}

function TimeLeft({ deadline, label }: { deadline?: string | null; label: string }) {
  if (!deadline) return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
    </div>
  );
  const remainingMs = new Date(deadline).getTime() - Date.now();
  const overdue = remainingMs < 0;
  const hoursLeft = remainingMs / (1000 * 60 * 60);
  const color = overdue ? 'var(--color-danger)' : hoursLeft <= 4 ? 'var(--color-warning)' : 'var(--color-success)';
  const text = overdue
    ? `Overdue by ${Math.abs(Math.round(hoursLeft))}h`
    : hoursLeft >= 24 ? `${Math.round(hoursLeft / 24)}d left` : `${Math.max(0, Math.round(hoursLeft))}h left`;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ color, fontWeight: 'var(--weight-semibold)' }}>
        {new Date(deadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {text}
      </span>
    </div>
  );
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<CaseDetail>(`/crm/cases/${id}`);
        setRecord(data);
      } catch { setError('Could not load case.'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  if (error || !record) return <div style={{ padding: 'var(--space-6)', color: 'var(--color-danger)' }}>{error || 'Case not found.'}</div>;

  const isBreached = record.slaBreached
    ?? (record.slaResolveBy && new Date(record.slaResolveBy) < new Date() && record.status !== 'RESOLVED' && record.status !== 'CLOSED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title={record.subject}
        description={`${record.caseNumber}${record.customer ? ` · ${record.customer.name}` : ''}`}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Cases', href: '/crm/cases' }, { label: record.caseNumber }]}
        actions={<Link href="/crm/cases"><Button variant="outline" size="sm"><ArrowLeft size={14} /> Back</Button></Link>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <Badge variant={record.priority === 'URGENT' || record.priority === 'HIGH' ? 'danger' : 'default'}>{record.priority}</Badge>
            <Badge variant={record.status === 'RESOLVED' || record.status === 'CLOSED' ? 'success' : 'info'}>{record.status}</Badge>
            <Badge>{record.channel}</Badge>
          </div>
          <h4 style={{ margin: '0 0 var(--space-2)' }}>Description</h4>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {record.description || 'No description provided.'}
          </p>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Clock size={16} /> SLA
            </h4>
            {isBreached ? (
              <Badge variant="danger"><AlertTriangle size={10} style={{ marginRight: 2 }} /> Breached</Badge>
            ) : (
              <Badge variant="success"><CheckCircle2 size={10} style={{ marginRight: 2 }} /> On Track</Badge>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <TimeLeft label="First Response by" deadline={record.slaFirstResponseBy} />
            <TimeLeft label="Resolve by" deadline={record.slaResolveBy} />
            {record.firstRespondedAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>First responded</span>
                <span>{new Date(record.firstRespondedAt).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Opened</span>
              <span>{new Date(record.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
