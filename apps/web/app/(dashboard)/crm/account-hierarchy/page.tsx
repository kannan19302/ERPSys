'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast } from '@unerp/ui';
import { Building2, Search, Link2 } from 'lucide-react';
import { apiGet, apiPut, ApiRequestError } from '../../../../src/lib/api';

interface HierarchyResult {
  parent: { id: string; name: string } | null;
  current: { id: string; name: string };
  subsidiaries: Array<{ id: string; name: string; type: string }>;
}

interface RollupResult {
  accountCount: number;
  totalOpenPipeline: number;
  totalWonRevenue: number;
  openOpportunityCount: number;
  wonOpportunityCount: number;
  byAccount: Array<{ customerId: string; name: string; openPipeline: number; wonRevenue: number }>;
}

export default function AccountHierarchyPage() {
  const [customerId, setCustomerId] = useState('');
  const [hierarchy, setHierarchy] = useState<HierarchyResult | null>(null);
  const [rollup, setRollup] = useState<RollupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [parentIdInput, setParentIdInput] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [h, r] = await Promise.all([
        apiGet<HierarchyResult>(`/crm/expansion/customers/${customerId}/hierarchy`),
        apiGet<RollupResult>(`/crm/expansion/customers/${customerId}/hierarchy-rollup`),
      ]);
      setHierarchy(h);
      setRollup(r);
    } catch (err) {
      toast.error('Could not load account hierarchy', err instanceof ApiRequestError ? err.message : undefined);
      setHierarchy(null);
      setRollup(null);
    } finally {
      setLoading(false);
    }
  };

  const setParent = async () => {
    if (!customerId) return;
    setBusy(true);
    try {
      await apiPut(`/crm/expansion/customers/${customerId}/parent`, { parentCustomerId: parentIdInput || null });
      toast.success('Parent account updated');
      setParentIdInput('');
      await load();
    } catch (err) {
      toast.error('Could not update parent account', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Account Hierarchy & Rollups"
        description="Real parent/child account hierarchy with automatic pipeline and closed-won revenue rollup across subsidiaries (Salesforce Account Hierarchy-style)."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Account Hierarchy' }]}
      />

      <Card>
        <div style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <input
            placeholder="Customer ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ padding: 'var(--space-2)', flex: 1 }}
          />
          <Button variant="primary" onClick={load} disabled={!customerId || loading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Search size={16} /> Load
          </Button>
        </div>
      </Card>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><Spinner size="lg" /></div>}

      {!loading && hierarchy && (
        <Card>
          <div style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ margin: '0 0 var(--space-3) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Building2 size={18} /> {hierarchy.current.name}
            </h3>
            {hierarchy.parent && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                Parent account: <Badge variant="info">{hierarchy.parent.name}</Badge>
              </div>
            )}
            <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>Subsidiaries ({hierarchy.subsidiaries.length})</div>
            {hierarchy.subsidiaries.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)' }}>No child accounts.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 'var(--space-6)' }}>
                {hierarchy.subsidiaries.map((s) => (
                  <li key={s.id}>{s.name} <Badge variant="default">{s.type}</Badge></li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ padding: '0 var(--space-4) var(--space-4) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <input
              placeholder="Set parent customer ID (blank to clear)"
              value={parentIdInput}
              onChange={(e) => setParentIdInput(e.target.value)}
              style={{ padding: 'var(--space-2)', flex: 1 }}
            />
            <Button variant="secondary" onClick={setParent} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Link2 size={16} /> Set Parent
            </Button>
          </div>
        </Card>
      )}

      {!loading && rollup && (
        <Card>
          <div style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ margin: '0 0 var(--space-3) 0' }}>Hierarchy Rollup ({rollup.accountCount} accounts)</h3>
            <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Open Pipeline</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>${rollup.totalOpenPipeline.toLocaleString()}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{rollup.openOpportunityCount} deals</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Won Revenue</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>${rollup.totalWonRevenue.toLocaleString()}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{rollup.wonOpportunityCount} deals</div>
              </div>
            </div>
            <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>By Account</div>
            {rollup.byAccount.map((a) => (
              <div key={a.customerId} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                <span>{a.name}</span>
                <span>Open ${a.openPipeline.toLocaleString()} · Won ${a.wonRevenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
