'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Play, Trash2, Clock, Search } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function POSHeldOrdersPage() {
    const client = useApiClient();
    const [heldOrders, setHeldOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadHeldOrders = async () => {
        setLoading(true);
        try {
            const data = await client.get<unknown>('/pos/held-orders');
            setHeldOrders(Array.isArray(data) ? data : []);
        } catch {
            setHeldOrders([]);
        }
        setLoading(false);
    };

    useEffect(() => { loadHeldOrders(); }, [client]);

    const handleResume = async (id: string) => {
        try {
            await client.request(`/pos/held-orders/${id}/resume`, { method: 'PUT' });
            loadHeldOrders();
        } catch { /* silent */ }
    };

    const handleDiscard = async (id: string) => {
        if (!confirm('Discard this held order?')) return;
        try {
            await client.delete(`/pos/held-orders/${id}`);
            loadHeldOrders();
        } catch { /* silent */ }
    };

    return (
        <RouteGuard permission="pos.held-orders.read">
        <div className="ui-stack-6">
            <div>
                <h1 className="text-2xl ui-hstack-2">
                    <ShoppingBag className="ui-text-primary" />
                    Held / Parked Carts
                </h1>
                <p className="ui-text-sm-muted">Resume or discard parked shopping carts.</p>
            </div>

            {loading ? (
                <div className={styles.p1}>Loading...</div>
            ) : !Array.isArray(heldOrders) || heldOrders.length === 0 ? (
                <div className={styles.p2}>
                    No held orders. Park a cart from the POS terminal to see it here.
                </div>
            ) : (
                <div className={styles.p3}>
                    {heldOrders.map(order => (
                        <div key={order.id} className="ui-card p-4">
                            <div className={styles.p4}>
                                <div>
                                    <div className="ui-heading-sm font-bold">{order.label || `Cart #${order.id.slice(0, 8)}`}</div>
                                    <div className="ui-text-caption">{order.customerName || 'Walk-in'}</div>
                                </div>
                                <span className={styles.p5}>HELD</span>
                            </div>
                            <div className={styles.p6}>
                                <span className="ui-text-muted">Items: </span>
                                <span className="font-semibold">{(order.items || []).length}</span>
                            </div>
                            <div className={styles.p7}>
                                <span className="ui-text-muted">Total: </span>
                                <span className={styles.p8}>${Number(order.subtotal).toFixed(2)}</span>
                            </div>
                            <div className={styles.p9}>
                                <Clock size={12} /> {new Date(order.createdAt).toLocaleString()}
                            </div>
                            <div className="ui-flex ui-gap-2">
                                <button onClick={() => handleResume(order.id)} className={styles.p10}>
                                    <Play size={12} /> Resume
                                </button>
                                <button onClick={() => handleDiscard(order.id)} className={styles.p11}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </RouteGuard>
    );
}
