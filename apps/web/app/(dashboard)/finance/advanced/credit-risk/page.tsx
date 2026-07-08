/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Loader2, RefreshCw, Search, AlertTriangle,
  TrendingUp, DollarSign, Users, Lock, Unlock
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';

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

const API = 'http://localhost:3001/api/v1/advanced-finance';
const CRM_API = 'http://localhost:3001/api/v1/crm';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
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
      const res = await fetch(`${API}/credit-risk`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setList(await res.json() as CreditRiskEntry[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const fetchSummary = useCallback(async (id: string) => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API}/customers/${id}/credit`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) {
        const data = await res.json() as CreditSummary;
        setSummary(data);
        setEditData({
          creditLimit: data.creditLimit !== null ? String(data.creditLimit) : '',
          paymentTerms: String(data.paymentTerms),
          creditHold: data.creditHold,
          creditHoldReason: data.creditHoldReason || '',
          riskRating: data.riskRating || 'LOW',
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoadingSummary(false); }
  }, []);

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

      const res = await fetch(`${API}/customers/${selectedId}/credit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditMode(false);
        fetchSummary(selectedId);
        fetchList();
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        alert('Save failed: ' + (err.message || 'Error'));
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleToggleHold = async (id: string, currentHold: boolean) => {
    if (!confirm(`${currentHold ? 'Release' : 'Place'} credit hold for this customer?`)) return;
    try {
      await fetch(`${API}/customers/${id}/credit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ creditHold: !currentHold }),
      });
      if (selectedId === id) fetchSummary(id);
      fetchList();
    } catch (e) { console.error(e); }
  };

  const filtered = list.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase()));

  // Stats
  const totalOutstanding = list.reduce((s, c) => s + c.outstanding, 0);
  const onHold = list.filter(c => c.creditHold).length;
  const highRisk = list.filter(c => c.riskRating === 'HIGH' || c.riskRating === 'CRITICAL').length;

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Credit Risk Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Customer credit limits, holds, risk ratings, and outstanding balance monitoring.
          </p>
        </div>
        <Button variant="outline" onClick={fetchList}><RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />Refresh</Button>
      </div>

      {/* Summary Stats */}
      <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
        {[
          { label: 'Total Outstanding', value: fmt(totalOutstanding), icon: <DollarSign size={20} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
          { label: 'Customers on Hold', value: onHold, icon: <Lock size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'High / Critical Risk', value: highRisk, icon: <TrendingUp size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Total Customers', value: list.length, icon: <Users size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
        ].map(kpi => (
          <Card key={kpi.label} className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{kpi.label}</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: kpi.color, marginTop: 'var(--space-1)' }}>{kpi.value}</p>
              </div>
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        {/* Customer List */}
        <Card className="frappe-card" style={{ flex: '1', minWidth: 0 }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>All Customers</h3>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
              <input
                className="frappe-input"
                placeholder="Search..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{ paddingLeft: '28px', fontSize: 'var(--text-sm)', height: '34px' }}
              />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Customer</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Credit Limit</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Outstanding</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Utilization</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Risk</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Hold</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No customers found.
                    </td>
                  </tr>
                ) : filtered.map(c => {
                  const util = c.creditUtilization;
                  const utilColor = util === null ? '#6b7280' : util > 90 ? '#ef4444' : util > 70 ? '#f59e0b' : '#22c55e';
                  const rc = RISK_COLORS[c.riskRating] || RISK_COLORS.LOW;
                  return (
                    <tr
                      key={c.customerId}
                      style={{ borderBottom: '1px solid var(--color-border)', background: selectedId === c.customerId ? 'var(--color-primary-light)' : undefined, cursor: 'pointer' }}
                      onClick={() => handleSelectCustomer(c.customerId)}
                    >
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>
                        {c.creditHold && <Lock size={12} style={{ color: '#ef4444', display: 'inline', marginRight: '4px' }} />}
                        {c.name}
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{c.creditLimit !== null ? fmt(c.creditLimit) : '—'}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>{fmt(c.outstanding)}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        {util !== null ? (
                          <span style={{ color: utilColor, fontWeight: 'var(--weight-semibold)' }}>{util.toFixed(0)}%</span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', ...rc }}>{c.riskRating}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        {c.creditHold ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }}>
                            <Lock size={12} />ON HOLD
                          </span>
                        ) : (
                          <span style={{ color: '#22c55e', fontSize: 'var(--text-xs)' }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleHold(c.customerId, c.creditHold)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.creditHold ? '#22c55e' : '#ef4444', padding: 'var(--space-1)', display: 'inline-flex', alignItems: 'center' }}
                          title={c.creditHold ? 'Release Hold' : 'Place Hold'}
                        >
                          {c.creditHold ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail Panel */}
        {selectedId && (
          <Card className="frappe-card" style={{ width: '380px', flexShrink: 0 }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Credit Details</h3>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            {loadingSummary ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-primary)', margin: '0 auto' }} />
              </div>
            ) : summary ? (
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-base)' }}>{summary.customerName}</p>
                  {summary.creditHold && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', marginTop: 'var(--space-1)' }}>
                      <Lock size={11} />CREDIT HOLD{summary.creditHoldReason ? `: ${summary.creditHoldReason}` : ''}
                    </span>
                  )}
                </div>

                {!editMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {[
                      { label: 'Credit Limit', value: summary.creditLimit !== null ? fmt(summary.creditLimit) : 'Unlimited' },
                      { label: 'Credit Used', value: fmt(summary.creditUsed), color: '#ef4444' },
                      { label: 'Credit Available', value: summary.creditAvailable !== null ? fmt(summary.creditAvailable) : 'N/A', color: '#22c55e' },
                      { label: 'Total Overdue', value: fmt(summary.totalOverdue), color: summary.totalOverdue > 0 ? '#ef4444' : undefined },
                      { label: 'Payment Terms', value: `Net ${summary.paymentTerms}` },
                      { label: 'Risk Rating', value: summary.riskRating },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                        <span style={{ fontWeight: 'var(--weight-semibold)', color: row.color || 'var(--color-text-primary)' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleSaveCredit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Credit Limit ($)</label>
                      <input className="frappe-input" type="number" step="100" placeholder="e.g. 50000" value={editData.creditLimit} onChange={e => setEditData({ ...editData, creditLimit: e.target.value })} />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Payment Terms (days)</label>
                      <input className="frappe-input" type="number" min="1" value={editData.paymentTerms} onChange={e => setEditData({ ...editData, paymentTerms: e.target.value })} />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Risk Rating</label>
                      <select className="frappe-input" value={editData.riskRating} onChange={e => setEditData({ ...editData, riskRating: e.target.value })}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <input type="checkbox" id="hold-check" checked={editData.creditHold} onChange={e => setEditData({ ...editData, creditHold: e.target.checked })} />
                      <label htmlFor="hold-check" style={{ fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Credit Hold</label>
                    </div>
                    {editData.creditHold && (
                      <div className="frappe-form-group">
                        <label className="frappe-label">Hold Reason</label>
                        <input className="frappe-input" placeholder="Reason for hold..." value={editData.creditHoldReason} onChange={e => setEditData({ ...editData, creditHoldReason: e.target.value })} />
                      </div>
                    )}
                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? <Loader2 className="animate-spin" size={14} style={{ marginRight: 'var(--space-1)' }} /> : null}
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
  );
}
