'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Loader2, FileText, CheckCircle2,
  AlertCircle, ShieldAlert, DollarSign, Calendar
} from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function TaxFilingSummaryPage() {
  const client = useApiClient();
  const [summary, setSummary] = useState<FilingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2026');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await client.get<FilingSummary>(`/advanced-finance/tax-filings/summary?year=${year}`));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [client, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.tax.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between ui-items-start">
        <div>
          <h1 className="text-3xl">Tax Filing Summary</h1>
          <p className="ui-text-muted mt-1">
            Compliance dashboard displaying GST/VAT returns, computed liability, filing statuses, and tax audit readiness.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <select
            className={`ui-input ${styles.s1}`}
            value={year}
            onChange={e => setYear(e.target.value)}

          >
            <option value="2025">Year 2025</option>
            <option value="2026">Year 2026</option>
            <option value="2027">Year 2027</option>
          </select>
          <Button variant="outline" onClick={fetchSummary}>
            <RefreshCw size={16} className="mr-2" />Refresh
          </Button>
        </div>
      </div>

      {summary && (
        <>
          {/* KPI Cards */}
          <StatCardRow stats={[
            { label: 'Total Filings', value: String(summary.totalFilings), icon: <FileText size={20} />, color: 'var(--color-primary)' },
            { label: 'Tax Liability', value: fmt(summary.totalTaxLiability), icon: <DollarSign size={20} />, color: '#ef4444' },
            { label: 'Tax Paid', value: fmt(summary.totalTaxPaid), icon: <CheckCircle2 size={20} />, color: '#22c55e' },
            { label: 'Pending Filings', value: String(summary.pendingFilings), icon: <AlertCircle size={20} />, color: '#f59e0b' },
          ]} />

          {/* Filings Table */}
          <Card className="ui-card ui-flex-col">
            <div className={styles.s2}>
              <ShieldAlert size={18} className="ui-text-primary" />
              <h3 className="ui-heading-base">Tax Returns History</h3>
            </div>
            <div className="builder-table-wrapper">
              {(() => {
                const filingColumns: ListColumn[] = [
                  { key: 'period', header: 'Period Range', render: (v) => <span className="font-medium">{v as string}</span> },
                  { key: 'type', header: 'Tax Type', render: (v) => <span className="ui-text-muted">{v as string}</span> },
                  { key: 'liability', header: 'Tax Liability', render: (v) => <span style={{ color: (v as number) > 0 ? '#ef4444' : '#22c55e' }} className={styles.s3}>{fmt(v as number)}</span> },
                  { key: 'status', header: 'Filing Status', render: (v) => <span style={{ background: (v as string) === 'FILED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: (v as string) === 'FILED' ? '#16a34a' : '#d97706' }} className={styles.s4}>{v as string}</span> },
                ];
                return (
                  <ListPageTemplate
                    columns={filingColumns}
                    data={summary.filings as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No Tax Filings"
                    emptyDescription={`No tax filings found for ${summary.year}.`}
                    searchable
                  />
                );
              })()}
            </div>
          </Card>
        </>
      )}
      </div>
    </RouteGuard>
  );
}
