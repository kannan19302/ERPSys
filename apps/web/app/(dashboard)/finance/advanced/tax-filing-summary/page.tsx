/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Loader2, FileText, CheckCircle2,
  AlertCircle, ShieldAlert, DollarSign, Calendar
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface TaxFiling {
  id: string;
  period: string;
  type: string;
  liability: number;
  status: string;
}

interface FilingSummary {
  year: string;
  totalFilings: number;
  totalTaxLiability: number;
  totalTaxPaid: number;
  pendingFilings: number;
  filings: TaxFiling[];
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function TaxFilingSummaryPage() {
  const [summary, setSummary] = useState<FilingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2026');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tax-filings/summary?year=${year}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setSummary(await res.json() as FilingSummary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Tax Filing Summary</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Compliance dashboard displaying GST/VAT returns, computed liability, filing statuses, and tax audit readiness.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <select
            className="frappe-input"
            value={year}
            onChange={e => setYear(e.target.value)}
            style={{ width: '120px', height: '38px', margin: 0 }}
          >
            <option value="2025">Year 2025</option>
            <option value="2026">Year 2026</option>
            <option value="2027">Year 2027</option>
          </select>
          <Button variant="outline" onClick={fetchSummary}>
            <RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />Refresh
          </Button>
        </div>
      </div>

      {summary && (
        <>
          {/* KPI Cards */}
          <div className="frappe-grid-4" style={{ gap: 'var(--space-4)' }}>
            {[
              { label: 'Total Filings', value: summary.totalFilings, icon: <FileText size={20} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
              { label: 'Tax Liability', value: fmt(summary.totalTaxLiability), icon: <DollarSign size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
              { label: 'Tax Paid', value: fmt(summary.totalTaxPaid), icon: <CheckCircle2 size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
              { label: 'Pending Filings', value: summary.pendingFilings, icon: <AlertCircle size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
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

          {/* Filings Table */}
          <Card className="frappe-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShieldAlert size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Tax Returns History</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {summary.filings.length === 0 ? (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <Calendar style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} size={32} />
                  <p>No tax filings found for {summary.year}.</p>
                </div>
              ) : (
                <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Period Range</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Tax Type</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Tax Liability</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Filing Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.filings.map(filing => (
                      <tr key={filing.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{filing.period}</td>
                        <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{filing.type}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: filing.liability > 0 ? '#ef4444' : '#22c55e' }}>
                          {fmt(filing.liability)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
                            borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                            background: filing.status === 'FILED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                            color: filing.status === 'FILED' ? '#16a34a' : '#d97706',
                          }}>
                            {filing.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
