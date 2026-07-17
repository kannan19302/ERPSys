'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, CreditCard, Percent, Clock } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function POSReportsPage() {
    const client = useApiClient();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadSummary = async (date?: string) => {
        setLoading(true);
        try {
            const params = date ? `?date=${date}` : '';
            const data = await client.get<unknown>(`/pos/summary/daily${params}`);
            setSummary(data && typeof data === 'object' ? data : null);
        } catch {
            setSummary(null);
        }
        setLoading(false);
    };

    useEffect(() => { loadSummary(); }, [client]);

    return (
        <RouteGuard permission="pos.reports.read">
        <div className="ui-stack-6">
            <div>
                <h1 className="text-2xl ui-hstack-2">
                    <BarChart3 className="ui-text-primary" />
                    POS Sales Analytics
                </h1>
                <p className="ui-text-sm-muted">Daily sales summary, payment breakdown, and performance metrics.</p>
            </div>

            {loading ? (
                <div className={styles.p1}>Loading...</div>
            ) : summary ? (
                <>
                    <div className={styles.p2}>
                        {[
                            { label: 'Total Sales', value: `$${(summary.totalSales ?? 0).toFixed(2)}`, icon: <TrendingUp size={20} />, color: 'var(--color-success)' },
                            { label: 'Net Sales', value: `$${(summary.netSales ?? 0).toFixed(2)}`, icon: <DollarSign size={20} />, color: 'var(--color-primary)' },
                            { label: 'Returns', value: `$${(summary.totalReturns ?? 0).toFixed(2)}`, icon: <ShoppingBag size={20} />, color: 'var(--color-warning)' },
                            { label: 'Transactions', value: String(summary.totalTransactions ?? 0), icon: <ShoppingBag size={20} />, color: 'var(--color-primary)' },
                            { label: 'Avg Order Value', value: `$${(summary.averageOrderValue ?? 0).toFixed(2)}`, icon: <DollarSign size={20} />, color: 'var(--color-primary)' },
                        ].map((stat, i) => (
                            <div key={i} className="ui-card p-4">
                                <div className={styles.p3}>
                                    <div style={{ color: stat.color }}>{stat.icon}</div>
                                    <span className="ui-text-xs-muted">{stat.label}</span>
                                </div>
                                <div className={styles.p4}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="ui-card p-5">
                        <h3 className="ui-section-header">Payment Method Breakdown</h3>
                        {summary.paymentBreakdown && Object.entries(summary.paymentBreakdown).length > 0 ? (
                            Object.entries(summary.paymentBreakdown).map(([method, amount]: [string, any]) => (
                                <div key={method} className={styles.p5}>
                                    <span>{method}</span>
                                    <span className="font-bold">${Number(amount ?? 0).toFixed(2)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="ui-text-sm-muted">No payment data for this period.</p>
                        )}
                    </div>
                </>
            ) : (
                <div className={styles.p6}>
                    No sales data available. Complete a POS transaction to see analytics.
                </div>
            )}

            <div className="ui-card p-5">
                <h3 className="ui-section-header">Available Reports</h3>
                <div className={styles.p7}>
                    {[
                        { label: 'Sales by Product', endpoint: '/api/v1/pos/reports/sales-by-product', icon: <ShoppingBag size={16} /> },
                        { label: 'Sales by Cashier', endpoint: '/api/v1/pos/reports/sales-by-cashier', icon: <Users size={16} /> },
                        { label: 'Sales by Hour', endpoint: '/api/v1/pos/reports/sales-by-hour', icon: <Clock size={16} /> },
                        { label: 'Sales by Payment', endpoint: '/api/v1/pos/reports/sales-by-payment', icon: <CreditCard size={16} /> },
                        { label: 'Discount Usage', endpoint: '/api/v1/pos/reports/discount-usage', icon: <Percent size={16} /> },
                        { label: 'Customer Insights', endpoint: '/api/v1/pos/reports/customer-insights', icon: <Users size={16} /> },
                    ].map((r, i) => (
                        <div key={i} className={styles.p8}
                            onClick={() => window.open(r.endpoint, '_blank')}>
                            <span className="ui-text-primary">{r.icon}</span>
                            <span className="text-sm">{r.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </RouteGuard>
    );
}
