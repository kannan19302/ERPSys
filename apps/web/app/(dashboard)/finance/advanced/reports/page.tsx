'use client';

import React, { useState, useCallback } from 'react';
import {
  BarChart3,
  PieChart,
  FileText,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  Receipt,
  Filter,
  BookOpen,
  Clock,
} from 'lucide-react';
import { Card, Button, StatusBadge, PageHeader } from '@unerp/ui';

type ReportType = 'pnl' | 'balance-sheet' | 'cash-flow' | 'trial-balance' | 'aging';

interface ReportResponse {
  [key: string]: unknown;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
}

const reportMeta: Record<ReportType, { label: string; icon: React.ReactNode; description: string }> = {
  'pnl': { label: 'Profit & Loss', icon: <BarChart3 style={{ height: '20px', width: '20px' }} />, description: 'Revenue, expenses, and net profit for a period' },
  'balance-sheet': { label: 'Balance Sheet', icon: <PieChart style={{ height: '20px', width: '20px' }} />, description: 'Assets, liabilities, and equity as of a date' },
  'cash-flow': { label: 'Cash Flow', icon: <TrendingUp style={{ height: '20px', width: '20px' }} />, description: 'Operating, investing, and financing activities' },
  'trial-balance': { label: 'Trial Balance', icon: <BookOpen style={{ height: '20px', width: '20px' }} />, description: 'All accounts with debit/credit totals' },
  'aging': { label: 'AR/AP Aging', icon: <Clock style={{ height: '20px', width: '20px' }} />, description: 'Overdue invoices/purchase orders by aging bucket' },
};

