'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, type Column, type SortOrder } from '@unerp/ui';
import {
  Plus, X, DollarSign, Percent, Calculator, AlertCircle,
  Award, FileText, CheckCircle, Clock, CreditCard, Trash2
} from 'lucide-react';
import { apiDelete, ApiRequestError } from '../../../../src/lib/api';

interface CommissionRule {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FLAT' | 'TIERED';
  rate: number;
  appliesTo: string;
  isActive: boolean;
  _count?: { entries: number };
  createdAt: string;
}

interface CommissionEntry {
  id: string;
  userId: string;
  userName?: string;
  opportunityId: string;
  opportunityName?: string;
  ruleId: string;
  ruleName?: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'earned' | 'revops'>('rules');
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [revopsMetrics, setRevopsMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Rule form
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<'PERCENTAGE' | 'FLAT' | 'TIERED'>('PERCENTAGE');
  const [ruleRate, setRuleRate] = useState(0);
  const [ruleAppliesTo, setRuleAppliesTo] = useState('ALL');

  // Calc form
  const [calcStart, setCalcStart] = useState('');
  const [calcEnd, setCalcEnd] = useState('');

  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const [rulesRes, entriesRes, leaderboardRes, metricsRes] = await Promise.all([
        fetch('/api/v1/crm/commissions/rules', { headers }),
        fetch('/api/v1/crm/commissions/entries', { headers }),
        fetch('/api/v1/crm/expansion/gamification-leaderboard', { headers }),
        fetch('/api/v1/crm/expansion/revops-metrics', { headers }),
      ]);

      if (rulesRes.ok) {
        const d = await rulesRes.json();
        setRules(Array.isArray(d) ? d : (d?.data || []));
      } else throw new Error();

      if (entriesRes.ok) {
        const d = await entriesRes.json();
        setEntries(Array.isArray(d) ? d : (d?.data || []));
      }

      if (leaderboardRes.ok) {
        const d = await leaderboardRes.json();
        setLeaderboard(Array.isArray(d) ? d : (d?.data || []));
      }

      if (metricsRes.ok) {
        const d = await metricsRes.json();
        setRevopsMetrics(d?.data || d || null);
      }
    } catch (err) {
      setError('Could not load commission data. Please try again.');
      toast.error('Could not load commissions', err instanceof Error ? err.message : undefined);
      setRules([]);
      setEntries([]);
      setLeaderboard([]);
      setRevopsMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const payload = { name: ruleName, type: ruleType, rate: Number(ruleRate), appliesTo: ruleAppliesTo };

    try {
      const res = await fetch('/api/v1/crm/commissions/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setModalSuccess(true);
      toast.success('Commission rule created', `"${ruleName}" has been added.`);
      setTimeout(() => { setIsModalOpen(false); resetForm(); loadData(); }, 1200);
    } catch (err) {
      toast.error('Could not create rule', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/crm/commissions/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ periodStart: calcStart, periodEnd: calcEnd }),
      });
      if (!res.ok) throw new Error(`Calculation failed (${res.status})`);
      setModalSuccess(true);
      toast.success('Commissions calculated', 'Entries generated for the selected period.');
      setTimeout(() => { setIsCalcModalOpen(false); setModalSuccess(false); setCalcStart(''); setCalcEnd(''); loadData(); }, 1200);
    } catch (err) {
      toast.error('Could not calculate commissions', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => { setRuleName(''); setRuleType('PERCENTAGE'); setRuleRate(0); setRuleAppliesTo('ALL'); setModalSuccess(false); };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'PAID': return <Badge variant="success">Paid</Badge>;
      case 'APPROVED': return <Badge variant="info">Approved</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'PERCENTAGE': return <Badge variant="info">Percentage</Badge>;
      case 'FLAT': return <Badge variant="default">Flat</Badge>;
      default: return <Badge variant="warning">Tiered</Badge>;
    }
  };

  const [ruleSortBy, setRuleSortBy] = useState('name');
  const [ruleSortOrder, setRuleSortOrder] = useState<SortOrder>('asc');
  const sortedRules = [...rules].sort((a, b) => {
    let cmp = 0;
    if (ruleSortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (ruleSortBy === 'rate') cmp = a.rate - b.rate;
    return ruleSortOrder === 'desc' ? -cmp : cmp;
  });

  const [entrySortBy, setEntrySortBy] = useState('createdAt');
  const [entrySortOrder, setEntrySortOrder] = useState<SortOrder>('desc');
  const sortedEntries = [...entries].sort((a, b) => {
    let cmp = 0;
    if (entrySortBy === 'amount') cmp = a.amount - b.amount;
    else if (entrySortBy === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return entrySortOrder === 'desc' ? -cmp : cmp;
  });

  const handleDeleteRule = async (r: CommissionRule) => {
    if (!window.confirm(`Delete commission rule "${r.name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/crm/commissions/rules/${r.id}`);
      toast.success('Commission rule deleted.');
      loadData();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to delete commission rule.';
      toast.error(message);
    }
  };

  const ruleColumns: Column<CommissionRule>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (r) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{r.name}</span> },
    { key: 'type', header: 'Type', render: (r) => getTypeBadge(r.type) },
    { key: 'rate', header: 'Rate', align: 'right', sortable: true, render: (r) => r.type === 'PERCENTAGE' ? `${r.rate}%` : `$${r.rate.toLocaleString()}` },
    { key: 'appliesTo', header: 'Applies To', render: (r) => r.appliesTo },
    { key: 'isActive', header: 'Active', align: 'center', render: (r) => r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge> },
    { key: 'entries', header: 'Entries', align: 'right', render: (r) => r._count?.entries || 0 },
    {
      key: 'actions', header: 'Actions', align: 'center', width: '80px',
      render: (r) => <button onClick={(e) => { e.stopPropagation(); handleDeleteRule(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px' }} title="Delete"><Trash2 size={16} /></button>,
    },
  ];

  const entryColumns: Column<CommissionEntry>[] = [
    { key: 'userName', header: 'User', render: (e) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{e.userName || e.userId}</span> },
    { key: 'opportunityName', header: 'Opportunity', render: (e) => e.opportunityName || e.opportunityId },
    { key: 'ruleName', header: 'Rule', render: (e) => e.ruleName || e.ruleId },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, render: (e) => <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-success-text)' }}>${e.amount.toLocaleString()}</span> },
    { key: 'status', header: 'Status', align: 'center', render: (e) => getStatusBadge(e.status) },
    { key: 'period', header: 'Period', render: (e) => <span style={{ fontSize: 'var(--text-xs)' }}>{e.periodStart} - {e.periodEnd}</span> },
  ];

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' };
  const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' };
  const thStyle: React.CSSProperties = { textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' };
  const tdStyle: React.CSSProperties = { padding: 'var(--space-3.5) var(--space-4)' };
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: 'var(--space-2.5) var(--space-5)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    cursor: 'pointer',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
    background: 'none',
    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Commissions"
        description="Configure commission rules and track earned commissions for your sales team."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Commissions' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button onClick={() => setIsCalcModalOpen(true)} variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calculator size={16} />
              <span>Calculate</span>
            </Button>
            <Button onClick={() => setIsModalOpen(true)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Plus size={16} />
              <span>New Rule</span>
            </Button>
          </div>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-warning-text)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
        <button style={tabStyle(activeTab === 'rules')} onClick={() => setActiveTab('rules')}>Rules</button>
        <button style={tabStyle(activeTab === 'earned')} onClick={() => setActiveTab('earned')}>Earned Commissions</button>
        <button style={tabStyle(activeTab === 'revops')} onClick={() => setActiveTab('revops')}>RevOps Leaderboard</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
      ) : activeTab === 'rules' ? (
        <Card>
          <DataTable<CommissionRule>
            columns={ruleColumns}
            data={sortedRules}
            rowKey={(r) => r.id}
            sortBy={ruleSortBy}
            sortOrder={ruleSortOrder}
            onSortChange={(key, order) => { setRuleSortBy(key); setRuleSortOrder(order); }}
            emptyTitle="No commission rules"
            emptyMessage="Configure a commission rule to get started."
          />
        </Card>
      ) : activeTab === 'earned' ? (
        <Card>
          <DataTable<CommissionEntry>
            columns={entryColumns}
            data={sortedEntries}
            rowKey={(e) => e.id}
            sortBy={entrySortBy}
            sortOrder={entrySortOrder}
            onSortChange={(key, order) => { setEntrySortBy(key); setEntrySortOrder(order); }}
            emptyTitle="No commission entries"
            emptyMessage="Commission entries appear once opportunities close."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {revopsMetrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
              <Card>
                <div style={{ padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue</div>
                  <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>${revopsMetrics.totalPipelineValue?.toLocaleString() || '0'}</div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Closed Won Amount</div>
                  <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>${revopsMetrics.closedWonValue?.toLocaleString() || '0'}</div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: 'var(--space-5)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Win Rate</div>
                  <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{revopsMetrics.winRatePct?.toFixed(1) || '0'}%</div>
                </div>
              </Card>
            </div>
          )}
          <Card>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Gamification Leaderboard</h3>
              {leaderboard.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {leaderboard.map((user: any, index: number) => (
                    <div key={user.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{ fontWeight: 700, minWidth: 24 }}>#{index + 1}</span>
                        <span>{user.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                        <span>Deals Won: <strong>{user.dealsWon}</strong></span>
                        <span>Points: <strong>{user.points || user.dealsWon * 100}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--color-text-secondary)' }}>No leaderboard data found</p>}
            </div>
          </Card>
        </div>
      )}

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '500px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>New Commission Rule</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            {modalSuccess ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <Award size={48} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-4) auto' }} />
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Rule Created Successfully</div>
              </div>
            ) : (
              <form onSubmit={handleCreateRule} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Rule Name</label>
                  <input type="text" required placeholder="e.g. Standard Sales Commission" value={ruleName} onChange={e => setRuleName(e.target.value)} className="frappe-input" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select value={ruleType} onChange={e => setRuleType(e.target.value as 'PERCENTAGE' | 'FLAT' | 'TIERED')} className="frappe-input" style={inputStyle}>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FLAT">Flat Amount</option>
                      <option value="TIERED">Tiered</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Rate {ruleType === 'PERCENTAGE' ? '(%)' : '($)'}</label>
                    <input type="number" required min={0} step={ruleType === 'PERCENTAGE' ? 0.5 : 1} value={ruleRate} onChange={e => setRuleRate(Number(e.target.value))} className="frappe-input" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Applies To</label>
                  <select value={ruleAppliesTo} onChange={e => setRuleAppliesTo(e.target.value)} className="frappe-input" style={inputStyle}>
                    <option value="ALL">All Opportunities</option>
                    <option value="ENTERPRISE">Enterprise Only</option>
                    <option value="SMB">SMB Only</option>
                    <option value="NEW_BUSINESS">New Business</option>
                    <option value="RENEWAL">Renewals</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Rule'}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Calculate Modal */}
      {isCalcModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '440px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Calculate Commissions</h3>
              <button onClick={() => setIsCalcModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            {modalSuccess ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-4) auto' }} />
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Commissions Calculated</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Check the Earned Commissions tab for results.</div>
              </div>
            ) : (
              <form onSubmit={handleCalculate} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Period Start</label>
                  <input type="date" required value={calcStart} onChange={e => setCalcStart(e.target.value)} className="frappe-input" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Period End</label>
                  <input type="date" required value={calcEnd} onChange={e => setCalcEnd(e.target.value)} className="frappe-input" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                  <Button variant="secondary" onClick={() => setIsCalcModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Calculating...' : 'Calculate'}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
