'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Eye, RotateCcw, XCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface POSOrder {
    id: string;
    orderNumber: string;
    type: string;
    status: string;
    customerName: string | null;
    cashierName: string | null;
    grandTotal: string;
    paidAmount: string;
    createdAt: string;
}

export default function POSOrdersPage() {
    const [orders, setOrders] = useState<POSOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ page: String(page), limit: '20', search });
            const res = await fetch(`/api/v1/pos/orders?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setOrders(data.data || []);
            setTotalPages(data.totalPages || 1);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { loadOrders(); }, [page, search]);

    const loadOrderDetail = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/pos/orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedOrder(await res.json());
        } catch { /* silent */ }
    };

    const statusColor = (s: string) => {
        const map: Record<string, string> = {
            COMPLETED: 'var(--color-success)', RETURNED: 'var(--color-warning)',
            EXCHANGED: 'var(--color-primary)', VOIDED: 'var(--color-error)',
        };
        return map[s] || 'var(--color-text-secondary)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <ShoppingCart style={{ color: 'var(--color-primary)' }} />
                    POS Orders
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>View, search, and manage all point-of-sale transactions.</p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                        placeholder="Search by order # or customer..."
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}
                    />
                </div>
            </div>

            {selectedOrder ? (
                <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                    <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                        ← Back to Orders
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div><strong>Order:</strong> {selectedOrder.orderNumber}</div>
                        <div><strong>Status:</strong> <span style={{ color: statusColor(selectedOrder.status) }}>{selectedOrder.status}</span></div>
                        <div><strong>Customer:</strong> {selectedOrder.customerName || 'Walk-in'}</div>
                        <div><strong>Cashier:</strong> {selectedOrder.cashierName || selectedOrder.cashierId}</div>
                        <div><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                        <div><strong>Total:</strong> ${Number(selectedOrder.grandTotal).toFixed(2)}</div>
                    </div>
                    <h3 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Items</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                        <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ textAlign: 'left', padding: 'var(--space-2)' }}>Product</th>
                            <th style={{ textAlign: 'right', padding: 'var(--space-2)' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: 'var(--space-2)' }}>Price</th>
                            <th style={{ textAlign: 'right', padding: 'var(--space-2)' }}>Total</th>
                        </tr></thead>
                        <tbody>
                            {(selectedOrder.items || []).map((item: any) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: 'var(--space-2)' }}>{item.productName}</td>
                                    <td style={{ textAlign: 'right', padding: 'var(--space-2)' }}>{Number(item.qty)}</td>
                                    <td style={{ textAlign: 'right', padding: 'var(--space-2)' }}>${Number(item.unitPrice).toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: 'var(--space-2)' }}>${Number(item.lineTotal).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <h3 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Payments</h3>
                    {(selectedOrder.payments || []).map((p: any) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', padding: 'var(--space-1) 0' }}>
                            <span>{p.method}</span>
                            <span>${Number(p.amount).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                {['Order #', 'Type', 'Status', 'Customer', 'Cashier', 'Total', 'Date', ''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>Loading...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>No orders found</td></tr>
                            ) : orders.map(o => (
                                <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{o.orderNumber}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{o.type}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        <span style={{ color: statusColor(o.status), fontWeight: 'var(--weight-semibold)' }}>{o.status}</span>
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{o.customerName || '—'}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{o.cashierName || '—'}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)' }}>${Number(o.grandTotal).toFixed(2)}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        <button onClick={() => loadOrderDetail(o.id)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Eye size={12} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-3)', cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.5 }}><ChevronLeft size={16} /></button>
                        <span style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-3)', cursor: page < totalPages ? 'pointer' : 'default', opacity: page < totalPages ? 1 : 0.5 }}><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}