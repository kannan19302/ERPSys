'use client';
import React, { useState, useEffect } from 'react';
import { SplitSquareHorizontal, Search } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function POSSplitPaymentsPage() {
  const client = useApiClient(); const [payments, setPayments] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState('');

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    try { const d = await client.get<any>(`/pos/exp/split-payments/${orderId}`); setPayments(Array.isArray(d) ? d : []); } catch {}
    setLoading(false);
  };

  return (
    <RouteGuard permission="pos.split-payment.read">
      <div className="ui-stack-6">
        <div><h1 className="text-2xl ui-hstack-2"><SplitSquareHorizontal className="ui-text-primary" /> Split Payments</h1><p className="ui-text-sm-muted">View split payment details for orders.</p></div>
        <div className="ui-card"><div className="flex gap-2"><input className="ui-input flex-1" placeholder="Enter Order ID..." value={orderId} onChange={e => setOrderId(e.target.value)} /><button className="ui-btn" onClick={load}><Search size={14} /> Search</button></div></div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Method</th><th>Amount</th><th>Reference</th><th>Card Last4</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> : payments.length === 0 ? <tr><td colSpan={6} className="text-center p-4">No payments found for this order</td></tr> :
              payments.map(p => (
                <tr key={p.id}><td>{p.method}</td><td>${Number(p.amount).toFixed(2)}</td><td>{p.reference || '-'}</td><td>{p.cardLast4 || '-'}</td><td>{p.status}</td><td>{new Date(p.createdAt).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RouteGuard>
  );
}
