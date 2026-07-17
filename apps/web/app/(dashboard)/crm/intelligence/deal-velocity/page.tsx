'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge, DataTable } from '@unerp/ui';
import { TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

export default function DealVelocityPage() {
    const client = useApiClient();
    const [loading, setLoading] = useState(true);
    const [velocity, setVelocity] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const d = await client.get<any>('/crm/analytics/deal-velocity');
                setVelocity(d?.data ?? d);
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        fetchData();
    }, [client]);

    if (loading) return <div className="ui-page"><Spinner /></div>;

    return (
        <RouteGuard permission="crm.analytics.read">
        <div className="ui-page">
            <PageHeader title="Deal Velocity Analysis" description="Stage duration analysis and stagnating deal detection" breadcrumbs={[{ label: 'CRM Intelligence', href: '/crm/intelligence' }, { label: 'Deal Velocity' }]} />

            <div className={`ui-grid-2 ${styles.grid}`}>
                <Card>
                    <div className="ui-card-header"><h3 className="ui-card-title">Stage Duration Averages</h3></div>
                    <div className="ui-card-body">
                        {velocity?.stageAverages?.length > 0 ? (
                            <div className="ui-stack-3">
                                {velocity.stageAverages.map((s: any) => (
                                    <div key={s.stage} className={styles.stageCard}>
                                        <div className={styles.stageHeader}>
                                            <strong className="text-sm">{s.stage}</strong>
                                            <span className={styles.average}>{s.avgDays}d avg</span>
                                        </div>
                                        <div className={styles.stageMetrics}>
                                            <span>Min: {s.minDays}d</span>
                                            <span>Max: {s.maxDays}d</span>
                                            <span>{s.dealCount} deals</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="ui-text-muted">No stage data available</p>}
                    </div>
                </Card>

                <Card>
                    <div className="ui-card-header"><h3 className="ui-card-title">Stagnating Deals</h3></div>
                    <div className="ui-card-body">
                        {velocity?.stagnatingDeals?.length > 0 ? (
                            <div className="ui-stack-2">
                                {velocity.stagnatingDeals.map((d: any) => (
                                    <div key={d.id} className={styles.stagnatingCard}>
                                        <div className="ui-flex-between">
                                            <strong className="text-sm">{d.name}</strong>
                                            <StatusBadge status="danger" />
                                        </div>
                                        <p className={styles.stagnatingDescription}>
                                            Stage: {d.stage} | {d.daysInStage}d in stage (avg: {d.avgForStage}d) | {d.customerName}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="ui-text-muted">No stagnating deals found</p>}
                    </div>
                </Card>
            </div>
        </div>
        </RouteGuard>
    );
}
