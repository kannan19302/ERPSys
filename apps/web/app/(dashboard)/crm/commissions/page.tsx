'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast } from '@unerp/ui';
import {
  Plus, X, DollarSign, Percent, Calculator, AlertCircle,
  Award, FileText, CheckCircle, Clock, CreditCard
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'rules' | 'earned'>('rules');
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
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
      const [rulesRes, entriesRes] = await Promise.all([
        fetch('/api/v1/crm/commissions/rules', { headers }),
        fetch('/api/v1/crm/commissions/entries', { headers }),
      ]);

      if (rulesRes.ok) {
        const d = await rulesRes.json();
        setRules(Array.isArray(d) ? d : (d?.data || []));
      } else throw new Error();

      if (entriesRes.ok) {
        const d = await entriesRes.json();
        setEntries(Array.isArray(d) ? d : (d?.data || []));
      }
    } catch (err) {
      setError('Could not load commission data. Please try again.');
      toast.error('Could not load commissions', err instanceof Error ? err.message : undefined);
      setRules([]);
      setEntries([]);
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
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
      ) : activeTab === 'rules' ? (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Type</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                  <th style={thStyle}>Applies To</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Active</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Entries</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>No commission rules configured.</td></tr>
                ) : rules.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 'var(--weight-semibold)' }}>{r.name}</td>
                    <td style={tdStyle}>{getTypeBadge(r.type)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'var(--weight-bold)' }}>
                      {r.type === 'PERCENTAGE' ? `${r.rate}%` : `$${r.rate.toLocaleString()}`}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{r.appliesTo}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{r._count?.entries || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Opportunity</th>
                  <th style={thStyle}>Rule</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={thStyle}>Period</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>No commission entries found.</td></tr>
                ) : entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 'var(--weight-semibold)' }}>{e.userName || e.userId}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{e.opportunityName || e.opportunityId}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{e.ruleName || e.ruleId}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'var(--weight-bold)', color: 'var(--color-success-text)' }}>${e.amount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{getStatusBadge(e.status)}</td>
                    <td style={{ ...tdStyle, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{e.periodStart} - {e.periodEnd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
