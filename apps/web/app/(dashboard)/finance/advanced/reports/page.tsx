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
  'pnl': { label: 'Profit & Loss', icon: <BarChart3 className="h-5 w-5" />, description: 'Revenue, expenses, and net profit for a period' },
  'balance-sheet': { label: 'Balance Sheet', icon: <PieChart className="h-5 w-5" />, description: 'Assets, liabilities, and equity as of a date' },
  'cash-flow': { label: 'Cash Flow', icon: <TrendingUp className="h-5 w-5" />, description: 'Operating, investing, and financing activities' },
  'trial-balance': { label: 'Trial Balance', icon: <BookOpen className="h-5 w-5" />, description: 'All accounts with debit/credit totals' },
  'aging': { label: 'AR/AP Aging', icon: <Clock className="h-5 w-5" />, description: 'Overdue invoices/purchase orders by aging bucket' },
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
      <div className="space-y-6">
        <div className="text-center pb-6 border-b">
          <h2 className="text-2xl font-bold uppercase tracking-widest">Profit & Loss Statement</h2>
          <p className="text-muted-foreground mt-2">
            For period {new Date(d.period.startDate).toLocaleDateString()} — {new Date(d.period.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Revenue Section */}
        <div>
          <h3 className="text-lg font-semibold text-green-600 mb-3">Revenue</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium">Account</th>
                <th className="text-right p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(d.revenueBreakdown || []).map((item, i) => (
                <tr key={i} className="border-b hover:bg-muted/20">
                  <td className="p-3">{item.name} <span className="text-muted-foreground text-xs">({item.code})</span></td>
                  <td className="p-3 text-right font-mono">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="border-b font-semibold bg-green-50">
                <td className="p-3">Total Revenue</td>
                <td className="p-3 text-right font-mono">{formatCurrency(d.revenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expenses Section */}
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-3">Expenses</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium">Account</th>
                <th className="text-right p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(d.expenseBreakdown || []).map((item, i) => (
                <tr key={i} className="border-b hover:bg-muted/20">
                  <td className="p-3">{item.name} <span className="text-muted-foreground text-xs">({item.code})</span></td>
                  <td className="p-3 text-right font-mono">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="border-b font-semibold bg-red-50">
                <td className="p-3">Total Expenses</td>
                <td className="p-3 text-right font-mono">{formatCurrency(d.expenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Profit */}
        <div className={`rounded-xl p-5 ${d.netProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Net {d.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
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
      <div className="space-y-6">
        <div className="text-center pb-6 border-b">
          <h2 className="text-2xl font-bold uppercase tracking-widest">Balance Sheet</h2>
          <p className="text-muted-foreground mt-2">As of {new Date(d.asOfDate).toLocaleDateString()}</p>
        </div>

        {/* Assets */}
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-3">Assets</h3>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b bg-muted/30"><th className="text-left p-3 font-medium">Account</th><th className="text-right p-3 font-medium">Balance</th></tr></thead>
            <tbody>
              {d.assets.current.accounts.map((a, i) => (
                <tr key={i} className="border-b hover:bg-muted/20"><td className="p-3 pl-6">{a.name} <span className="text-muted-foreground text-xs">({a.code})</span></td><td className="p-3 text-right font-mono">{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr className="border-b font-semibold"><td className="p-3 pl-6 text-muted-foreground">Current Assets Total</td><td className="p-3 text-right font-mono">{formatCurrency(d.assets.current.total)}</td></tr>
              {d.assets.nonCurrent.accounts.map((a, i) => (
                <tr key={i} className="border-b hover:bg-muted/20"><td className="p-3 pl-6">{a.name} <span className="text-muted-foreground text-xs">({a.code})</span></td><td className="p-3 text-right font-mono">{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr className="border-b font-semibold"><td className="p-3 pl-6 text-muted-foreground">Non-Current Assets Total</td><td className="p-3 text-right font-mono">{formatCurrency(d.assets.nonCurrent.total)}</td></tr>
              <tr className="font-bold bg-blue-50"><td className="p-3">Total Assets</td><td className="p-3 text-right font-mono">{formatCurrency(d.assets.total)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Liabilities */}
        <div>
          <h3 className="text-lg font-semibold text-orange-600 mb-3">Liabilities</h3>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b bg-muted/30"><th className="text-left p-3 font-medium">Account</th><th className="text-right p-3 font-medium">Balance</th></tr></thead>
            <tbody>
              {d.liabilities.current.accounts.map((a, i) => (
                <tr key={i} className="border-b hover:bg-muted/20"><td className="p-3 pl-6">{a.name} <span className="text-muted-foreground text-xs">({a.code})</span></td><td className="p-3 text-right font-mono">{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr className="border-b font-semibold"><td className="p-3 pl-6 text-muted-foreground">Current Liabilities Total</td><td className="p-3 text-right font-mono">{formatCurrency(d.liabilities.current.total)}</td></tr>
              {d.liabilities.nonCurrent.accounts.map((a, i) => (
                <tr key={i} className="border-b hover:bg-muted/20"><td className="p-3 pl-6">{a.name} <span className="text-muted-foreground text-xs">({a.code})</span></td><td className="p-3 text-right font-mono">{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr className="border-b font-semibold"><td className="p-3 pl-6 text-muted-foreground">Non-Current Liabilities Total</td><td className="p-3 text-right font-mono">{formatCurrency(d.liabilities.nonCurrent.total)}</td></tr>
              <tr className="font-bold bg-orange-50"><td className="p-3">Total Liabilities</td><td className="p-3 text-right font-mono">{formatCurrency(d.liabilities.total)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Equity */}
        <div>
          <h3 className="text-lg font-semibold text-purple-600 mb-3">Equity</h3>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b bg-muted/30"><th className="text-left p-3 font-medium">Account</th><th className="text-right p-3 font-medium">Balance</th></tr></thead>
            <tbody>
              {d.equity.accounts.map((a, i) => (
                <tr key={i} className="border-b hover:bg-muted/20"><td className="p-3 pl-6">{a.name} <span className="text-muted-foreground text-xs">({a.code})</span></td><td className="p-3 text-right font-mono">{formatCurrency(a.balance)}</td></tr>
              ))}
              <tr className="font-bold bg-purple-50"><td className="p-3">Total Equity</td><td className="p-3 text-right font-mono">{formatCurrency(d.equity.total)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-xl p-5 bg-blue-50 border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total Liabilities & Equity</span>
            <span className="text-2xl font-bold font-mono text-blue-600">{formatCurrency(d.totalLiabilitiesAndEquity)}</span>
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
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b bg-muted/30"><th className="text-left p-3 font-medium">Account</th><th className="text-right p-3 font-medium">Amount</th></tr></thead>
          <tbody>
            {data.details.map((item, i) => (
              <tr key={i} className="border-b hover:bg-muted/20">
                <td className="p-3 pl-6">{item.accountName}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50"><td className="p-3">Total {title}</td><td className="p-3 text-right font-mono">{formatCurrency(data.total)}</td></tr>
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="text-center pb-6 border-b">
          <h2 className="text-2xl font-bold uppercase tracking-widest">Statement of Cash Flows</h2>
          <p className="text-muted-foreground mt-2">
            For period {new Date(d.period.startDate).toLocaleDateString()} — {new Date(d.period.endDate).toLocaleDateString()}
          </p>
        </div>

        {renderSection('Operating Activities', d.operatingActivities, 'text-blue-600')}
        {renderSection('Investing Activities', d.investingActivities, 'text-orange-600')}
        {renderSection('Financing Activities', d.financingActivities, 'text-purple-600')}

        <div className={`rounded-xl p-5 ${d.netIncreaseInCash >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Net Increase in Cash</span>
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
      <div className="space-y-6">
        <div className="text-center pb-6 border-b">
          <h2 className="text-2xl font-bold uppercase tracking-widest">Trial Balance</h2>
          <p className="text-muted-foreground mt-2">As of {new Date(d.asOfDate).toLocaleDateString()}</p>
        </div>

        {d.isBalanced ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            <AlertCircle className="h-4 w-4" /> Trial Balance is <strong>balanced</strong> (Debits: {formatCurrency(d.totalDebits)} = Credits: {formatCurrency(d.totalCredits)})
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" /> Trial Balance is <strong>NOT balanced</strong> (Debits: {formatCurrency(d.totalDebits)} ≠ Credits: {formatCurrency(d.totalCredits)})
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Account</th>
                <th className="text-center p-3 font-medium">Type</th>
                <th className="text-right p-3 font-medium">Debit Total</th>
                <th className="text-right p-3 font-medium">Credit Total</th>
                <th className="text-right p-3 font-medium">Balance</th>
                <th className="text-right p-3 font-medium">Entries</th>
              </tr>
            </thead>
            <tbody>
              {d.accounts.map((acc, i) => (
                <tr key={i} className="border-b hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">{acc.code}</td>
                  <td className="p-3">{acc.name}</td>
                  <td className="p-3 text-center">
                    <StatusBadge status={acc.type} />
                  </td>
                  <td className="p-3 text-right font-mono">{formatCurrency(acc.debitTotal)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(acc.creditTotal)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(acc.balance)}</td>
                  <td className="p-3 text-right">{acc.entriesCount}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50 border-t-2">
                <td colSpan={3} className="p-3 text-right">Totals</td>
                <td className="p-3 text-right font-mono">{formatCurrency(d.totalDebits)}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(d.totalCredits)}</td>
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
      <div className="space-y-6">
        <div className="text-center pb-6 border-b">
          <h2 className="text-2xl font-bold uppercase tracking-widest">{d.type === 'AR' ? 'Accounts Receivable' : 'Accounts Payable'} Aging Report</h2>
          <p className="text-muted-foreground mt-2">As of {new Date(d.asOfDate).toLocaleDateString()}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(d.bucketTotals).map(([bucket, data]) => (
            <div key={bucket} className={`rounded-lg p-4 border ${bucketColors[bucket] || 'bg-gray-50 border-gray-200'}`}>
              <div className="text-xs font-medium mb-1">{bucket} days</div>
              <div className="text-lg font-bold">{data.count} items</div>
              <div className="text-sm font-mono">{formatCurrency(data.totalOutstanding)}</div>
            </div>
          ))}
          <div className="rounded-lg p-4 border bg-blue-50 border-blue-200 text-blue-700">
            <div className="text-xs font-medium mb-1">Total</div>
            <div className="text-lg font-bold">{d.totalItems} items</div>
            <div className="text-sm font-mono">{formatCurrency(d.totalOutstanding)}</div>
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
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left p-2 font-medium">Party</th>
                  <th className="text-left p-2 font-medium">Document</th>
                  <th className="text-right p-2 font-medium">Total</th>
                  <th className="text-right p-2 font-medium">Outstanding</th>
                  <th className="text-right p-2 font-medium">Days Overdue</th>
                </tr></thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b hover:bg-muted/20">
                      <td className="p-2">{item.partyName}</td>
                      <td className="p-2 font-mono text-xs">{item.documentNumber}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.totalAmount)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.outstanding)}</td>
                      <td className="p-2 text-right">{item.daysOverdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {d.totalItems === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-40" />
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
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Generating report...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report Generation Failed</h3>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={!reportData}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar — Report Selector */}
        <div className="md:col-span-1 space-y-2">
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
              <div className="text-left">
                <div className="text-sm font-medium">{meta.label}</div>
                <div className="text-xs text-muted-foreground">{meta.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Right Panel — Report View */}
        <div className="md:col-span-3">
          <Card className="min-h-[500px] flex flex-col border-primary/20">
            {/* Toolbar */}
            <div className="p-4 border-b bg-muted/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Date filters change based on report type */}
                {(activeReport === 'pnl' || activeReport === 'cash-flow') && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="date"
                        className="frappe-input text-sm py-1 px-2 w-36"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <span className="text-muted-foreground">—</span>
                      <input
                        type="date"
                        className="frappe-input text-sm py-1 px-2 w-36"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
                {(activeReport === 'balance-sheet' || activeReport === 'trial-balance') && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">As of:</span>
                    <input
                      type="date"
                      className="frappe-input text-sm py-1 px-2 w-36"
                      value={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.value)}
                    />
                  </div>
                )}
                {activeReport === 'aging' && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <select
                        className="frappe-input text-sm py-1 px-2"
                        value={agingType}
                        onChange={(e) => setAgingType(e.target.value as 'AR' | 'AP')}
                      >
                        <option value="AR">Accounts Receivable</option>
                        <option value="AP">Accounts Payable</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">As of:</span>
                      <input
                        type="date"
                        className="frappe-input text-sm py-1 px-2 w-36"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <Button onClick={generateReport} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate Report
              </Button>
            </div>

            {/* Report Content */}
            <div className="flex-1 p-6">
              {!reportData && !loading && !error && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                  <FileText className="h-16 w-16 mb-4 stroke-[1.5]" />
                  <p className="text-lg">Select a report and click Generate</p>
                  <p className="text-sm mt-1">Choose from the left panel and set date filters</p>
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