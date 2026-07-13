'use client';
import { useState, useEffect, useCallback } from 'react';

const BASE = '/api/inventory/vmi';
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const TABS = ['Dashboard', 'Agreements', 'Stock Snapshots', 'Orders'] as const;
type Tab = typeof TABS[number];

export default function VmiPage() {
  const [tab, setTab] = useState<Tab>('Dashboard');
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Vendor-Managed Inventory (VMI)</h1>
      <div className="flex gap-2 border-b">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Dashboard' && <DashboardTab />}
      {tab === 'Agreements' && <AgreementsTab />}
      {tab === 'Stock Snapshots' && <SnapshotsTab />}
      {tab === 'Orders' && <OrdersTab />}
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { apiFetch('/dashboard').then(setStats).catch(console.error); }, []);
  if (!stats) return <p className="text-sm text-gray-500">Loading…</p>;
  const cards = [
    ['Total Agreements', stats.totalAgreements], ['Active Agreements', stats.activeAgreements],
    ['Draft Agreements', stats.draftAgreements], ['Total Orders', stats.totalOrders],
    ['Pending Orders', stats.pendingOrders], ['Confirmed Orders', stats.confirmedOrders],
    ['Shipped Orders', stats.shippedOrders],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(([label, value]) => (
        <div key={label as string} className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function AgreementsTab() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ vendorId: '', warehouseId: '', productId: '', minQty: '', maxQty: '', targetQty: '', notes: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch('/agreements').then(r => { setAgreements(r.items); setTotal(r.total); }).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/agreements', {
        method: 'POST',
        body: JSON.stringify({ ...form, minQty: +form.minQty, maxQty: +form.maxQty, targetQty: +form.targetQty }),
      });
      setMsg('Agreement created'); setForm({ vendorId: '', warehouseId: '', productId: '', minQty: '', maxQty: '', targetQty: '', notes: '' }); load();
    } catch (err: any) { setMsg(err.message); }
  };

  const doAction = async (id: string, action: string) => {
    try { await apiFetch(`/agreements/${id}/${action}`, { method: 'PATCH' }); load(); } catch (err: any) { setMsg(err.message); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold text-sm">New VMI Agreement</h2>
        <div className="grid grid-cols-3 gap-3">
          {(['vendorId', 'warehouseId', 'productId', 'minQty', 'maxQty', 'targetQty'] as const).map(key => (
            <div key={key}>
              <label className="text-xs text-gray-600 capitalize">{key}</label>
              <input type={['minQty', 'maxQty', 'targetQty'].includes(key) ? 'number' : 'text'}
                className="w-full border rounded px-2 py-1 text-sm" value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-600">Notes</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded">Create</button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </form>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b text-sm font-medium">Agreements ({total})</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['Agreement #', 'Vendor', 'Product', 'Min/Max/Target', 'Status', 'Actions'].map(h => <th key={h} className="px-3 py-2 text-left text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {agreements.map(ag => (
              <tr key={ag.id} className="border-t">
                <td className="px-3 py-2 font-mono">{ag.agreementNumber}</td>
                <td className="px-3 py-2">{ag.vendorId}</td>
                <td className="px-3 py-2">{ag.productId}</td>
                <td className="px-3 py-2 text-xs">{ag.minQty} / {ag.maxQty} / {ag.targetQty}</td>
                <td className="px-3 py-2"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{ag.status}</span></td>
                <td className="px-3 py-2 flex gap-2">
                  {ag.status === 'DRAFT' && <button onClick={() => doAction(ag.id, 'activate')} className="text-xs text-green-600 hover:underline">Activate</button>}
                  {ag.status === 'ACTIVE' && <button onClick={() => doAction(ag.id, 'suspend')} className="text-xs text-yellow-600 hover:underline">Suspend</button>}
                  {ag.status !== 'TERMINATED' && <button onClick={() => doAction(ag.id, 'terminate')} className="text-xs text-red-600 hover:underline">Terminate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SnapshotsTab() {
  const [agreementId, setAgreementId] = useState('');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [form, setForm] = useState({ onHandQty: '', onOrderQty: '', notes: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    if (!agreementId) return;
    apiFetch(`/snapshots?agreementId=${agreementId}`).then(setSnapshots).catch(console.error);
  }, [agreementId]);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/snapshots', {
        method: 'POST',
        body: JSON.stringify({ agreementId, snapshotDate: new Date(), onHandQty: +form.onHandQty, onOrderQty: form.onOrderQty ? +form.onOrderQty : 0, notes: form.notes }),
      });
      setMsg('Snapshot recorded'); setForm({ onHandQty: '', onOrderQty: '', notes: '' }); load();
    } catch (err: any) { setMsg(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 text-sm" placeholder="Agreement ID" value={agreementId}
          onChange={e => setAgreementId(e.target.value)} />
        <button onClick={load} className="px-3 py-1 bg-gray-100 text-sm rounded">Load</button>
      </div>
      {agreementId && (
        <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3 max-w-md">
          <h2 className="font-semibold text-sm">Record Snapshot</h2>
          <div>
            <label className="text-xs text-gray-600">On-Hand Qty *</label>
            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={form.onHandQty}
              onChange={e => setForm(f => ({ ...f, onHandQty: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-600">On-Order Qty</label>
            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={form.onOrderQty}
              onChange={e => setForm(f => ({ ...f, onOrderQty: e.target.value }))} />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded">Record</button>
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </form>
      )}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['Date', 'On-Hand Qty', 'On-Order Qty', 'Notes'].map(h => <th key={h} className="px-3 py-2 text-left text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {snapshots.map(s => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2 text-xs">{new Date(s.snapshotDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{s.onHandQty}</td>
                <td className="px-3 py-2">{s.onOrderQty}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{s.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch('/orders').then(r => { setOrders(r.items); setTotal(r.total); }).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const updateStatus = async (id: string) => {
    const status = statusInputs[id];
    if (!status) return;
    try {
      await apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setMsg(`Order updated to ${status}`); load();
    } catch (err: any) { setMsg(err.message); }
  };

  return (
    <div className="space-y-4">
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b text-sm font-medium">VMI Orders ({total})</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['Order #', 'Vendor', 'Qty', 'Triggered By', 'Status', 'Update Status'].map(h => <th key={h} className="px-3 py-2 text-left text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2 font-mono">{o.orderNumber}</td>
                <td className="px-3 py-2">{o.vendorId}</td>
                <td className="px-3 py-2">{o.orderedQty}</td>
                <td className="px-3 py-2 text-xs">{o.triggeredBy}</td>
                <td className="px-3 py-2"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{o.status}</span></td>
                <td className="px-3 py-2 flex gap-2">
                  <select className="border rounded px-1 py-0.5 text-xs"
                    value={statusInputs[o.id] ?? ''}
                    onChange={e => setStatusInputs(s => ({ ...s, [o.id]: e.target.value }))}>
                    <option value="">-- select --</option>
                    {['CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => updateStatus(o.id)} className="text-xs text-blue-600 hover:underline">Apply</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
