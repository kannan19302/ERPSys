'use client';
import { useState, useEffect, useCallback } from 'react';

const BASE = '/api/inventory/velocity-abc-xyz';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? res.statusText); }
  return res.status === 204 ? null : res.json();
}

const ABC_COLORS: Record<string, string> = { A: 'bg-green-100 text-green-800', B: 'bg-yellow-100 text-yellow-800', C: 'bg-red-100 text-red-800' };
const XYZ_COLORS: Record<string, string> = { X: 'bg-blue-100 text-blue-800', Y: 'bg-purple-100 text-purple-800', Z: 'bg-orange-100 text-orange-800' };

function Badge({ label, colorMap }: { label: string; colorMap: Record<string, string> }) {
  const cls = colorMap[label] ?? 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{label}</span>;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────
function DashboardTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch(`${BASE}/dashboard`)); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;
  if (!data) return <p className="text-sm text-red-500 p-4">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Runs" value={data.totalRuns} />
        <StatCard label="Active Run Products" value={data.activeRun?.totalProducts ?? '—'} />
        <StatCard label="Velocity Snapshots" value={data.totalSnapshots} />
        <StatCard label="Active Slotting Policies" value={data.activePolicies} />
      </div>
      {data.activeRun && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Active Run: {data.activeRun.runNumber}</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {['A', 'B', 'C'].map(c => (
              <div key={c} className="rounded-lg border p-3 text-center">
                <Badge label={c} colorMap={ABC_COLORS} />
                <p className="text-xl font-bold mt-1">{data.activeRun[`class${c}Count`]}</p>
              </div>
            ))}
            {['X', 'Y', 'Z'].map(c => (
              <div key={c} className="rounded-lg border p-3 text-center">
                <Badge label={c} colorMap={XYZ_COLORS} />
                <p className="text-xl font-bold mt-1">{data.activeRun[`class${c}Count`]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {Object.keys(data.classBreakdown ?? {}).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Combined Class Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.classBreakdown).map(([cls, cnt]) => (
              <div key={cls} className="rounded border px-3 py-1 flex items-center gap-2">
                <span className="font-mono font-bold text-sm">{cls}</span>
                <span className="text-gray-600 text-sm">{cnt as number} products</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Runs Tab ───────────────────────────────────────────────────────────────
function RunsTab() {
  const [runs, setRuns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ periodStart: '', periodEnd: '', warehouseId: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch(`${BASE}/runs`); setRuns(d.data); setTotal(d.total); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const body: any = { periodStart: form.periodStart, periodEnd: form.periodEnd };
    if (form.warehouseId) body.warehouseId = form.warehouseId;
    if (form.notes) body.notes = form.notes;
    await apiFetch(`${BASE}/runs`, { method: 'POST', body: JSON.stringify(body) });
    setShowCreate(false); setForm({ periodStart: '', periodEnd: '', warehouseId: '', notes: '' }); load();
  };

  const activate = async (id: string) => {
    await apiFetch(`${BASE}/runs/${id}/activate`, { method: 'PATCH' }); load();
  };
  const deleteRun = async (id: string) => {
    if (!confirm('Delete this run?')) return;
    await apiFetch(`${BASE}/runs/${id}`, { method: 'DELETE' }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{total} run(s)</p>
        <button onClick={() => setShowCreate(v => !v)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          + New Run
        </button>
      </div>
      {showCreate && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Create Classification Run</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">Period Start *</label>
              <input type="date" className="w-full border rounded p-2 text-sm" value={form.periodStart}
                onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Period End *</label>
              <input type="date" className="w-full border rounded p-2 text-sm" value={form.periodEnd}
                onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1">Warehouse ID (blank = all)</label>
            <input className="w-full border rounded p-2 text-sm" value={form.warehouseId}
              onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Notes</label>
            <input className="w-full border rounded p-2 text-sm" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm border rounded">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Run #', 'Period', 'Warehouse', 'Status', 'Products', 'A/B/C', 'X/Y/Z', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.runNumber}</td>
                  <td className="px-3 py-2 text-xs">{r.periodStart?.slice(0, 10)} – {r.periodEnd?.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-xs">{r.warehouseId ?? 'All'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : r.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-center">{r.totalProducts}</td>
                  <td className="px-3 py-2 text-xs">{r.classACount}/{r.classBCount}/{r.classCCount}</td>
                  <td className="px-3 py-2 text-xs">{r.classXCount}/{r.classYCount}/{r.classZCount}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {r.status === 'DRAFT' && r.totalProducts > 0 && (
                        <button onClick={() => activate(r.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Activate</button>
                      )}
                      {r.status !== 'ACTIVE' && (
                        <button onClick={() => deleteRun(r.id)} className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500">No runs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Classification Items Tab ───────────────────────────────────────────────
function ItemsTab() {
  const [runId, setRunId] = useState('');
  const [filter, setFilter] = useState({ abcClass: '', xyzClass: '' });
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (filter.abcClass) params.set('abcClass', filter.abcClass);
      if (filter.xyzClass) params.set('xyzClass', filter.xyzClass);
      const d = await apiFetch(`${BASE}/runs/${runId}/items?${params}`);
      setItems(d.data); setTotal(d.total);
    } catch {} finally { setLoading(false); }
  }, [runId, filter]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs mb-1">Run ID</label>
          <input className="w-full border rounded p-2 text-sm" placeholder="Paste run ID…" value={runId}
            onChange={e => setRunId(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1">ABC Class</label>
          <select className="w-full border rounded p-2 text-sm" value={filter.abcClass}
            onChange={e => setFilter(f => ({ ...f, abcClass: e.target.value }))}>
            <option value="">All</option>
            {['A', 'B', 'C'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">XYZ Class</label>
          <select className="w-full border rounded p-2 text-sm" value={filter.xyzClass}
            onChange={e => setFilter(f => ({ ...f, xyzClass: e.target.value }))}>
            <option value="">All</option>
            {['X', 'Y', 'Z'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : !runId ? (
        <p className="text-sm text-gray-400 py-4 text-center">Enter a Run ID to view items.</p>
      ) : (
        <div className="overflow-x-auto">
          <p className="text-sm text-gray-500 mb-2">{total} item(s)</p>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Product', 'Warehouse', 'Revenue', 'Qty Sold', 'Rev Share', 'Cum Share', 'ABC', 'XYZ', 'Class', 'CV'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{i.productId}</td>
                  <td className="px-3 py-2 text-xs">{i.warehouseId ?? 'All'}</td>
                  <td className="px-3 py-2 text-xs">{Number(i.totalRevenue).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{Number(i.totalQuantitySold).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{(Number(i.revenueShare) * 100).toFixed(2)}%</td>
                  <td className="px-3 py-2 text-xs">{(Number(i.cumulativeShare) * 100).toFixed(2)}%</td>
                  <td className="px-3 py-2"><Badge label={i.abcClass} colorMap={ABC_COLORS} /></td>
                  <td className="px-3 py-2"><Badge label={i.xyzClass} colorMap={XYZ_COLORS} /></td>
                  <td className="px-3 py-2 font-mono font-bold text-sm">{i.combinedClass}</td>
                  <td className="px-3 py-2 text-xs">{i.demandCv != null ? Number(i.demandCv).toFixed(3) : '—'}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-500">No items.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Policies Tab ───────────────────────────────────────────────────────────
function PoliciesTab() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ combinedClass: 'AX', reviewFrequency: 'DAILY', reorderMethod: 'CONTINUOUS', safetyStockMultiplier: '1', preferredZone: '' });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPolicies(await apiFetch(`${BASE}/policies`)); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const body: any = { ...form, safetyStockMultiplier: parseFloat(form.safetyStockMultiplier) };
    await apiFetch(`${BASE}/policies`, { method: 'POST', body: JSON.stringify(body) });
    setShowForm(false); load();
  };
  const deleteP = async (id: string) => {
    if (!confirm('Delete policy?')) return;
    await apiFetch(`${BASE}/policies/${id}`, { method: 'DELETE' }); load();
  };

  const classes = ['AX','AY','AZ','BX','BY','BZ','CX','CY','CZ'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{policies.length} policy/policies</p>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          + Upsert Policy
        </button>
      </div>
      {showForm && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Slotting Policy</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">Combined Class</label>
              <select className="w-full border rounded p-2 text-sm" value={form.combinedClass}
                onChange={e => setForm(f => ({ ...f, combinedClass: e.target.value }))}>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Review Frequency</label>
              <select className="w-full border rounded p-2 text-sm" value={form.reviewFrequency}
                onChange={e => setForm(f => ({ ...f, reviewFrequency: e.target.value }))}>
                {['DAILY','WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Reorder Method</label>
              <select className="w-full border rounded p-2 text-sm" value={form.reorderMethod}
                onChange={e => setForm(f => ({ ...f, reorderMethod: e.target.value }))}>
                {['CONTINUOUS','PERIODIC','MANUAL'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Safety Stock Multiplier</label>
              <input type="number" step="0.1" className="w-full border rounded p-2 text-sm" value={form.safetyStockMultiplier}
                onChange={e => setForm(f => ({ ...f, safetyStockMultiplier: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Preferred Zone</label>
              <input className="w-full border rounded p-2 text-sm" value={form.preferredZone}
                onChange={e => setForm(f => ({ ...f, preferredZone: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">Save</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border rounded">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Class', 'Review Frequency', 'Reorder Method', 'Safety Stock ×', 'Zone', 'Active', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono font-bold">{p.combinedClass}</td>
                  <td className="px-3 py-2 text-xs">{p.reviewFrequency}</td>
                  <td className="px-3 py-2 text-xs">{p.reorderMethod}</td>
                  <td className="px-3 py-2 text-xs">{Number(p.safetyStockMultiplier).toFixed(2)}×</td>
                  <td className="px-3 py-2 text-xs">{p.preferredZone ?? '—'}</td>
                  <td className="px-3 py-2">{p.active ? '✅' : '❌'}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => deleteP(p.id)} className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">No policies yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Snapshots Tab ──────────────────────────────────────────────────────────
function SnapshotsTab() {
  const [productId, setProductId] = useState('');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ productId: '', snapshotMonth: '', quantitySold: '', revenue: '', transactionCount: '', avgSellingPrice: '' });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try { setSnapshots(await apiFetch(`${BASE}/products/${productId}/snapshots`)); }
    catch {} finally { setLoading(false); }
  }, [productId]);

  const record = async () => {
    const body: any = {
      productId: form.productId, snapshotMonth: form.snapshotMonth,
      quantitySold: parseFloat(form.quantitySold), revenue: parseFloat(form.revenue),
      transactionCount: parseInt(form.transactionCount),
    };
    if (form.avgSellingPrice) body.avgSellingPrice = parseFloat(form.avgSellingPrice);
    await apiFetch(`${BASE}/snapshots`, { method: 'POST', body: JSON.stringify(body) });
    setShowForm(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs mb-1">Product ID</label>
          <input className="w-full border rounded p-2 text-sm" placeholder="Enter product ID to view snapshots…"
            value={productId} onChange={e => setProductId(e.target.value)} />
        </div>
        <button onClick={load} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Load</button>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-2 text-sm border rounded">+ Record Snapshot</button>
      </div>
      {showForm && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Record Monthly Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">Product ID *</label>
              <input className="w-full border rounded p-2 text-sm" value={form.productId}
                onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Month (YYYY-MM-01) *</label>
              <input type="date" className="w-full border rounded p-2 text-sm" value={form.snapshotMonth}
                onChange={e => setForm(f => ({ ...f, snapshotMonth: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Qty Sold *</label>
              <input type="number" className="w-full border rounded p-2 text-sm" value={form.quantitySold}
                onChange={e => setForm(f => ({ ...f, quantitySold: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Revenue *</label>
              <input type="number" className="w-full border rounded p-2 text-sm" value={form.revenue}
                onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Transaction Count *</label>
              <input type="number" className="w-full border rounded p-2 text-sm" value={form.transactionCount}
                onChange={e => setForm(f => ({ ...f, transactionCount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Avg Selling Price</label>
              <input type="number" className="w-full border rounded p-2 text-sm" value={form.avgSellingPrice}
                onChange={e => setForm(f => ({ ...f, avgSellingPrice: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={record} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">Record</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border rounded">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : snapshots.length === 0 && productId ? (
        <p className="text-sm text-gray-400 py-4 text-center">No snapshots found.</p>
      ) : snapshots.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Month', 'Qty Sold', 'Revenue', 'Transactions', 'Avg Price', 'ABC', 'XYZ'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {snapshots.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{s.snapshotMonth?.slice(0, 7)}</td>
                  <td className="px-3 py-2 text-xs">{Number(s.quantitySold).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{Number(s.revenue).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{s.transactionCount}</td>
                  <td className="px-3 py-2 text-xs">{s.avgSellingPrice != null ? Number(s.avgSellingPrice).toFixed(2) : '—'}</td>
                  <td className="px-3 py-2">{s.abcClass ? <Badge label={s.abcClass} colorMap={ABC_COLORS} /> : '—'}</td>
                  <td className="px-3 py-2">{s.xyzClass ? <Badge label={s.xyzClass} colorMap={XYZ_COLORS} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

// ── Root Page ──────────────────────────────────────────────────────────────
const TABS = ['Dashboard', 'Runs', 'Classifications', 'Policies', 'Snapshots'];

export default function VelocityAbcXyzPage() {
  const [tab, setTab] = useState('Dashboard');
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Inventory Velocity & ABC-XYZ Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">Classify products by value (ABC) and demand variability (XYZ) to optimize stocking and replenishment policies.</p>
      </div>
      <div className="border-b flex gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {t}
          </button>
        ))}
      </div>
      <div>
        {tab === 'Dashboard' && <DashboardTab />}
        {tab === 'Runs' && <RunsTab />}
        {tab === 'Classifications' && <ItemsTab />}
        {tab === 'Policies' && <PoliciesTab />}
        {tab === 'Snapshots' && <SnapshotsTab />}
      </div>
    </div>
  );
}
