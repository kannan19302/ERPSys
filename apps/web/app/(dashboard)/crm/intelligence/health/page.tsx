'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, StatusBadge } from '@unerp/ui';
import { useApiClient, RouteGuard } from '@unerp/framework';
import styles from './page.module.css';

export default function CustomerHealthPage() {
    const [loading, setLoading] = useState(true);
    const [atRisk, setAtRisk] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const client = useApiClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await client.get<any>('/crm/customers/at-risk?threshold=70');
                setAtRisk(res?.data ?? res ?? []);
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        fetchData();
    }, [client]);

    const fetchCustomerHealth = async (id: string) => {
        try {
            const res = await client.get<any>(`/crm/customers/${id}/health`);
            setSelectedCustomer(res?.data ?? res);
        } catch { /* ignore */ }
    };

    if (loading) return <RouteGuard permission="crm.read"><div className="ui-page"><Spinner /></div></RouteGuard>;

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'success';
            case 'attention': return 'warning';
            case 'at_risk': return 'danger';
            case 'churned': return 'danger';
            default: return 'default';
        }
    };

    return (
        <RouteGuard permission="crm.read">
            <div className="ui-page">
                <PageHeader title="Customer Health & Churn Prediction" description="Monitor customer health scores and identify at-risk accounts" breadcrumbs={[{ label: 'CRM Intelligence', href: '/crm/intelligence' }, { label: 'Customer Health' }]} />

                <div className={`ui-grid-2 ${styles.grid}`}>
                    <Card>
                        <div className="ui-card-header"><h3 className="ui-card-title">At-Risk Customers</h3></div>
                        <div className="ui-card-body">
                            {atRisk.length === 0 ? (
                                <p className="ui-text-sm-muted">No at-risk customers found</p>
                            ) : (
                                <div className="ui-stack-2">
                                    {atRisk.slice(0, 10).map((c: any) => (
                                        <button type="button" key={c.customerId} className={styles.customerRow} onClick={() => fetchCustomerHealth(c.customerId)}>
                                            <div>
                                                <strong className="text-sm">{c.customerName}</strong>
                                                <p className="ui-text-xs-muted m-0">Score: {c.healthScore}/100 - {c.churnProbability} risk</p>
                                            </div>
                                            <StatusBadge status={getHealthColor(c.status)} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className="ui-card-header"><h3 className="ui-card-title">Health Details</h3></div>
                        <div className="ui-card-body">
                            {selectedCustomer ? (
                                <div>
                                    <h4 className={styles.customerName}>{selectedCustomer.customerName}</h4>
                                    <div className={styles.healthSummary}>
                                        <StatusBadge status={getHealthColor(selectedCustomer.status)} />
                                        <span className="ui-text-sm-muted">Score: {selectedCustomer.healthScore}/100</span>
                                    </div>
                                    {selectedCustomer.dimensions && Object.entries(selectedCustomer.dimensions).map(([key, dim]: [string, any]) => (
                                        <div key={key} className={styles.dimension}>
                                            <div className={styles.dimensionHeader}>
                                                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                                                <span>{dim.score}/{dim.maxScore}</span>
                                            </div>
                                            <p className="ui-text-xs-muted m-0">{dim.details}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="ui-text-sm-muted">Click a customer to see health details</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </RouteGuard>
    );
}
