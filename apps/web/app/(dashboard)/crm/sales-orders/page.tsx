'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner } from '@unerp/ui';
import { Search, ClipboardList } from 'lucide-react';

interface SalesOrder { id: string; orderNumber: string; status: string; totalAmount: number; customerName: string; orderDate: string; }

export default function CrmSalesOrdersPage() {
    const [data, setData] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('/api/v1/sales/orders', { headers: { Authorization: `Bearer ${token || ''}` } })
            .then(r => r.ok ? r.json() : []).then(setData)
            .catch(() => setData([
                { id: 'so1', orderNumber: 'SO-2026-001', status: 'CONFIRMED', totalAmount: 45000, customerName: 'Stark Industries', orderDate: '2026-06-01' },
                { id: 'so2', orderNumber: 'SO-2026-002', status: 'DELIVERED', totalAmount: 85000, customerName: 'Wayne Enterprises', orderDate: '2026-05-15' },
                { id: 'so3', orderNumber: 'SO-2026-003', status: 'DRAFT', totalAmount: 120000, customerName: 'Stark Industries', orderDate: '2026-06-10' },
            ]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = data.filter(o => `${o.orderNumber} ${o.customerName}`.toLowerCase().includes(search.toLowerCase()));
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <PageHeader title="Sales Orders" description="Customer orders and fulfillments" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Sales Orders' }]} />
            <div style={{ position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
            </div>
            <Card padding="none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Order #</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Customer</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Status</th>
                    </tr></thead>
                    <tbody>{filtered.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}><ClipboardList size={14} style={{ marginRight: 'var(--space-2)' }} />{o.orderNumber}</td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{o.customerName}</td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>${Number(o.totalAmount).toLocaleString()}</td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(o.orderDate).toLocaleDateString()}</td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}><StatusBadge status={o.status} /></td>
                        </tr>
                    ))}</tbody>
                </table>
            </Card>
        </div>
    );
}