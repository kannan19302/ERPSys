'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, PageHeader, StatusBadge, Spinner, Button } from '@unerp/ui';
import {
  Users, TrendingUp, BarChart3, Target, ChevronRight,
  AlertCircle,
  Activity, UserPlus, DollarSign, PieChart
} from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  totalVendors: number;
  totalLeads: number;
  totalOpportunities: number;
  pipelineValue: number;
  winRate: number;
  recentActivities: Array<{ id: string; type: string; subject: string; createdAt: string }>;
  leadStatusBreakdown: Record<string, number>;
  opportunityStageBreakdown: Record<string, { count: number; totalAmount: number }>;
}

export default function CrmDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0, totalVendors: 0, totalLeads: 0, totalOpportunities: 0,
    pipelineValue: 0, winRate: 0, recentActivities: [],
    leadStatusBreakdown: {}, opportunityStageBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const [customersRes, vendorsRes, leadsRes, opportunitiesRes, winRateRes, activitiesRes] = await Promise.all([
        fetch('/api/v1/crm/customers', { headers }),
        fetch('/api/v1/crm/vendors', { headers }),
        fetch('/api/v1/crm/leads', { headers }),
        fetch('/api/v1/crm/opportunities', { headers }),
        fetch('/api/v1/crm/analytics/win-rate', { headers }),
        fetch('/api/v1/crm/activities', { headers }),
      ]);

      const customers = customersRes.ok ? await customersRes.json() : [];
      const vendors = vendorsRes.ok ? await vendorsRes.json() : [];
      const leads = leadsRes.ok ? await leadsRes.json() : [];
      const opportunities = opportunitiesRes.ok ? await opportunitiesRes.json() : [];
      const winRateData = winRateRes.ok ? await winRateRes.json() : {};
      const activities = activitiesRes.ok ? (await activitiesRes.json()).slice(0, 5) : [];

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

      setStats({
        totalCustomers: customers.length,
        totalVendors: vendors.length,
        totalLeads: leads.length,
        totalOpportunities: opportunities.length,
        pipelineValue,
        winRate: winRateData.winRate || 0,
        recentActivities: activities,
        leadStatusBreakdown: statusBreakdown,
        opportunityStageBreakdown: stageBreakdown,
      });
    } catch {
      setError('Could not load CRM data. Using demo mode.');
      setStats({
        totalCustomers: 3, totalVendors: 2, totalLeads: 12, totalOpportunities: 8,
        pipelineValue: 245000, winRate: 42,
        recentActivities: [],
        leadStatusBreakdown: { NEW: 5, CONTACTED: 4, QUALIFIED: 2, DISQUALIFIED: 1 },
        opportunityStageBreakdown: {
          PROSPECTING: { count: 3, totalAmount: 45000 },
          QUALIFICATION: { count: 2, totalAmount: 80000 },
          PROPOSAL: { count: 1, totalAmount: 50000 },
          NEGOTIATION: { count: 1, totalAmount: 70000 },
          CLOSED_WON: { count: 1, totalAmount: 15000 },
        },
      });
    } finally {
      setLoading(false);
    }
  };

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

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

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
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Win Rate</span>
            <BarChart3 size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0' }}>{stats.winRate}%</h3>
        </Card>
      </div>

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
        </div>
      </Card>
    </div>
  );
}