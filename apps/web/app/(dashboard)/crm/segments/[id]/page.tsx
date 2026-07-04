'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent } from '@unerp/ui';
import { ArrowLeft, RefreshCw, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiSend } from '../../_components/api';

interface Segment {
  id: string;
  name: string;
  description?: string | null;
  entity: 'CUSTOMER' | 'LEAD' | 'CONTACT';
  criteria: { logic: 'AND' | 'OR'; rules: Array<{ field: string; op: string; value: string }> };
  memberCount?: number;
  updatedAt?: string;
}
interface Member {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  company?: string | null;
}

export default function SegmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [segment, setSegment] = useState<Segment | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [seg, mem] = await Promise.all([
        apiGet<Segment>(`/crm/segments/${id}`),
        apiGet<Member[]>(`/crm/segments/${id}/members`),
      ]);
      setSegment(seg);
      setMembers(Array.isArray(mem) ? mem : []);
      setError(null);
    } catch { setError('Could not load segment.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await apiSend(`/crm/segments/${id}/refresh`, 'POST');
      const mem = await apiGet<Member[]>(`/crm/segments/${id}/members`);
      setMembers(Array.isArray(mem) ? mem : []);
      setFlash('Segment membership refreshed.');
      setTimeout(() => setFlash(null), 3000);
    } catch { setError('Refresh failed.'); }
    finally { setRefreshing(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  if (!segment) return <div style={{ padding: 'var(--space-6)' }}>Segment not found.</div>;

  const label = (m: Member) => m.name || `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email || m.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title={segment.name}
        description={segment.description || 'Segment detail'}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Segments', href: '/crm/segments' }, { label: segment.name }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link href="/crm/segments"><Button variant="outline" size="sm"><ArrowLeft size={14} /> Back</Button></Link>
            <ProtectedComponent permission="crm.segments.update">
              <Button variant="primary" size="sm" onClick={refresh} disabled={refreshing}>
                <RefreshCw size={14} /> {refreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            </ProtectedComponent>
          </div>
        }
      />

      {flash && <div style={{ padding: 'var(--space-3)', background: 'var(--color-success-light, #ecfdf5)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{flash}</div>}
      {error && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Definition</h4>
          <div style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div><span style={{ color: 'var(--color-text-secondary)' }}>Entity:</span> <Badge>{segment.entity}</Badge></div>
            <div><span style={{ color: 'var(--color-text-secondary)' }}>Match:</span> {segment.criteria.logic}</div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Rules:</div>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                {segment.criteria.rules.map((r, i) => (
                  <li key={i} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 'var(--text-xs)' }}>
                    {r.field} {r.op} {r.value}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
              Total members: <strong>{members.length}</strong>
            </div>
          </div>
        </Card>

        <Card padding="none">
          {members.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              <Users size={40} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>No members yet. Click Refresh to re-evaluate.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Company</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{label(m)}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{m.email || '-'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{m.company || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