export default function AdvancedReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('pnl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);

  // Date/Filter state
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [agingType, setAgingType] = useState<'AR' | 'AP'>('AR');

  const buildUrl = useCallback(() => {
    const base = '/api/v1/advanced-finance/reports';
    switch (activeReport) {
      case 'pnl':
        return `${base}/pnl?startDate=${startDate}&endDate=${endDate}`;
      case 'balance-sheet':
        return `${base}/balance-sheet?asOfDate=${asOfDate}`;
      case 'cash-flow':
        return `${base}/cash-flow?startDate=${startDate}&endDate=${endDate}`;
      case 'trial-balance':
        return `${base}/trial-balance?asOfDate=${asOfDate}`;
      case 'aging':
        return `${base}/aging?type=${agingType}&asOfDate=${asOfDate}`;
      default:
        return '';
    }
  }, [activeReport, startDate, endDate, asOfDate, agingType]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const url = buildUrl();
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `API returned status ${res.status}`);
      }

      const data = await res.json();
      setReportData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate report. API may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-report-${asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render P&L Report
  const renderPnL = () => {
    if (!reportData) return null;
    const d = reportData as {
      revenue: number;
      revenueBreakdown: Array<{ name: string; code: string; amount: number }>;
      expenses: number;
      expenseBreakdown: Array<{ name: string; code: string; amount: number }>;
      netProfit: number;
      period: { startDate: string; endDate: string };
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>Profit & Loss Statement</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
            For period {new Date(d.period.startDate).toLocaleDateString()} — {new Date(d.period.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Revenue Section */}
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-success)', marginBottom: 'var(--space-3)' }}>Revenue</h3>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Account</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(d.revenueBreakdown || []).map((item, i) => (
                <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>{item.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>({item.code})</span></td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-semibold)' }}>
                <td style={{ padding: 'var(--space-3)' }}>Total Revenue</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.revenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expenses Section */}
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>Expenses</h3>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Account</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(d.expenseBreakdown || []).map((item, i) => (
                <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>{item.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>({item.code})</span></td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-semibold)' }}>
                <td style={{ padding: 'var(--space-3)' }}>Total Expenses</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.expenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Profit */}
        <div className={`rounded-xl p-5 ${d.netProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Net {d.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
            <span className={`text-2xl font-bold font-mono ${d.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(d.netProfit)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Balance Sheet
  const renderBalanceSheet = () => {
    if (!reportData) return null;
    const d = reportData as {
      assets: { current: { total: number; accounts: Array<{ code: string; name: string; balance: number }> }; nonCurrent: { total: number; accounts: Array<{ code: string; name: string; balance: number }> }; total: number };
      liabilities: { current: { total: number; accounts: Array<{ code: string; name: string; balance: number }> }; nonCurrent: { total: number; accounts: Array<{ code: string; name: string; balance: number }> }; total: number };
      equity: { total: number; accounts: Array<{ code: string; name: string; balance: number }> };
      totalLiabilitiesAndEquity: number;
      asOfDate: string;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>Balance Sheet</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>As of {new Date(d.asOfDate).toLocaleDateString()}</p>
        </div>

        {/* Assets */}
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }}>Assets</h3>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}><th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Account</th><th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Balance</th></tr></thead>
            <tbody>
              {d.assets.current.accounts.map((a, i) => (
                <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: 'var(--space-3)' }}>{a.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>({a.code})</span></td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-semibold)' }}><td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>Current Assets Total</td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.assets.current.total)}</td></tr>
              {d.assets.nonCurrent.accounts.map((a, i) => (
                <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: 'var(--space-3)' }}>{a.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>({a.code})</span></td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-semibold)' }}><td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>Non-Current Assets Total</td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.assets.nonCurrent.total)}</td></tr>
              <tr style={{ fontWeight: 'var(--weight-bold)' }}><td style={{ padding: 'var(--space-3)' }}>Total Assets</td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.assets.total)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Liabilities */}
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)' }}>Liabilities</h3>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}><th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Account</th><th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Balance</th></tr></thead>
            <tbody>
              {d.liabilities.current.accounts.map((a, i) => (
                <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: 'var(--space-3)' }}>{a.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>({a.code})</span></td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-semibold)' }}><td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>Current Liabilities Total</td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.liabilities.current.total)}</td></tr>
              {d.liabilities.nonCurrent.accounts.map((a, i) => (
                <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: 'var(--space-3)' }}>{a.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>({a.code})</span></td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-semibold)' }}><td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>Non-Current Liabilities Total</td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.liabilities.nonCurrent.total)}</td></tr>
              <tr style={{ fontWeight: 'var(--weight-bold)' }}><td style={{ padding: 'var(--space-3)' }}>Total Liabilities</td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.liabilities.total)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Equity */}
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)' }}>Equity</h3>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}><th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Account</th><th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Balance</th></tr></thead>
            <tbody>
              {d.equity.accounts.map((a, i) => (
                <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: 'var(--space-3)' }}>{a.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>({a.code})</span></td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr style={{ fontWeight: 'var(--weight-bold)' }}><td style={{ padding: 'var(--space-3)' }}>Total Equity</td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.equity.total)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Total Liabilities & Equity</span>
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>{formatCurrency(d.totalLiabilitiesAndEquity)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render Cash Flow
  const renderCashFlow = () => {
    if (!reportData) return null;
    const d = reportData as {
      operatingActivities: { total: number; details: Array<{ accountName: string; amount: number }> };
      investingActivities: { total: number; details: Array<{ accountName: string; amount: number }> };
      financingActivities: { total: number; details: Array<{ accountName: string; amount: number }> };
      netIncreaseInCash: number;
      period: { startDate: string; endDate: string };
    };

    const renderSection = (title: string, data: typeof d.operatingActivities, color: string) => (
      <div>
        <h3 className={`text-lg font-semibold ${color} mb-3`}>{title}</h3>
        <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}><th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Account</th><th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Amount</th></tr></thead>
          <tbody>
            {data.details.map((item, i) => (
              <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3)' }}>{item.accountName}</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'var(--weight-bold)', backgroundColor: 'var(--color-bg-sunken)' }}><td style={{ padding: 'var(--space-3)' }}>Total {title}</td><td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(data.total)}</td></tr>
          </tbody>
        </table>
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>Statement of Cash Flows</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
            For period {new Date(d.period.startDate).toLocaleDateString()} — {new Date(d.period.endDate).toLocaleDateString()}
          </p>
        </div>

        {renderSection('Operating Activities', d.operatingActivities, 'text-blue-600')}
        {renderSection('Investing Activities', d.investingActivities, 'text-orange-600')}
        {renderSection('Financing Activities', d.financingActivities, 'text-purple-600')}

        <div className={`rounded-xl p-5 ${d.netIncreaseInCash >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Net Increase in Cash</span>
            <span className={`text-2xl font-bold font-mono ${d.netIncreaseInCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(d.netIncreaseInCash)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Trial Balance
  const renderTrialBalance = () => {
    if (!reportData) return null;
    const d = reportData as {
      asOfDate: string;
      accounts: Array<{ code: string; name: string; type: string; debitTotal: number; creditTotal: number; balance: number; entriesCount: number }>;
      totalDebits: number;
      totalCredits: number;
      isBalanced: boolean;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>Trial Balance</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>As of {new Date(d.asOfDate).toLocaleDateString()}</p>
        </div>

        {d.isBalanced ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
            <AlertCircle className="h-4 w-4" /> Trial Balance is <strong>balanced</strong> (Debits: {formatCurrency(d.totalDebits)} = Credits: {formatCurrency(d.totalCredits)})
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
            <AlertCircle className="h-4 w-4" /> Trial Balance is <strong>NOT balanced</strong> (Debits: {formatCurrency(d.totalDebits)} ≠ Credits: {formatCurrency(d.totalCredits)})
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Code</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Account</th>
                <th style={{ textAlign: 'center', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Type</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Debit Total</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Credit Total</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Balance</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Entries</th>
              </tr>
            </thead>
            <tbody>
              {d.accounts.map((acc, i) => (
                <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>{acc.code}</td>
                  <td style={{ padding: 'var(--space-3)' }}>{acc.name}</td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <StatusBadge status={acc.type} />
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(acc.debitTotal)}</td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(acc.creditTotal)}</td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(acc.balance)}</td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{acc.entriesCount}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'var(--weight-bold)', backgroundColor: 'var(--color-bg-sunken)' }}>
                <td colSpan={3} style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Totals</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.totalDebits)}</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{formatCurrency(d.totalCredits)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Aging Report
  const renderAging = () => {
    if (!reportData) return null;
    const d = reportData as {
      type: string;
      asOfDate: string;
      totalOutstanding: number;
      totalItems: number;
      buckets: Record<string, Array<{
        partyName: string;
        documentNumber: string;
        totalAmount: number;
        outstanding: number;
        dueDate: string;
        daysOverdue: number;
        ageBucket: string;
      }>>;
      bucketTotals: Record<string, { count: number; totalOutstanding: number }>;
    };

    const bucketColors: Record<string, string> = {
      '0-30': 'bg-green-50 border-green-200 text-green-700',
      '31-60': 'bg-yellow-50 border-yellow-200 text-yellow-700',
      '61-90': 'bg-orange-50 border-orange-200 text-orange-700',
      '90+': 'bg-red-50 border-red-200 text-red-700',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{d.type === 'AR' ? 'Accounts Receivable' : 'Accounts Payable'} Aging Report</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>As of {new Date(d.asOfDate).toLocaleDateString()}</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {Object.entries(d.bucketTotals).map(([bucket, data]) => (
            <div key={bucket} className={`rounded-lg p-4 border ${bucketColors[bucket] || 'bg-gray-50 border-gray-200'}`}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-1)' }}>{bucket} days</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{data.count} items</div>
              <div style={{ fontSize: 'var(--text-sm)' }}>{formatCurrency(data.totalOutstanding)}</div>
            </div>
          ))}
          <div style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-1)' }}>Total</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{d.totalItems} items</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>{formatCurrency(d.totalOutstanding)}</div>
          </div>
        </div>

        {/* Bucket Details */}
        {Object.entries(d.buckets).map(([bucket, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={bucket}>
              <h3 className={`text-md font-semibold mb-2 ${bucket === '90+' ? 'text-red-600' : bucket === '61-90' ? 'text-orange-600' : bucket === '31-60' ? 'text-yellow-600' : 'text-green-600'}`}>
                {bucket} Days Overdue ({items.length} items)
              </h3>
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 'var(--weight-medium)' }}>Party</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 'var(--weight-medium)' }}>Document</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2)', fontWeight: 'var(--weight-medium)' }}>Total</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2)', fontWeight: 'var(--weight-medium)' }}>Outstanding</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2)', fontWeight: 'var(--weight-medium)' }}>Days Overdue</th>
                </tr></thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/20" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2)' }}>{item.partyName}</td>
                      <td style={{ padding: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>{item.documentNumber}</td>
                      <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>{formatCurrency(item.totalAmount)}</td>
                      <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>{formatCurrency(item.outstanding)}</td>
                      <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>{item.daysOverdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {d.totalItems === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Receipt style={{ marginBottom: 'var(--space-3)' }} />
            <p>No overdue items found for this period.</p>
          </div>
        )}
      </div>
    );
  };

  const renderReport = () => {
    if (!reportData && !loading && !error) return null;

    if (loading) {
      return (
        <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-4)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Generating report...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <AlertCircle style={{ marginBottom: 'var(--space-4)' }} />
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>Report Generation Failed</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>{error}</p>
            <Button variant="outline" onClick={generateReport}>Retry</Button>
          </div>
        </div>
      );
    }

    if (!reportData) return null;

    return (
      <div className="animate-in fade-in duration-300">
        {activeReport === 'pnl' && renderPnL()}
        {activeReport === 'balance-sheet' && renderBalanceSheet()}
        {activeReport === 'cash-flow' && renderCashFlow()}
        {activeReport === 'trial-balance' && renderTrialBalance()}
        {activeReport === 'aging' && renderAging()}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Financial Reports"
        description="Generate dynamic P&L, Balance Sheet, Cash Flow, Trial Balance, and Aging reports."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Reports' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={handleExportCSV} disabled={!reportData}>
              <Download style={{ marginRight: 'var(--space-2)' }} /> Export
            </Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        {/* Left Sidebar — Report Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {(Object.entries(reportMeta) as [ReportType, typeof reportMeta[ReportType]][]).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => { setActiveReport(key); setReportData(null); setError(null); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                activeReport === key
                  ? 'bg-primary/5 border-primary text-primary font-medium shadow-sm'
                  : 'bg-card hover:bg-muted/50 border-transparent'
              }`}
            >
              {meta.icon}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{meta.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{meta.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Right Panel — Report View */}
        <div className="md:col-span-3">
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
                {/* Date filters change based on report type */}
                {(activeReport === 'pnl' || activeReport === 'cash-flow') && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                      <Calendar style={{ color: 'var(--color-text-secondary)' }} />
                      <input
                        type="date"
                        style={{ fontSize: 'var(--text-sm)', paddingInline: 'var(--space-2)' }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                      <input
                        type="date"
                        style={{ fontSize: 'var(--text-sm)', paddingInline: 'var(--space-2)' }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
                {(activeReport === 'balance-sheet' || activeReport === 'trial-balance') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <Calendar style={{ color: 'var(--color-text-secondary)' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>As of:</span>
                    <input
                      type="date"
                      style={{ fontSize: 'var(--text-sm)', paddingInline: 'var(--space-2)' }}
                      value={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.value)}
                    />
                  </div>
                )}
                {activeReport === 'aging' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                      <Filter style={{ color: 'var(--color-text-secondary)' }} />
                      <select
                        style={{ fontSize: 'var(--text-sm)', paddingInline: 'var(--space-2)' }}
                        value={agingType}
                        onChange={(e) => setAgingType(e.target.value as 'AR' | 'AP')}
                      >
                        <option value="AR">Accounts Receivable</option>
                        <option value="AP">Accounts Payable</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                      <Calendar style={{ color: 'var(--color-text-secondary)' }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>As of:</span>
                      <input
                        type="date"
                        style={{ fontSize: 'var(--text-sm)', paddingInline: 'var(--space-2)' }}
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <Button onClick={generateReport} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" style={{ marginRight: 'var(--space-2)' }} /> : <FileText style={{ marginRight: 'var(--space-2)' }} />}
                Generate Report
              </Button>
            </div>

            {/* Report Content */}
            <div style={{ flex: '1', padding: 'var(--space-6)' }}>
              {!reportData && !loading && !error && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                  <FileText style={{ marginBottom: 'var(--space-4)' }} />
                  <p style={{ fontSize: 'var(--text-lg)' }}>Select a report and click Generate</p>
                  <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Choose from the left panel and set date filters</p>
                </div>
              )}
              {renderReport()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}