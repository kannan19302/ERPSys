'use client';

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type Tab = 'dashboard' | 'orders' | 'in-transit' | 'receiving';

interface Dashboard {
  total: number;
  byStatus: {
    draft: number; pendingApproval: number; approved: number;
    inTransit: number; partiallyReceived: number; completed: number; cancelled: number;
  };
}

interface TransferOrder {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: string;
  priority: string;
  expectedDate?: string;
  shippedDate?: string;
  carrier?: string;
  trackingNumber?: string;
  createdAt: string;
  _count?: { lines: number; receipts: number };
}

interface InTransitItem {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: string;
  shippedDate?: string;
  expectedDate?: string;
  carrier?: string;
  trackingNumber?: string;
  totalLines: number;
  pendingLines: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  PARTIALLY_RECEIVED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export default function TransferOrdersPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [orders, setOrders] = useState<TransferOrder[]>([]);
  const [inTransit, setInTransit] = useState<InTransitItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fromWarehouseId: '', toWarehouseId: '', priority: 'NORMAL',
    expectedDate: '', notes: '', carrier: '', estimatedCost: '',
  });
  const [lines, setLines] = useState<{ productId: string; requestedQty: string; uom: string }[]>([
    { productId: '', requestedQty: '', uom: 'UNIT' },
  ]);

  const loadDashboard = useCallback(async () => {
    try { setDashboard(await apiFetch('/inventory/transfer-orders/dashboard')); } catch { /* ignore */ }
  }, []);
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try { setOrders(await apiFetch('/inventory/transfer-orders')); } catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  const loadInTransit = useCallback(async () => {
    setLoading(true);
    try { setInTransit(await apiFetch('/inventory/transfer-orders/in-transit')); } catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => {
    if (tab === 'orders') loadOrders();
    else if (tab === 'in-transit') loadInTransit();
  }, [tab, loadOrders, loadInTransit]);

  const createOrder = async () => {
    try {
      await apiFetch('/inventory/transfer-orders', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
          expectedDate: form.expectedDate || undefined,
          lines: lines.filter(l => l.productId).map(l => ({ ...l, requestedQty: parseFloat(l.requestedQty) })),
        }),
      });
      setShowForm(false);
      loadOrders(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const action = async (id: string, act: string, body?: unknown) => {
    try {
      await apiFetch(`/inventory/transfer-orders/${id}/${act}`, { method: 'PATCH', ...(body ? { body: JSON.stringify(body) } : {}) });
      loadOrders(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Transfer Orders' },
    { id: 'in-transit', label: 'In Transit' },
    { id: 'receiving', label: 'Receiving Report' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Inventory Transfer Orders</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}<button className="ml-2 underline" onClick={() => setError('')}>dismiss</button></div>}

      <div className="flex gap-2 border-b mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && dashboard && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Orders', value: dashboard.total },
              { label: 'In Transit', value: dashboard.byStatus.inTransit },
              { label: 'Pending Approval', value: dashboard.byStatus.pendingApproval },
              { label: 'Completed', value: dashboard.byStatus.completed },
            ].map(c => (
              <div key={c.label} className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-sm text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
            {Object.entries(dashboard.byStatus).map(([key, val]) => (
              <div key={key} className={`border rounded-lg p-3 text-center ${STATUS_COLORS[key.toUpperCase().replace(/([A-Z])/g, '_$1').slice(1)] ?? 'bg-gray-50'}`}>
                <div className="text-lg font-semibold">{val}</div>
                <div className="text-xs mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Transfer Orders</h2>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">+ New Transfer Order</button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Create Transfer Order</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <input placeholder="From Warehouse ID*" value={form.fromWarehouseId} onChange={e => setForm(f => ({ ...f, fromWarehouseId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="To Warehouse ID*" value={form.toWarehouseId} onChange={e => setForm(f => ({ ...f, toWarehouseId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
                <input type="date" placeholder="Expected Date" value={form.expectedDate} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Carrier" value={form.carrier} onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="Estimated Cost" value={form.estimatedCost} onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Lines</h4>
                {lines.map((l, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input placeholder="Product ID*" value={l.productId} onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, productId: e.target.value } : x))} className="border rounded px-3 py-2 text-sm flex-1" />
                    <input type="number" placeholder="Qty*" value={l.requestedQty} onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, requestedQty: e.target.value } : x))} className="border rounded px-3 py-2 text-sm w-24" />
                    <input placeholder="UOM" value={l.uom} onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, uom: e.target.value } : x))} className="border rounded px-3 py-2 text-sm w-20" />
                    {lines.length > 1 && <button onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} className="text-red-500 text-sm px-2">✕</button>}
                  </div>
                ))}
                <button onClick={() => setLines(ls => [...ls, { productId: '', requestedQty: '', uom: 'UNIT' }])} className="text-blue-600 text-sm underline">+ Add line</button>
              </div>
              <div className="flex gap-2">
                <button onClick={createOrder} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Create</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>{['Order #', 'From', 'To', 'Priority', 'Status', 'Expected', 'Lines', 'Actions'].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono">{o.transferNumber}</td>
                      <td className="px-4 py-2 text-xs">{o.fromWarehouseId.slice(0, 8)}</td>
                      <td className="px-4 py-2 text-xs">{o.toWarehouseId.slice(0, 8)}</td>
                      <td className="px-4 py-2"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{o.priority}</span></td>
                      <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[o.status] ?? ''}`}>{o.status}</span></td>
                      <td className="px-4 py-2 text-gray-500">{o.expectedDate ? new Date(o.expectedDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2">{o._count?.lines ?? 0}</td>
                      <td className="px-4 py-2 flex gap-2 flex-wrap">
                        {o.status === 'DRAFT' && <button onClick={() => action(o.id, 'submit')} className="text-blue-600 underline text-xs">Submit</button>}
                        {o.status === 'PENDING_APPROVAL' && <button onClick={() => action(o.id, 'approve')} className="text-green-600 underline text-xs">Approve</button>}
                        {o.status === 'APPROVED' && <button onClick={() => action(o.id, 'ship', { shippedLines: [] })} className="text-purple-600 underline text-xs">Ship</button>}
                        {o.status === 'PARTIALLY_RECEIVED' && <button onClick={() => action(o.id, 'close-out')} className="text-orange-600 underline text-xs">Close Out</button>}
                        {!['COMPLETED', 'CANCELLED'].includes(o.status) && <button onClick={() => action(o.id, 'cancel')} className="text-red-600 underline text-xs">Cancel</button>}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No transfer orders</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* In Transit */}
      {tab === 'in-transit' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Orders In Transit</h2>
          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="space-y-3">
              {inTransit.map(o => (
                <div key={o.id} className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-medium">{o.transferNumber}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${STATUS_COLORS[o.status] ?? ''}`}>{o.status}</span>
                    </div>
                    <div className="text-sm text-gray-500">{o.pendingLines}/{o.totalLines} lines pending</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-sm text-gray-600">
                    <div>From: {o.fromWarehouseId.slice(0, 8)}</div>
                    <div>To: {o.toWarehouseId.slice(0, 8)}</div>
                    <div>Carrier: {o.carrier ?? '-'}</div>
                    <div>Tracking: {o.trackingNumber ?? '-'}</div>
                    <div>Shipped: {o.shippedDate ? new Date(o.shippedDate).toLocaleDateString() : '-'}</div>
                    <div>Expected: {o.expectedDate ? new Date(o.expectedDate).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
              ))}
              {inTransit.length === 0 && <div className="text-center text-gray-400 py-8">No orders in transit</div>}
            </div>
          )}
        </div>
      )}

      {/* Receiving */}
      {tab === 'receiving' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Receiving Report</h2>
          <div className="text-sm text-gray-500">Completed transfer orders with received quantities and rejection analysis.</div>
          <div className="mt-4 text-center text-gray-400 py-8 border rounded-lg">Click In-Transit tab to manage active transfers, then receive goods against them.</div>
        </div>
      )}
    </div>
  );
}
