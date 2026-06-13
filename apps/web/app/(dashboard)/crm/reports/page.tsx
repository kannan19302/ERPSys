'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import { TrendingUp, DollarSign, BarChart3, Users } from 'lucide-react';

interface OpportunitySummary {
    id: string;
    stage: string;
    amount: number | null;
}

interface LeadSummary {
    id: string;
    status: string;
}

interface AnalyticsData {
    funnel: Record<string, { count: number; totalAmount: number }>;
    winRate: { winRate: number };
    leadSources: Record<string, number>;
    opportunities: OpportunitySummary[];
    leads: LeadSummary[];
}

export default function CrmReportsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const h = { Authorization: `Bearer ${token || ''}` };
        Promise.all([
            fetch('/api/v1/crm/analytics/pipeline-funnel', { headers: h }).then(r => r.ok ? r.json() as Promise<Record<string, { count: number; totalAmount: number }>> : {} as Record<string, { count: number; totalAmount: number }>).catch(() => ({} as Record<string, { count: number; totalAmount: number }>)),
            fetch('/api/v1/crm/analytics/win-rate', { headers: h }).then(r => r.ok ? r.json() as Promise<{ winRate: number }> : { winRate: 0 }).catch(() => ({ winRate: 0 })),
            fetch('/api/v1/crm/analytics/lead-source-breakdown', { headers: h }).then(r => r.ok ? r.json() as Promise<Record<string, number>> : {} as Record<string, number>).catch(() => ({} as Record<string, number>)),
            fetch('/api/v1/crm/opportunities', { headers: h }).then(r => r.ok ? r.json() as Promise<OpportunitySummary[]> : [] as OpportunitySummary[]).catch(() => ([] as OpportunitySummary[])),
            fetch('/api/v1/crm/leads', { headers: h }).then(r => r.ok ? r.json() as Promise<LeadSummary[]> : [] as LeadSummary[]).catch(() => ([] as LeadSummary[])),
        ]).then(([funnel, winRate, leadSources, opportunities, leads]) => {
            setData({ funnel, winRate, leadSources, opportunities, leads });
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
    if (!data) return <div>Failed to load reports</div>;

    const totalPipeline = (data.opportunities || []).filter((o) => o.stage !== 'CLOSED_LOST').reduce((s: number, o) => s + Number(o.amount || 0), 0);
    const pipelineStages = Object.keys(data.funnel || {}).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader title="CRM Reports" description="Analytics and insights for your sales pipeline" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Reports' }]} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                <Card><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Pipeline Value</div><h3 style={{ margin: 'var(--space-1) 0' }}><DollarSign size={16} style={{ display: 'inline' }} /> {totalPipeline.toLocaleString()}</h3></Card>
                <Card><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Pipeline Stages</div><h3 style={{ margin: 'var(--space-1) 0' }}><BarChart3 size={16} style={{ display: 'inline' }} /> {pipelineStages}</h3></Card>
                <Card><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Win Rate</div><h3 style={{ margin: 'var(--space-1) 0', color: 'var(--color-success)' }}><TrendingUp size={16} style={{ display: 'inline' }} /> {data.winRate?.winRate || 0}%</h3></Card>
                <Card><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Leads</div><h3 style={{ margin: 'var(--space-1) 0' }}><Users size={16} style={{ display: 'inline' }} /> {(data.leads || []).length}</h3></Card>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                <Card padding="md">
                    <h4 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)' }}>Pipeline Funnel</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {Object.entries(data.funnel || {}).map(([stage, info]) => (
                            <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ fontSize: 'var(--text-xs)' }}>{stage}</span>
                                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>{info.count} deals / ${info.totalAmount.toLocaleString()}</span>
                            </div>
                        ))}
                        {Object.keys(data.funnel || {}).length === 0 && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>No pipeline data</p>}
                    </div>
                </Card>
                <Card padding="md">
                    <h4 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)' }}>Lead Sources</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {Object.entries(data.leadSources || {}).map(([source, count]) => (
                            <div key={source} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ fontSize: 'var(--text-xs)' }}>{source}</span>
                                <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)' }}>{count}</span>
                            </div>
                        ))}
                        {Object.keys(data.leadSources || {}).length === 0 && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>No lead source data</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
}