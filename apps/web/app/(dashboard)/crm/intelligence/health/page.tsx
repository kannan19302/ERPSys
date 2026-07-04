'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge, DataTable } from '@unerp/ui';
import { Heart, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function CustomerHealthPage() {
    const [loading, setLoading] = useState(true);
    const [atRisk, setAtRisk] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token || ''}` };
            try {
                const res = await fetch('/api/v1/crm/customers/at-risk?threshold=70', { headers });
                if (res.ok) { const d = await res.json(); setAtRisk(d?.data ?? d ?? []); }
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const fetchCustomerHealth = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/v1/crm/customers/${id}/health`, { headers: { Authorization: `Bearer ${token || ''}` } });
            if (res.ok) { const d = await res.json(); setSelectedCustomer(d?.data ?? d); }
        } catch { /* ignore */ }
    };

    if (loading) return <div className="frappe-page"><Spinner /></div>;

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'success';
            case 'attention': return 'warning';
            case 'at_risk': return 'danger';
            case 'churned': return 'danger';
            default: return 'default';
        }
    };

    const columns = [
        { header: 'Customer', accessor: 'customerName' },
        { header: 'Health Score', accessor: 'healthScore', render: (r: any) => <StatusBadge status={getHealthColor(r.status)} /> },
        { header: 'Status', accessor: 'status' },
        { header: 'Churn Risk', accessor: 'churnProbability' },
    ];

    return (
        <div className="frappe-page">
            <PageHeader title="Customer Health & Churn Prediction" description="Monitor customer health scores and identify at-risk accounts" breadcrumbs={[{ label: 'CRM Intelligence', href: '/crm/intelligence' }, { label: 'Customer Health' }]} />

            <div className="frappe-grid-2" style={{ marginBottom: 'var(--space-6)' }}>
                <Card>
                    <div className="frappe-card-header"><h3 className="frappe-card-title">At-Risk Customers</h3></div>
                    <div className="frappe-card-body">
                        {atRisk.length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No at-risk customers found</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {atRisk.slice(0, 10).map((c: any) => (
                                    <div key={c.customerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => fetchCustomerHealth(c.customerId)}>
                                        <div>
                                            <strong style={{ fontSize: 'var(--text-sm)' }}>{c.customerName}</strong>
                                            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Score: {c.healthScore}/100 - {c.churnProbability} risk</p>
                                        </div>
                                        <StatusBadge status={getHealthColor(c.status)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                <Card>
                    <div className="frappe-card-header"><h3 className="frappe-card-title">Health Details</h3></div>
                    <div className="frappe-card-body">
                        {selectedCustomer ? (
                            <div>
                                <h4 style={{ margin: '0 0 var(--space-3)' }}>{selectedCustomer.customerName}</h4>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                                    <StatusBadge status={getHealthColor(selectedCustomer.status)} />
                                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Score: {selectedCustomer.healthScore}/100</span>
                                </div>
                                {selectedCustomer.dimensions && Object.entries(selectedCustomer.dimensions).map(([key, dim]: [string, any]) => (
                                    <div key={key} style={{ marginBottom: 'var(--space-2)', padding: 'var(--space-2)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                                            <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                                            <span>{dim.score}/{dim.maxScore}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{dim.details}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Click a customer to see health details</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
}