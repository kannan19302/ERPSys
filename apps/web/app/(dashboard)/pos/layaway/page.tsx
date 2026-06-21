'use client';

import React from 'react';
import { Calendar, DollarSign, ShoppingBag, Clock } from 'lucide-react';

export default function POSLayawayPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Calendar style={{ color: 'var(--color-primary)' }} />
                    Layaway & Installment Plans
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Create and manage layaway plans with deposit and installment payments.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                {[
                    { label: 'Active Plans', value: '0', color: 'var(--color-primary)' },
                    { label: 'Completed', value: '0', color: 'var(--color-success)' },
                    { label: 'Overdue', value: '0', color: 'var(--color-error)' },
                ].map((stat, i) => (
                    <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>How Layaway Works</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                    {[
                        { step: '1', title: 'Create Plan', desc: 'Select items and set a deposit amount to reserve them.' },
                        { step: '2', title: 'Collect Payments', desc: 'Customer makes installment payments over time.' },
                        { step: '3', title: 'Complete', desc: 'Once fully paid, the order is released to the customer.' },
                    ].map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '0 auto var(--space-2)', fontSize: 'var(--text-sm)' }}>{s.step}</div>
                            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>{s.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}