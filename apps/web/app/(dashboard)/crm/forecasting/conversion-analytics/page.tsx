'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Spinner, Badge, useToast, DataTable, type Column } from '@unerp/ui';
import { Filter, TrendingUp } from 'lucide-react';
import { apiGet, ApiRequestError } from '../../../../../src/lib/api';

interface FunnelSummary {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  wonOpportunities: number;
  leadToQualifiedRate: number;
  qualifiedToConvertedRate: number;
  convertedToWonRate: number;
  overallLeadToWonRate: number;
  averageCycleDays: number | null;
}

interface FunnelGroupRow {
  groupLabel: string;
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  wonOpportunities: number;
  leadToQualifiedRate: number;
  qualifiedToConvertedRate: number;
  overallLeadToWonRate: number;
}

interface TrendBucket {
  weekStart: string;
  leadsCreated: number;
  leadsConverted: number;
  opportunitiesWon: number;
}

type Breakdown = 'source' | 'campaign' | 'rep';

export default function ConversionAnalyticsPage() {
  const [summary, setSummary] = useState<FunnelSummary | null>(null);
  const [bySource, setBySource] = useState<FunnelGroupRow[]>([]);
  const [byCampaign, setByCampaign] = useState<FunnelGroupRow[]>([]);
  const [byRep, setByRep] = useState<FunnelGroupRow[]>([]);
  const [trend, setTrend] = useState<TrendBucket[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown>('source');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, sourceData, campaignData, repData, trendData] = await Promise.all([
        apiGet<FunnelSummary>('/crm/conversion-analytics/summary'),
        apiGet<FunnelGroupRow[]>('/crm/conversion-analytics/by-source'),
        apiGet<FunnelGroupRow[]>('/crm/conversion-analytics/by-campaign'),
        apiGet<FunnelGroupRow[]>('/crm/conversion-analytics/by-rep'),
        apiGet<TrendBucket[]>('/crm/conversion-analytics/trend?weeks=12'),
      ]);
      setSummary(summaryData);
      setBySource(Array.isArray(sourceData) ? sourceData : []);
      setByCampaign(Array.isArray(campaignData) ? campaignData : []);
      setByRep(Array.isArray(repData) ? repData : []);
      setTrend(Array.isArray(trendData) ? trendData : []);
    } catch (err) {
      toast.error('Could not load conversion analytics', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const activeRows = breakdown === 'source' ? bySource : breakdown === 'campaign' ? byCampaign : byRep;

  const columns: Column<FunnelGroupRow>[] = [
    { key: 'groupLabel', header: breakdown === 'source' ? 'Lead Source' : breakdown === 'campaign' ? 'Campaign' : 'Rep', render: (r) => (
      <div style={{ fontWeight: 'var(--weight-semibold)' }}>{r.groupLabel}</div>
    ) },
    { key: 'totalLeads', header: 'Leads', render: (r) => r.totalLeads },
    { key: 'qualifiedLeads', header: 'Qualified', render: (r) => r.qualifiedLeads },
    { key: 'convertedLeads', header: 'Converted', render: (r) => r.convertedLeads },
    { key: 'wonOpportunities', header: 'Won', render: (r) => r.wonOpportunities },
    { key: 'leadToQualifiedRate', header: 'Lead→Qualified', render: (r) => `${r.leadToQualifiedRate}%` },
    { key: 'qualifiedToConvertedRate', header: 'Qualified→Converted', render: (r) => `${r.qualifiedToConvertedRate}%` },
    { key: 'overallLeadToWonRate', header: 'Overall Lead→Won', render: (r) => (
      <Badge variant={r.overallLeadToWonRate >= 10 ? 'success' : r.overallLeadToWonRate >= 3 ? 'default' : 'danger'}>{r.overallLeadToWonRate}%</Badge>
    ) },
  ];

  const trendColumns: Column<TrendBucket>[] = [
    { key: 'weekStart', header: 'Week Of', render: (t) => t.weekStart },
    { key: 'leadsCreated', header: 'Leads Created', render: (t) => t.leadsCreated },
    { key: 'leadsConverted', header: 'Leads Converted', render: (t) => t.leadsConverted },
    { key: 'opportunitiesWon', header: 'Opportunities Won', render: (t) => t.opportunitiesWon },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Lead-to-Opportunity Conversion Analytics"
        description="Salesforce/HubSpot-style funnel conversion-rate reporting by lead source, campaign, and rep, with average sales-cycle time and a trailing 12-week trend."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Forecasting', href: '/crm/forecasting' }, { label: 'Conversion Analytics' }]}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
      ) : !summary || summary.totalLeads === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <TrendingUp size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Lead Data Yet</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Once leads start flowing in, funnel conversion rates will appear here.</div>
          </div>
        </Card>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
            <Card><div style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Leads</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.totalLeads}</div>
            </div></Card>
            <Card><div style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Lead → Qualified</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.leadToQualifiedRate}%</div>
            </div></Card>
            <Card><div style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Qualified → Converted</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.qualifiedToConvertedRate}%</div>
            </div></Card>
            <Card><div style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Converted → Won</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.convertedToWonRate}%</div>
            </div></Card>
            <Card><div style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Overall Lead → Won</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.overallLeadToWonRate}%</div>
            </div></Card>
            <Card><div style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Avg Sales Cycle</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.averageCycleDays !== null ? `${summary.averageCycleDays}d` : '—'}</div>
            </div></Card>
          </div>

          <Card>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Filter size={16} />
              <span style={{ fontWeight: 'var(--weight-semibold)' }}>Breakdown by</span>
              {(['source', 'campaign', 'rep'] as Breakdown[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBreakdown(b)}
                  className={breakdown === b ? 'frappe-btn-primary' : 'frappe-btn-secondary'}
                  style={{ textTransform: 'capitalize', padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-sm)' }}
                >
                  {b}
                </button>
              ))}
            </div>
            {activeRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>No data for this breakdown yet.</div>
            ) : (
              <DataTable<FunnelGroupRow> columns={columns} data={activeRows} rowKey={(r) => r.groupLabel} />
            )}
          </Card>

          <Card>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', fontWeight: 'var(--weight-semibold)' }}>
              Trailing 12-Week Trend
            </div>
            <DataTable<TrendBucket> columns={trendColumns} data={trend} rowKey={(t) => t.weekStart} />
          </Card>
        </>
      )}
    </div>
  );
}
