'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Play, Trash2, Clock, Search } from 'lucide-react';

export default function POSHeldOrdersPage() {
    const [heldOrders, setHeldOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadHeldOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/pos/held-orders', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setHeldOrders(await res.json());
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { loadHeldOrders(); }, []);

    const handleResume = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/v1/pos/held-orders/${id}/resume`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadHeldOrders();
        } catch { /* silent */ }
    };

    const handleDiscard = async (id: string) => {
        if (!confirm('Discard this held order?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/v1/pos/held-orders/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadHeldOrders();
        } catch { /* silent */ }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <ShoppingBag style={{ color: 'var(--color-primary)' }} />
                    Held / Parked Carts
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Resume or discard parked shopping carts.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>Loading...</div>
            ) : heldOrders.length === 0 ? (
                <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No held orders. Park a cart from the POS terminal to see it here.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                    {heldOrders.map(order => (
                        <div key={order.id} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                <div>
                                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{order.label || `Cart #${order.id.slice(0, 8)}`}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{order.customerName || 'Walk-in'}</div>
                                </div>
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-warning-light)', color: 'var(--color-warning)', fontWeight: 'var(--weight-semibold)' }}>HELD</span>
                            </div>
                            <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Items: </span>
                                <span style={{ fontWeight: 'var(--weight-semibold)' }}>{(order.items || []).length}</span>
                            </div>
                            <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Total: </span>
                                <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>${Number(order.subtotal).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>
                                <Clock size={12} /> {new Date(order.createdAt).toLocaleString()}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button onClick={() => handleResume(order.id)} style={{ flex: 1, background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Play size={12} /> Resume
                                </button>
                                <button onClick={() => handleDiscard(order.id)} style={{ background: 'var(--color-error)', color: '#fff', border: 'none', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}