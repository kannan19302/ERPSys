'use client';

import React, { useState } from 'react';
import { Users, Gift, CreditCard, Search, Award, TrendingUp } from 'lucide-react';

export default function POSCustomersPage() {
    const [activeTab, setActiveTab] = useState<'customers' | 'loyalty' | 'gift-cards'>('customers');
    const [search, setSearch] = useState('');

    const tabs = [
        { id: 'customers' as const, label: 'Customer Directory', icon: <Users size={14} /> },
        { id: 'loyalty' as const, label: 'Loyalty Program', icon: <Gift size={14} /> },
        { id: 'gift-cards' as const, label: 'Gift Cards', icon: <CreditCard size={14} /> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Users style={{ color: 'var(--color-primary)' }} />
                    POS Customers & Loyalty
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Manage customer profiles, loyalty programs, and gift cards.</p>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                        padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
                        borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                        display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'customers' && (
                <div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                            <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
                        </div>
                    </div>
                    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Search customers by name, email, or phone to manage their profiles, loyalty points, and store credits.
                    </div>
                </div>
            )}

            {activeTab === 'loyalty' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                        {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(tier => (
                            <div key={tier} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
                                <Award size={24} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-1)' }} />
                                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{tier}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Tier</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Configure loyalty programs, points per purchase, redeem rates, and tier thresholds via the API.
                    </p>
                </div>
            )}

            {activeTab === 'gift-cards' && (
                <div>
                    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Issue Gift Card</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                            Issue and manage gift cards. Gift cards can be used at checkout as a payment method.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}