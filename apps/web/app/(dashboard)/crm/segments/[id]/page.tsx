'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { ArrowLeft, RefreshCw, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiSend } from '../../_components/api';
import styles from './page.module.css';

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

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  if (!segment) return <div className="p-6">Segment not found.</div>;

  const label = (m: Member) => m.name || `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email || m.id;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title={segment.name}
        description={segment.description || 'Segment detail'}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Segments', href: '/crm/segments' }, { label: segment.name }]}
        actions={
          <div className="ui-flex ui-gap-2">
            <Link href="/crm/segments"><Button variant="outline" size="sm"><ArrowLeft size={14} /> Back</Button></Link>
            <ProtectedComponent permission="crm.segments.update">
              <Button variant="primary" size="sm" onClick={refresh} disabled={refreshing}>
                <RefreshCw size={14} /> {refreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            </ProtectedComponent>
          </div>
        }
      />

      {flash && <div className={styles.flash}>{flash}</div>}
      {error && (
        <div className={styles.alert}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <div className={styles.contentGrid}>
        <Card padding="md">
          <h4 className={styles.definitionTitle}>Definition</h4>
          <div className={styles.definition}>
            <div><span className="ui-text-muted">Entity:</span> <Badge>{segment.entity}</Badge></div>
            <div><span className="ui-text-muted">Match:</span> {segment.criteria.logic}</div>
            <div className={styles.rules}>
              <div className={styles.rulesLabel}>Rules:</div>
              <ul className={styles.ruleList}>
                {segment.criteria.rules.map((r, i) => (
                  <li key={i} className={styles.rule}>
                    {r.field} {r.op} {r.value}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.memberTotal}>
              Total members: <strong>{members.length}</strong>
            </div>
          </div>
        </Card>

        <Card padding="none">
          {members.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={40} className={styles.emptyIcon} />
              <p className="text-sm">No members yet. Click Refresh to re-evaluate.</p>
            </div>
          ) : (
            <ListPageTemplate
              columns={[
                { key: 'id', header: 'Name', render: (v, row) => label(row as any) },
                { key: 'email', header: 'Email', render: (v) => String(v || '-') },
                { key: 'company', header: 'Company', render: (v) => String(v || '-') },
              ] as ListColumn[]}
              data={members as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No members"
              emptyDescription="No members yet. Click Refresh to re-evaluate."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
