'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, PageHeader, StatusBadge, Spinner, Button } from '@unerp/ui';
import { useCustomers, useVendors, useLeads, useOpportunities, useActivities } from '../../../src/lib/hooks/useModuleData';
import { useApiQuery } from '../../../src/lib/hooks/useApi';
import {
  Users, TrendingUp, BarChart3, Target, ChevronRight,
  Activity, UserPlus, DollarSign, PieChart, Zap, BookOpen,
  FileText, MapPin, Package, Globe, Layers
} from 'lucide-react';

interface ForecastData {
  bestCase: number;
  commit: number;
  worstCase: number;
  dealCount: number;
}

interface DashboardStats {
  totalCustomers: number;
  totalVendors: number;
  totalLeads: number;
  totalOpportunities: number;
  pipelineValue: number;
  weightedPipeline: number;
  winRate: number;
  recentActivities: Array<{ id: string; type: string; subject: string; createdAt: string }>;
  leadStatusBreakdown: Record<string, number>;
  opportunityStageBreakdown: Record<string, { count: number; totalAmount: number }>;
  forecast: ForecastData;
}

export default function CrmDashboard() {
  const { data: customersRaw = [], isLoading: loadingCustomers } = useCustomers();
  const { data: vendorsRaw = [], isLoading: loadingVendors } = useVendors();
  const { data: leadsRaw = [], isLoading: loadingLeads } = useLeads();
  const { data: opportunitiesRaw = [], isLoading: loadingOpps } = useOpportunities();
  const { data: activitiesRaw = [] } = useActivities();
  const customers = customersRaw as any[];
  const vendors = vendorsRaw as any[];
  const leads = leadsRaw as any[];
  const opportunities = opportunitiesRaw as any[];
  const activities = activitiesRaw as any[];
  const { data: winRateData } = useApiQuery<{ winRate?: number }>(['crm', 'analytics', 'win-rate'], '/crm/analytics/win-rate');
  const { data: forecastData } = useApiQuery<ForecastData>(['crm', 'analytics', 'forecast'], '/crm/analytics/forecast');
  const { data: healthData } = useApiQuery<{ weightedPipeline?: number }>(['crm', 'analytics', 'pipeline-health'], '/crm/analytics/pipeline-health');

  const loading = loadingCustomers || loadingVendors || loadingLeads || loadingOpps;

  const stats = useMemo<DashboardStats>(() => {
    const stageBreakdown: Record<string, { count: number; totalAmount: number }> = {};
    let pipelineValue = 0;
    for (const opp of opportunities) {
      const stage = opp.stage || 'PROSPECTING';
      if (!stageBreakdown[stage]) stageBreakdown[stage] = { count: 0, totalAmount: 0 };
      stageBreakdown[stage].count++;
      stageBreakdown[stage].totalAmount += Number(opp.amount || 0);
      if (stage !== 'CLOSED_LOST') pipelineValue += Number(opp.amount || 0);
    }

    const statusBreakdown: Record<string, number> = {};
    for (const lead of leads) {
      statusBreakdown[lead.status] = (statusBreakdown[lead.status] || 0) + 1;
    }

    return {
      totalCustomers: customers.length,
      totalVendors: vendors.length,
      totalLeads: leads.length,
      totalOpportunities: opportunities.length,
      pipelineValue,
      winRate: winRateData?.winRate || 0,
      weightedPipeline: healthData?.weightedPipeline || 0,
      recentActivities: (activities as any[]).slice(0, 5),
      leadStatusBreakdown: statusBreakdown,
      opportunityStageBreakdown: stageBreakdown,
      forecast: forecastData || { bestCase: 0, commit: 0, worstCase: 0, dealCount: 0 },
    };
  }, [customers, vendors, leads, opportunities, activities, winRateData, forecastData, healthData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="CRM & Sales Dashboard"
        description="Overview of customers, leads, opportunities, and sales performance"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link href="/crm/leads">
              <Button variant="primary" size="sm">View Leads</Button>
            </Link>
            <Link href="/crm/opportunities">
              <Button variant="outline" size="sm">View Pipeline</Button>
            </Link>
          </div>
        }
      />

      {/* Error handling is managed by React Query */}

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Customers</span>
            <Users size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0' }}>{stats.totalCustomers}</h3>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Leads</span>
            <UserPlus size={18} style={{ color: 'var(--color-warning)' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0' }}>{stats.totalLeads}</h3>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Opportunities</span>
            <Target size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0' }}>{stats.totalOpportunities}</h3>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Pipeline Value</span>
            <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0' }}>${stats.pipelineValue.toLocaleString()}</h3>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Weighted Pipeline</span>
            <TrendingUp size={18} style={{ color: 'var(--color-info)' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0' }}>${stats.weightedPipeline.toLocaleString()}</h3>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Win Rate</span>
            <BarChart3 size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0' }}>{stats.winRate}%</h3>
        </Card>
      </div>

      {/* Forecast Cards */}
      <Card padding="md">
        <h4 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Revenue Forecast</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-success)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Best Case</span>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 'var(--space-1) 0 0', color: 'var(--color-success)' }}>${stats.forecast.bestCase.toLocaleString()}</p>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Commit (70%+)</span>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 'var(--space-1) 0 0', color: 'var(--color-primary)' }}>${stats.forecast.commit.toLocaleString()}</p>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-warning)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Worst Case (90%+)</span>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 'var(--space-1) 0 0', color: 'var(--color-warning)' }}>${stats.forecast.worstCase.toLocaleString()}</p>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-text-muted)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Open Deals</span>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 'var(--space-1) 0 0' }}>{stats.forecast.dealCount}</p>
          </div>
        </div>
      </Card>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Lead Status Breakdown */}
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Lead Status Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {Object.entries(stats.leadStatusBreakdown).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                <StatusBadge status={status} />
                <span style={{ fontWeight: 'var(--weight-bold)' }}>{count}</span>
              </div>
            ))}
            {Object.keys(stats.leadStatusBreakdown).length === 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>No leads data yet</p>
            )}
          </div>
        </Card>

        {/* Pipeline Funnel */}
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Pipeline Stages</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {Object.entries(stats.opportunityStageBreakdown).map(([stage, data]) => (
              <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <StatusBadge status={stage} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{data.count}</span>
                </div>
                <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>${data.totalAmount.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(stats.opportunityStageBreakdown).length === 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>No opportunities yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <Card padding="md">
        <h4 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Quick Actions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          <Link href="/crm/customers" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <Users size={16} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Customers</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/leads" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <TrendingUp size={16} style={{ color: 'var(--color-warning)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Leads</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/opportunities" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <BarChart3 size={16} style={{ color: 'var(--color-success)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Opportunities</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/contacts" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <Users size={16} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Contacts</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/activities" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <Activity size={16} style={{ color: 'var(--color-info)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Activities</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/reports" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <PieChart size={16} style={{ color: 'var(--color-danger)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Reports</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/products" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <Package size={16} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Products</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/forecasting" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <TrendingUp size={16} style={{ color: 'var(--color-success)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Forecasting</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/workflows" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <Zap size={16} style={{ color: 'var(--color-warning)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Workflows</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/territories" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <MapPin size={16} style={{ color: 'var(--color-info)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Territories</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/forms" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <Globe size={16} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Web Forms</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
          <Link href="/crm/documents" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>Documents</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}