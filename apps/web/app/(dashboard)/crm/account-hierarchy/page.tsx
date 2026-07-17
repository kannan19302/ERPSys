'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
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
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Account Hierarchy & Rollups"
        description="Real parent/child account hierarchy with automatic pipeline and closed-won revenue rollup across subsidiaries (Salesforce Account Hierarchy-style)."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Account Hierarchy' }]}
      />

      <Card>
        <div className={styles.p20}>
          <input
            placeholder="Customer ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className={styles.p21}
          />
          <Button variant="primary" onClick={load} disabled={!customerId || loading} className="ui-hstack-2">
            <Search size={16} /> Load
          </Button>
        </div>
      </Card>

      {loading && <div className="ui-flex-center p-8"><Spinner size="lg" /></div>}

      {!loading && hierarchy && (
        <Card>
          <div className="p-4">
            <h3 className={styles.p22}>
              <Building2 size={18} /> {hierarchy.current.name}
            </h3>
            {hierarchy.parent && (
              <div className={styles.p23}>
                Parent account: <Badge variant="info">{hierarchy.parent.name}</Badge>
              </div>
            )}
            <div className={styles.p24}>Subsidiaries ({hierarchy.subsidiaries.length})</div>
            {hierarchy.subsidiaries.length === 0 ? (
              <div className="ui-text-muted">No child accounts.</div>
            ) : (
              <ul className={styles.p25}>
                {hierarchy.subsidiaries.map((s) => (
                  <li key={s.id}>{s.name} <Badge variant="default">{s.type}</Badge></li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.p26}>
            <input
              placeholder="Set parent customer ID (blank to clear)"
              value={parentIdInput}
              onChange={(e) => setParentIdInput(e.target.value)}
              className={styles.p27}
            />
            <Button variant="secondary" onClick={setParent} disabled={busy} className="ui-hstack-2">
              <Link2 size={16} /> Set Parent
            </Button>
          </div>
        </Card>
      )}

      {!loading && rollup && (
        <Card>
          <div className="p-4">
            <h3 className={styles.p28}>Hierarchy Rollup ({rollup.accountCount} accounts)</h3>
            <div className={styles.p29}>
              <div>
                <div className="ui-text-sm-muted">Open Pipeline</div>
                <div className={styles.p210}>${rollup.totalOpenPipeline.toLocaleString()}</div>
                <div className="ui-text-sm-muted">{rollup.openOpportunityCount} deals</div>
              </div>
              <div>
                <div className="ui-text-sm-muted">Won Revenue</div>
                <div className={styles.p211}>${rollup.totalWonRevenue.toLocaleString()}</div>
                <div className="ui-text-sm-muted">{rollup.wonOpportunityCount} deals</div>
              </div>
            </div>
            <div className={styles.p212}>By Account</div>
            {rollup.byAccount.map((a) => (
              <div key={a.customerId} className={styles.p213}>
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
