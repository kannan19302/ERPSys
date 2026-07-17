'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Spinner, Badge, useToast, DataTable, type Column } from '@unerp/ui';
import { Filter, TrendingUp } from 'lucide-react';
import { apiGet, ApiRequestError } from '../../../../../src/lib/api';
import styles from './page.module.css';

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
      <div className="font-semibold">{r.groupLabel}</div>
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
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Lead-to-Opportunity Conversion Analytics"
        description="Salesforce/HubSpot-style funnel conversion-rate reporting by lead source, campaign, and rep, with average sales-cycle time and a trailing 12-week trend."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Forecasting', href: '/crm/forecasting' }, { label: 'Conversion Analytics' }]}
      />

      {loading ? (
        <div className="ui-center-pad"><Spinner size="lg" /></div>
      ) : !summary || summary.totalLeads === 0 ? (
        <Card>
          <div className="ui-empty-state">
            <TrendingUp size={48} className="ui-hr-faded" />
            <div className="font-semibold">No Lead Data Yet</div>
            <div className="text-sm">Once leads start flowing in, funnel conversion rates will appear here.</div>
          </div>
        </Card>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <Card><div className="p-4">
              <div className="ui-text-xs-muted">Total Leads</div>
              <div className="text-2xl">{summary.totalLeads}</div>
            </div></Card>
            <Card><div className="p-4">
              <div className="ui-text-xs-muted">Lead → Qualified</div>
              <div className="text-2xl">{summary.leadToQualifiedRate}%</div>
            </div></Card>
            <Card><div className="p-4">
              <div className="ui-text-xs-muted">Qualified → Converted</div>
              <div className="text-2xl">{summary.qualifiedToConvertedRate}%</div>
            </div></Card>
            <Card><div className="p-4">
              <div className="ui-text-xs-muted">Converted → Won</div>
              <div className="text-2xl">{summary.convertedToWonRate}%</div>
            </div></Card>
            <Card><div className="p-4">
              <div className="ui-text-xs-muted">Overall Lead → Won</div>
              <div className="text-2xl">{summary.overallLeadToWonRate}%</div>
            </div></Card>
            <Card><div className="p-4">
              <div className="ui-text-xs-muted">Avg Sales Cycle</div>
              <div className="text-2xl">{summary.averageCycleDays !== null ? `${summary.averageCycleDays}d` : '—'}</div>
            </div></Card>
          </div>

          <Card>
            <div className={styles.breakdownHeader}>
              <Filter size={16} />
              <span className="font-semibold">Breakdown by</span>
              {(['source', 'campaign', 'rep'] as Breakdown[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBreakdown(b)}
                  className={`${breakdown === b ? 'ui-btn-primary' : 'ui-btn-secondary'} ${styles.breakdownButton}`}
                >
                  {b}
                </button>
              ))}
            </div>
            {activeRows.length === 0 ? (
              <div className={styles.emptyBreakdown}>No data for this breakdown yet.</div>
            ) : (
              <DataTable<FunnelGroupRow> columns={columns} data={activeRows} rowKey={(r) => r.groupLabel} />
            )}
          </Card>

          <Card>
            <div className={styles.trendHeader}>
              Trailing 12-Week Trend
            </div>
            <DataTable<TrendBucket> columns={trendColumns} data={trend} rowKey={(t) => t.weekStart} />
          </Card>
        </>
      )}
    </div>
  );
}
