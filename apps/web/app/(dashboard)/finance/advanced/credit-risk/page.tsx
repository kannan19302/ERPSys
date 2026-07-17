'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Loader2, RefreshCw, Search, AlertTriangle,
  TrendingUp, DollarSign, Users, Lock, Unlock
} from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface CreditRiskEntry {
  customerId: string;
  name: string;
  creditLimit: number | null;
  outstanding: number;
  creditUtilization: number | null;
  creditHold: boolean;
  riskRating: string;
}

interface CreditSummary {
  customerId: string;
  customerName: string;
  creditLimit: number | null;
  creditUsed: number;
  creditAvailable: number | null;
  creditHold: boolean;
  creditHoldReason: string | null;
  riskRating: string;
  paymentTerms: number;
  totalOutstanding: number;
  totalOverdue: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const RISK_COLORS: Record<string, { bg: string; color: string }> = {
  LOW: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a' },
  MEDIUM: { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
  HIGH: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
  CRITICAL: { bg: 'rgba(127,29,29,0.12)', color: '#7f1d1d' },
};

export default function CreditRiskPage() {
  const client = useApiClient();
  const [list, setList] = useState<CreditRiskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ creditLimit: '', paymentTerms: '', creditHold: false, creditHoldReason: '', riskRating: 'LOW' });
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      setList(await client.get<CreditRiskEntry[]>('/advanced-finance/credit-risk'));
    } catch { alert('Unable to load credit risk data.'); }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const fetchSummary = useCallback(async (id: string) => {
    setLoadingSummary(true);
    try {
      const data = await client.get<CreditSummary>(`/advanced-finance/customers/${id}/credit`);
        setSummary(data);
        setEditData({
          creditLimit: data.creditLimit !== null ? String(data.creditLimit) : '',
          paymentTerms: String(data.paymentTerms),
          creditHold: data.creditHold,
          creditHoldReason: data.creditHoldReason || '',
          riskRating: data.riskRating || 'LOW',
        });
    } catch { alert('Unable to load the credit risk summary.'); }
    finally { setLoadingSummary(false); }
  }, [client]);

  const handleSelectCustomer = (id: string) => {
    setSelectedId(id);
    setSummary(null);
    setEditMode(false);
    fetchSummary(id);
  };

  const handleSaveCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (editData.creditLimit !== '') body.creditLimit = parseFloat(editData.creditLimit);
      if (editData.paymentTerms !== '') body.paymentTerms = parseInt(editData.paymentTerms);
      body.creditHold = editData.creditHold;
      if (editData.creditHoldReason) body.creditHoldReason = editData.creditHoldReason;
      body.riskRating = editData.riskRating;

      await client.patch(`/advanced-finance/customers/${selectedId}/credit`, body);
        setEditMode(false);
        fetchSummary(selectedId);
        fetchList();
    } catch { alert('Unable to update the credit limit.'); }
    finally { setSaving(false); }
  };

  const handleToggleHold = async (id: string, currentHold: boolean) => {
    if (!confirm(`${currentHold ? 'Release' : 'Place'} credit hold for this customer?`)) return;
    try {
      await client.patch(`/advanced-finance/customers/${id}/credit`, { creditHold: !currentHold });
      if (selectedId === id) fetchSummary(id);
      fetchList();
    } catch { alert(`Unable to ${currentHold ? 'release' : 'place'} the credit hold.`); }
  };

  const filtered = list.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase()));

  // Stats
  const totalOutstanding = list.reduce((s, c) => s + c.outstanding, 0);
  const onHold = list.filter(c => c.creditHold).length;
  const highRisk = list.filter(c => c.riskRating === 'HIGH' || c.riskRating === 'CRITICAL').length;

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.credit.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between ui-items-start">
        <div>
          <h1 className="text-3xl">Credit Risk Management</h1>
          <p className="ui-text-muted mt-1">
            Customer credit limits, holds, risk ratings, and outstanding balance monitoring.
          </p>
        </div>
        <Button variant="outline" onClick={fetchList}><RefreshCw size={16} className="mr-2" />Refresh</Button>
      </div>

      {/* Summary Stats */}
      <div className={`ui-grid-3 ${styles.s1}`} >
        {[
          { label: 'Total Outstanding', value: fmt(totalOutstanding), icon: <DollarSign size={20} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
          { label: 'Customers on Hold', value: onHold, icon: <Lock size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'High / Critical Risk', value: highRisk, icon: <TrendingUp size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Total Customers', value: list.length, icon: <Users size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
        ].map(kpi => (
          <Card key={kpi.label} className="ui-card p-5">
            <div className="ui-flex-between">
              <div>
                <p className="ui-text-sm-muted">{kpi.label}</p>
                <p style={{ color: kpi.color }} className={styles.s2}>{kpi.value}</p>
              </div>
              <div style={{ background: kpi.bg, color: kpi.color }} className={styles.s3}>{kpi.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.s4}>
        {/* Customer List */}
        <Card className={`ui-card ${styles.s5}`} >
          <div className={styles.s6}>
            <ShieldAlert size={18} className="ui-text-primary" />
            <h3 className="ui-heading-base">All Customers</h3>
            <div className="flex-1" />
            <div className="relative">
              <Search size={14} className={styles.s7} />
              <input
                className={`ui-input ${styles.s8}`}
                placeholder="Search..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}

              />
            </div>
          </div>
          <ListPageTemplate
            columns={[
              { key: 'name', header: 'Customer', render: (v, row) => (
                <span className={styles.s9} onClick={() => handleSelectCustomer(String(row.customerId))}>
                  {Boolean(row.creditHold) && <Lock size={12} className={styles.s10} />}
                  {String(v)}
                </span>
              ) },
              { key: 'creditLimit', header: 'Credit Limit', render: (v) => v !== null && v !== undefined ? fmt(Number(v)) : '—' },
              { key: 'outstanding', header: 'Outstanding', render: (v) => <span className="font-semibold">{fmt(Number(v))}</span> },
              { key: 'creditUtilization', header: 'Utilization', render: (v) => {
                const util = v as number | null;
                const utilColor = util === null ? '#6b7280' : util > 90 ? '#ef4444' : util > 70 ? '#f59e0b' : '#22c55e';
                return util !== null ? <span style={{ color: utilColor }} className={styles.s11}>{util.toFixed(0)}%</span> : '—';
              } },
              { key: 'riskRating', header: 'Risk', render: (v) => {
                const rc = RISK_COLORS[String(v)] || RISK_COLORS.LOW;
                return <span style={{ ...rc }} className={styles.s12}>{String(v)}</span>;
              } },
              { key: 'creditHold', header: 'Hold', render: (v) => v ? (
                <span className={styles.s13}><Lock size={12} />ON HOLD</span>
              ) : <span className={styles.s14}>Active</span> },
              { key: 'customerId', header: 'Actions', render: (v, row) => (
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleHold(String(v), Boolean(row.creditHold)); }}
                  style={{ color: row.creditHold ? '#22c55e' : '#ef4444' }} className={styles.s15}
                  title={row.creditHold ? 'Release Hold' : 'Place Hold'}
                >
                  {row.creditHold ? <Unlock size={14} /> : <Lock size={14} />}
                </button>
              ) },
            ] as ListColumn[]}
            data={(filtered as unknown as Record<string, unknown>[])}
            loading={false}
            emptyTitle="No customers found"
            emptyDescription="No customers match your search."
          />
        </Card>

        {/* Detail Panel */}
        {selectedId && (
          <Card className={`ui-card ${styles.s16}`} >
            <div className={styles.s17}>
              <h3 className="ui-heading-base">Credit Details</h3>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            {loadingSummary ? (
              <div className={styles.s18}>
                <Loader2 className={`animate-spin ${styles.s19}`} size={24}  />
              </div>
            ) : summary ? (
              <div className="p-5 ui-stack-4">
                <div>
                  <p className={styles.s20}>{summary.customerName}</p>
                  {summary.creditHold && (
                    <span className={styles.s21}>
                      <Lock size={11} />CREDIT HOLD{summary.creditHoldReason ? `: ${summary.creditHoldReason}` : ''}
                    </span>
                  )}
                </div>

                {!editMode ? (
                  <div className="ui-stack-3">
                    {[
                      { label: 'Credit Limit', value: summary.creditLimit !== null ? fmt(summary.creditLimit) : 'Unlimited' },
                      { label: 'Credit Used', value: fmt(summary.creditUsed), color: '#ef4444' },
                      { label: 'Credit Available', value: summary.creditAvailable !== null ? fmt(summary.creditAvailable) : 'N/A', color: '#22c55e' },
                      { label: 'Total Overdue', value: fmt(summary.totalOverdue), color: summary.totalOverdue > 0 ? '#ef4444' : undefined },
                      { label: 'Payment Terms', value: `Net ${summary.paymentTerms}` },
                      { label: 'Risk Rating', value: summary.riskRating },
                    ].map(row => (
                      <div key={row.label} className={styles.s22}>
                        <span className="ui-text-muted">{row.label}</span>
                        <span style={{ color: row.color || 'var(--color-text-primary)' }} className={styles.s11}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleSaveCredit} className="ui-stack-3">
                    <div className="ui-form-group">
                      <label className="ui-label">Credit Limit ($)</label>
                      <input className="ui-input" type="number" step="100" placeholder="e.g. 50000" value={editData.creditLimit} onChange={e => setEditData({ ...editData, creditLimit: e.target.value })} />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Payment Terms (days)</label>
                      <input className="ui-input" type="number" min="1" value={editData.paymentTerms} onChange={e => setEditData({ ...editData, paymentTerms: e.target.value })} />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Risk Rating</label>
                      <select className="ui-input" value={editData.riskRating} onChange={e => setEditData({ ...editData, riskRating: e.target.value })}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                    <div className="ui-hstack-3">
                      <input type="checkbox" id="hold-check" checked={editData.creditHold} onChange={e => setEditData({ ...editData, creditHold: e.target.checked })} />
                      <label htmlFor="hold-check" className={styles.s23}>Credit Hold</label>
                    </div>
                    {editData.creditHold && (
                      <div className="ui-form-group">
                        <label className="ui-label">Hold Reason</label>
                        <input className="ui-input" placeholder="Reason for hold..." value={editData.creditHoldReason} onChange={e => setEditData({ ...editData, creditHoldReason: e.target.value })} />
                      </div>
                    )}
                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? <Loader2 className={`animate-spin ${styles.s24}`} size={14}  /> : null}
                      Save Changes
                    </Button>
                  </form>
                )}
              </div>
            ) : null}
          </Card>
        )}
      </div>
      </div>
    </RouteGuard>
  );
}
