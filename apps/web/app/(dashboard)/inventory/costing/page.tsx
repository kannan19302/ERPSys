'use client';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

const BASE = '/inventory/costing';
function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(<T,>(path: string, opts?: RequestInit) => client.request<T>(BASE + path, {
    method: opts?.method,
    body: opts?.body ? String(opts.body) : undefined,
  }), [client]);
}

const TABS = ['Dashboard', 'Profiles', 'Cost Layers', 'Consume', 'Adjustments', 'Valuation'] as const;
type Tab = typeof TABS[number];

export default function CostingPage() {
  const apiFetch = useFrameworkFetch();
  const [tab, setTab] = useState<Tab>('Dashboard');
  return (
    <RouteGuard permission="inventory.costing.read">
      <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Inventory Costing Methods</h1>
      <div className="flex gap-2 border-b flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Dashboard' && <DashboardTab />}
      {tab === 'Profiles' && <ProfilesTab />}
      {tab === 'Cost Layers' && <CostLayersTab />}
      {tab === 'Consume' && <ConsumeTab />}
      {tab === 'Adjustments' && <AdjustmentsTab />}
      {tab === 'Valuation' && <ValuationTab />}
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
    ['Total Profiles', stats.totalProfiles], ['FIFO Profiles', stats.fifoProfiles],
    ['WAC Profiles', stats.wacProfiles], ['LIFO Profiles', stats.lifoProfiles],
    ['Total Adjustments', stats.totalAdjustments],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map(([label, value]) => (
        <div key={label as string} className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ProfilesTab() {
  const apiFetch = useFrameworkFetch();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ productId: '', warehouseId: '', method: 'WAC', standardCost: '', notes: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch<{ items: any[]; total: number }>('/profiles').then(r => { setProfiles(r.items); setTotal(r.total); }).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/profiles', {
        method: 'POST',
        body: JSON.stringify({ ...form, standardCost: form.standardCost ? +form.standardCost : undefined }),
      });
      setMsg('Profile saved'); setForm({ productId: '', warehouseId: '', method: 'WAC', standardCost: '', notes: '' }); load();
    } catch (err: any) { setMsg(err.message); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold text-sm">Create / Update Cost Profile</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Product ID *</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.productId}
              onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-600">Warehouse ID *</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.warehouseId}
              onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-600">Costing Method</label>
            <select className="w-full border rounded px-2 py-1 text-sm" value={form.method}
              onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
              {['FIFO', 'LIFO', 'WAC', 'STANDARD', 'SPECIFIC'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Standard Cost</label>
            <input type="number" step="0.0001" className="w-full border rounded px-2 py-1 text-sm" value={form.standardCost}
              onChange={e => setForm(f => ({ ...f, standardCost: e.target.value }))} />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded">Save Profile</button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </form>
      <p className="text-sm text-gray-500">Profiles ({total})</p>
      <ListPageTemplate
        columns={[
          { key: 'productId', header: 'Product' },
          { key: 'warehouseId', header: 'Warehouse' },
          { key: 'method', header: 'Method', render: (v) => <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{String(v)}</span> },
          { key: 'standardCost', header: 'Std Cost', render: (v) => String(v ?? '—') },
          { key: 'currency', header: 'Currency' },
        ] as ListColumn[]}
        data={profiles as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No profiles"
        emptyDescription="Create a costing profile using the form above."
      />
    </div>
  );
}

function CostLayersTab() {
  const apiFetch = useFrameworkFetch();
  const [profileId, setProfileId] = useState('');
  const [layers, setLayers] = useState<any[]>([]);
  const [form, setForm] = useState({ unitCost: '', qty: '', receiptRef: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    if (!profileId) return;
    apiFetch<any[]>(`/profiles/${profileId}/layers`).then(setLayers).catch(console.error);
  }, [profileId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/profiles/${profileId}/layers`, {
        method: 'POST',
        body: JSON.stringify({ receiptDate: new Date(), unitCost: +form.unitCost, qty: +form.qty, receiptRef: form.receiptRef }),
      });
      setMsg('Layer added'); setForm({ unitCost: '', qty: '', receiptRef: '' }); load();
    } catch (err: any) { setMsg(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border rounded px-2 py-1 text-sm" placeholder="Profile ID" value={profileId}
          onChange={e => setProfileId(e.target.value)} />
        <button onClick={load} className="px-3 py-1 bg-gray-100 text-sm rounded">Load</button>
      </div>
      {profileId && (
        <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3 max-w-md">
          <h2 className="font-semibold text-sm">Add Cost Layer (Receipt)</h2>
          {([['Unit Cost *', 'unitCost', 'number'], ['Qty *', 'qty', 'number'], ['Receipt Ref', 'receiptRef', 'text']] as const).map(([label, key, type]) => (
            <div key={key}>
              <label className="text-xs text-gray-600">{label}</label>
              <input type={type} className="w-full border rounded px-2 py-1 text-sm"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required={label.includes('*')} />
            </div>
          ))}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded">Add Layer</button>
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </form>
      )}
      <ListPageTemplate
        columns={[
          { key: 'receiptDate', header: 'Receipt Date', render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: 'receiptRef', header: 'Ref', render: (v) => String(v ?? '—') },
          { key: 'unitCost', header: 'Unit Cost' },
          { key: 'qtyReceived', header: 'Rcvd Qty' },
          { key: 'qtyRemaining', header: 'Remaining' },
          { key: 'status', header: 'Status', render: (v) => <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{String(v)}</span> },
        ] as ListColumn[]}
        data={layers as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No cost layers"
        emptyDescription="Add a cost layer using the form above."
      />
    </div>
  );
}

function ConsumeTab() {
  const apiFetch = useFrameworkFetch();
  const [form, setForm] = useState({ profileId: '', qty: '', method: '' });
  const [result, setResult] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/profiles/${form.profileId}/consume`, {
        method: 'POST',
        body: JSON.stringify({ qty: +form.qty, method: form.method || undefined }),
      });
      setResult(res); setMsg('');
    } catch (err: any) { setMsg(err.message); setResult(null); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3 max-w-md">
        <h2 className="font-semibold text-sm">Consume Cost Layers (COGS)</h2>
        <div>
          <label className="text-xs text-gray-600">Profile ID *</label>
          <input className="w-full border rounded px-2 py-1 text-sm" value={form.profileId}
            onChange={e => setForm(f => ({ ...f, profileId: e.target.value }))} required />
        </div>
        <div>
          <label className="text-xs text-gray-600">Quantity *</label>
          <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={form.qty}
            onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} required />
        </div>
        <div>
          <label className="text-xs text-gray-600">Override Method</label>
          <select className="w-full border rounded px-2 py-1 text-sm" value={form.method}
            onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
            <option value="">Use profile default</option>
            {['FIFO', 'LIFO', 'WAC'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-orange-600 text-white text-sm rounded">Consume</button>
        {msg && <p className="text-sm text-red-600">{msg}</p>}
      </form>
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-1">
          <p><strong>Qty Consumed:</strong> {result.qtyConsumed}</p>
          <p><strong>Total Cost:</strong> {result.totalCost.toFixed(4)}</p>
          <p><strong>Avg Cost/Unit:</strong> {result.avgCost.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
}

function AdjustmentsTab() {
  const apiFetch = useFrameworkFetch();
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ profileId: '', adjustmentType: 'MANUAL', amount: '', reason: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch<{ items: any[]; total: number }>('/adjustments').then(r => { setAdjustments(r.items); setTotal(r.total); }).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/adjustments', { method: 'POST', body: JSON.stringify({ ...form, amount: +form.amount }) });
      setMsg('Adjustment created'); setForm({ profileId: '', adjustmentType: 'MANUAL', amount: '', reason: '' }); load();
    } catch (err: any) { setMsg(err.message); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3 max-w-lg">
        <h2 className="font-semibold text-sm">Create Cost Adjustment</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Profile ID *</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.profileId}
              onChange={e => setForm(f => ({ ...f, profileId: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-600">Type</label>
            <select className="w-full border rounded px-2 py-1 text-sm" value={form.adjustmentType}
              onChange={e => setForm(f => ({ ...f, adjustmentType: e.target.value }))}>
              {['PURCHASE_PRICE_VARIANCE', 'FREIGHT_ABSORPTION', 'OVERHEAD_ABSORPTION', 'WRITE_DOWN', 'MANUAL'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Amount *</label>
            <input type="number" step="0.01" className="w-full border rounded px-2 py-1 text-sm" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-600">Reason *</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded">Create Adjustment</button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </form>
      <p className="text-sm text-gray-500">Adjustments ({total})</p>
      <ListPageTemplate
        columns={[
          { key: 'adjustmentNumber', header: 'Adj #', render: (v) => <span className="font-mono">{String(v)}</span> },
          { key: 'adjustmentType', header: 'Type' },
          { key: 'amount', header: 'Amount' },
          { key: 'reason', header: 'Reason' },
          { key: 'adjustedAt', header: 'Date', render: (v) => new Date(String(v)).toLocaleDateString() },
        ] as ListColumn[]}
        data={adjustments as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No adjustments"
        emptyDescription="Create a cost adjustment using the form above."
      />
    </div>
  );
}

function ValuationTab() {
  const apiFetch = useFrameworkFetch();
  const [rows, setRows] = useState<any[]>([]);
  const [productId, setProductId] = useState('');

  const load = useCallback(() => {
    const qs = productId ? `?productId=${productId}` : '';
    apiFetch<any[]>(`/valuation${qs}`).then(setRows).catch(console.error);
  }, [productId]);
  useEffect(load, [load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 text-sm" placeholder="Filter by Product ID" value={productId}
          onChange={e => setProductId(e.target.value)} />
        <button onClick={load} className="px-3 py-1 bg-gray-100 text-sm rounded">Refresh</button>
      </div>
      <ListPageTemplate
        columns={[
          { key: 'productId', header: 'Product' },
          { key: 'warehouseId', header: 'Warehouse' },
          { key: 'method', header: 'Method', render: (v) => <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{String(v)}</span> },
          { key: 'totalQty', header: 'Total Qty', render: (v) => Number(v).toFixed(2) },
          { key: 'totalValue', header: 'Total Value', render: (v) => <strong>{Number(v).toFixed(2)}</strong> },
          { key: 'totalQty', header: 'Avg Cost', render: (v, row) => Number(v) > 0 ? (Number(row.totalValue) / Number(v)).toFixed(4) : '—' },
          { key: 'currency', header: 'Currency' },
        ] as ListColumn[]}
        data={rows as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No valuation data"
        emptyDescription="Valuation data will appear after cost profiles are created."
      />
    </div>
  );
}
