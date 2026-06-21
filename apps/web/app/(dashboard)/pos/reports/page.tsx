'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, CreditCard, Percent, Clock } from 'lucide-react';

export default function POSReportsPage() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadSummary = async (date?: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = date ? `?date=${date}` : '';
            const res = await fetch(`/api/v1/pos/summary/daily${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data === 'object' && !data.statusCode) {
                    setSummary(data);
                } else {
                    setSummary(null);
                }
            } else {
                setSummary(null);
            }
        } catch {
            setSummary(null);
        }
        setLoading(false);
    };

    useEffect(() => { loadSummary(); }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <BarChart3 style={{ color: 'var(--color-primary)' }} />
                    POS Sales Analytics
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Daily sales summary, payment breakdown, and performance metrics.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>Loading...</div>
            ) : summary ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                        {[
                            { label: 'Total Sales', value: `$${(summary.totalSales ?? 0).toFixed(2)}`, icon: <TrendingUp size={20} />, color: 'var(--color-success)' },
                            { label: 'Net Sales', value: `$${(summary.netSales ?? 0).toFixed(2)}`, icon: <DollarSign size={20} />, color: 'var(--color-primary)' },
                            { label: 'Returns', value: `$${(summary.totalReturns ?? 0).toFixed(2)}`, icon: <ShoppingBag size={20} />, color: 'var(--color-warning)' },
                            { label: 'Transactions', value: String(summary.totalTransactions ?? 0), icon: <ShoppingBag size={20} />, color: 'var(--color-primary)' },
                            { label: 'Avg Order Value', value: `$${(summary.averageOrderValue ?? 0).toFixed(2)}`, icon: <DollarSign size={20} />, color: 'var(--color-primary)' },
                        ].map((stat, i) => (
                            <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                    <div style={{ color: stat.color }}>{stat.icon}</div>
                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{stat.label}</span>
                                </div>
                                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Payment Method Breakdown</h3>
                        {summary.paymentBreakdown && Object.entries(summary.paymentBreakdown).length > 0 ? (
                            Object.entries(summary.paymentBreakdown).map(([method, amount]: [string, any]) => (
                                <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                                    <span>{method}</span>
                                    <span style={{ fontWeight: 'var(--weight-bold)' }}>${Number(amount ?? 0).toFixed(2)}</span>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No payment data for this period.</p>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                    No sales data available. Complete a POS transaction to see analytics.
                </div>
            )}

            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Available Reports</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                    {[
                        { label: 'Sales by Product', endpoint: '/api/v1/pos/reports/sales-by-product', icon: <ShoppingBag size={16} /> },
                        { label: 'Sales by Cashier', endpoint: '/api/v1/pos/reports/sales-by-cashier', icon: <Users size={16} /> },
                        { label: 'Sales by Hour', endpoint: '/api/v1/pos/reports/sales-by-hour', icon: <Clock size={16} /> },
                        { label: 'Sales by Payment', endpoint: '/api/v1/pos/reports/sales-by-payment', icon: <CreditCard size={16} /> },
                        { label: 'Discount Usage', endpoint: '/api/v1/pos/reports/discount-usage', icon: <Percent size={16} /> },
                        { label: 'Customer Insights', endpoint: '/api/v1/pos/reports/customer-insights', icon: <Users size={16} /> },
                    ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                            onClick={() => window.open(r.endpoint, '_blank')}>
                            <span style={{ color: 'var(--color-primary)' }}>{r.icon}</span>
                            <span style={{ fontSize: 'var(--text-sm)' }}>{r.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}