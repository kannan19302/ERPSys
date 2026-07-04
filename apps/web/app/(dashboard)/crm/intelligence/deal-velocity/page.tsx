'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge, DataTable } from '@unerp/ui';
import { TrendingUp, AlertTriangle, Clock } from 'lucide-react';

export default function DealVelocityPage() {
    const [loading, setLoading] = useState(true);
    const [velocity, setVelocity] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/v1/crm/analytics/deal-velocity', { headers: { Authorization: `Bearer ${token || ''}` } });
                if (res.ok) { const d = await res.json(); setVelocity(d?.data ?? d); }
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return <div className="frappe-page"><Spinner /></div>;

    return (
        <div className="frappe-page">
            <PageHeader title="Deal Velocity Analysis" description="Stage duration analysis and stagnating deal detection" breadcrumbs={[{ label: 'CRM Intelligence', href: '/crm/intelligence' }, { label: 'Deal Velocity' }]} />

            <div className="frappe-grid-2" style={{ marginBottom: 'var(--space-6)' }}>
                <Card>
                    <div className="frappe-card-header"><h3 className="frappe-card-title">Stage Duration Averages</h3></div>
                    <div className="frappe-card-body">
                        {velocity?.stageAverages?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {velocity.stageAverages.map((s: any) => (
                                    <div key={s.stage} style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                            <strong style={{ fontSize: 'var(--text-sm)' }}>{s.stage}</strong>
                                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{s.avgDays}d avg</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                            <span>Min: {s.minDays}d</span>
                                            <span>Max: {s.maxDays}d</span>
                                            <span>{s.dealCount} deals</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p style={{ color: 'var(--color-text-secondary)' }}>No stage data available</p>}
                    </div>
                </Card>

                <Card>
                    <div className="frappe-card-header"><h3 className="frappe-card-title">Stagnating Deals</h3></div>
                    <div className="frappe-card-body">
                        {velocity?.stagnatingDeals?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {velocity.stagnatingDeals.map((d: any) => (
                                    <div key={d.id} style={{ padding: 'var(--space-3)', background: '#fef2f2', borderRadius: 'var(--radius-sm)', border: '1px solid #fecaca' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong style={{ fontSize: 'var(--text-sm)' }}>{d.name}</strong>
                                            <StatusBadge status="danger" />
                                        </div>
                                        <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                            Stage: {d.stage} | {d.daysInStage}d in stage (avg: {d.avgForStage}d) | {d.customerName}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : <p style={{ color: 'var(--color-text-secondary)' }}>No stagnating deals found</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
}