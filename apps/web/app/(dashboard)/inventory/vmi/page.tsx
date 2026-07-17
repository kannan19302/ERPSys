'use client';
import styles from './page.module.css';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

const BASE = '/api/inventory/vmi';
function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(<T,>(path: string, opts?: RequestInit) => client.request<T>(`${BASE}${path}`.replace('/api', ''), {
    method: opts?.method,
    body: opts?.body ? String(opts.body) : undefined,
  }), [client]);
}

const TABS = ['Dashboard', 'Agreements', 'Stock Snapshots', 'Orders'] as const;
type Tab = typeof TABS[number];

export default function VmiPage() {
  const [tab, setTab] = useState<Tab>('Dashboard');
  return (
    <RouteGuard permission="inventory.vmi.read">
    <div className="ui-page-shell">
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
    </RouteGuard>
  );
}

function DashboardTab() {
  const apiFetch = useFrameworkFetch();
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
  const apiFetch = useFrameworkFetch();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ vendorId: '', warehouseId: '', productId: '', minQty: '', maxQty: '', targetQty: '', notes: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch<{ items: any[]; total: number }>('/agreements').then(r => { setAgreements(r.items); setTotal(r.total); }).catch(console.error);
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
        <ListPageTemplate
          columns={[
            { key: 'agreementNumber', header: 'Agreement #', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'vendorId', header: 'Vendor' },
            { key: 'productId', header: 'Product' },
            { key: 'minQty', header: 'Min/Max/Target', render: (v, row) => `${v} / ${row.maxQty} / ${row.targetQty}` },
            { key: 'status', header: 'Status', render: (v) => <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{String(v)}</span> },
            { key: 'id', header: 'Actions', render: (v, row) => (
              <div className={styles.s1}>
                {row.status === 'DRAFT' && <button onClick={() => doAction(String(v), 'activate')} className="text-xs text-green-600 hover:underline">Activate</button>}
                {row.status === 'ACTIVE' && <button onClick={() => doAction(String(v), 'suspend')} className="text-xs text-yellow-600 hover:underline">Suspend</button>}
                {row.status !== 'TERMINATED' && <button onClick={() => doAction(String(v), 'terminate')} className="text-xs text-red-600 hover:underline">Terminate</button>}
              </div>
            ) },
          ] as ListColumn[]}
          data={agreements as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No agreements"
          emptyDescription="No VMI agreements found."
        />
      </div>
    </div>
  );
}

function SnapshotsTab() {
  const apiFetch = useFrameworkFetch();
  const [agreementId, setAgreementId] = useState('');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [form, setForm] = useState({ onHandQty: '', onOrderQty: '', notes: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    if (!agreementId) return;
    apiFetch<any[]>(`/snapshots?agreementId=${agreementId}`).then(setSnapshots).catch(console.error);
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
      <ListPageTemplate
        columns={[
          { key: 'snapshotDate', header: 'Date', render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: 'onHandQty', header: 'On-Hand Qty' },
          { key: 'onOrderQty', header: 'On-Order Qty' },
          { key: 'notes', header: 'Notes' },
        ] as ListColumn[]}
        data={snapshots as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No snapshots"
        emptyDescription="No snapshots recorded for this agreement."
      />
    </div>
  );
}

function OrdersTab() {
  const apiFetch = useFrameworkFetch();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch<{ items: any[]; total: number }>('/orders').then(r => { setOrders(r.items); setTotal(r.total); }).catch(console.error);
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
        <ListPageTemplate
          columns={[
            { key: 'orderNumber', header: 'Order #', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'vendorId', header: 'Vendor' },
            { key: 'orderedQty', header: 'Qty' },
            { key: 'triggeredBy', header: 'Triggered By' },
            { key: 'status', header: 'Status', render: (v) => <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{String(v)}</span> },
            { key: 'id', header: 'Update Status', render: (v) => (
              <div className={styles.s1}>
                <select className="border rounded px-1 py-0.5 text-xs"
                  value={statusInputs[String(v)] ?? ''}
                  onChange={e => setStatusInputs(s => ({ ...s, [String(v)]: e.target.value }))}>
                  <option value="">-- select --</option>
                  {['CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => updateStatus(String(v))} className="text-xs text-blue-600 hover:underline">Apply</button>
              </div>
            ) },
          ] as ListColumn[]}
          data={orders as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No VMI orders"
          emptyDescription="No VMI orders found."
        />
      </div>
    </div>
  );
}
