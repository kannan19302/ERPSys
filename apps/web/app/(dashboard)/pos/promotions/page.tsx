'use client';

import React from 'react';
import { Percent, Plus, Clock, ShoppingBag } from 'lucide-react';

export default function POSPromotionsPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Percent style={{ color: 'var(--color-primary)' }} />
                    Promotions Engine
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Create and manage promotional rules, bundle deals, and time-based offers.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Active promotions are automatically applied at checkout when conditions are met.</span>
                </div>
                <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Plus size={14} /> Create Promotion
                </button>
            </div>

            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Promotion Types</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
                    {[
                        { name: 'Buy X Get Y (BOGO)', desc: 'Buy a specific product and get another free or discounted', type: 'BOGO' },
                        { name: 'Bundle Discount', desc: 'Discount when purchasing a set of products together', type: 'BUNDLE' },
                        { name: 'Percentage Off', desc: 'Percentage discount on order, item, or category', type: 'PERCENTAGE' },
                        { name: 'Fixed Amount Off', desc: 'Fixed dollar amount discount on qualifying purchases', type: 'FIXED' },
                    ].map((p, i) => (
                        <div key={i} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{p.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}