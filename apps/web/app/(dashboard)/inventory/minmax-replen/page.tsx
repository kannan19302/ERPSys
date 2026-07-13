'use client';
import { useState, useEffect, useCallback } from 'react';

const BASE = '/api/inventory/minmax-replen';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? res.statusText); }
  return res.status === 204 ? null : res.json();
}

const SUGG_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  ORDERED: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-800',
};

function Badge({ label, colorMap }: { label: string; colorMap: Record<string, string> }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colorMap[label] ?? 'bg-gray-100 text-gray-700'}`}>{label}</span>;
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
  useEffect(() => {
    apiFetch(`${BASE}/dashboard`).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;
  if (!data) return <p className="text-sm text-red-500 p-4">Failed to load.</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Active Levels" value={`${data.activeLevels} / ${data.totalLevels}`} />
        <StatCard label="Open Suggestions" value={data.openSugg} />
        <StatCard label="Approved (pending order)" value={data.approvedSugg} />
        <StatCard label="Ordered (in transit)" value={data.orderedSugg} />
        <StatCard label="Total Runs" value={data.totalRuns} />
      </div>
      {data.lastRun && (
        <div className="border rounded p-4">
          <p className="text-xs text-gray-500">Last Run</p>
          <p className="font-mono font-semibold">{data.lastRun.runNumber}</p>
          <p className="text-sm text-gray-600">Scanned {data.lastRun.levelsScanned} levels · Created {data.lastRun.suggestionsCreated} suggestions</p>
        </div>
      )}
    </div>
  );
}

// ── Levels Tab ─────────────────────────────────────────────────────────────
function LevelsTab() {
  const [levels, setLevels] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', warehouseId: '', minQty: '', maxQty: '', reorderQty: '', method: 'PURCHASE_ORDER', leadTimeDays: '0', preferredVendorId: '', notes: '' });
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch(`${BASE}/levels`); setLevels(d.data); setTotal(d.total); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setErr('');
    try {
      const body: any = {
        productId: form.productId, warehouseId: form.warehouseId,
        minQty: parseFloat(form.minQty), maxQty: parseFloat(form.maxQty),
        method: form.method, leadTimeDays: parseInt(form.leadTimeDays),
      };
      if (form.reorderQty) body.reorderQty = parseFloat(form.reorderQty);
      if (form.preferredVendorId) body.preferredVendorId = form.preferredVendorId;
      if (form.notes) body.notes = form.notes;
      await apiFetch(`${BASE}/levels`, { method: 'POST', body: JSON.stringify(body) });
      setShowForm(false); load();
    } catch (e: any) { setErr(e.message); }
  };

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this level?')) return;
    await apiFetch(`${BASE}/levels/${id}/deactivate`, { method: 'PATCH' }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{total} level(s)</p>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          + Set Level
        </button>
      </div>
      {showForm && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Set Min-Max Level</h3>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs mb-1">Product ID *</label><input className="w-full border rounded p-2 text-sm" value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">Warehouse ID *</label><input className="w-full border rounded p-2 text-sm" value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">Min Qty *</label><input type="number" className="w-full border rounded p-2 text-sm" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">Max Qty *</label><input type="number" className="w-full border rounded p-2 text-sm" value={form.maxQty} onChange={e => setForm(f => ({ ...f, maxQty: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">Reorder Qty (override)</label><input type="number" className="w-full border rounded p-2 text-sm" value={form.reorderQty} onChange={e => setForm(f => ({ ...f, reorderQty: e.target.value }))} /></div>
            <div>
              <label className="block text-xs mb-1">Method</label>
              <select className="w-full border rounded p-2 text-sm" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                {['PURCHASE_ORDER','TRANSFER','PRODUCTION'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label className="block text-xs mb-1">Lead Time (days)</label><input type="number" className="w-full border rounded p-2 text-sm" value={form.leadTimeDays} onChange={e => setForm(f => ({ ...f, leadTimeDays: e.target.value }))} /></div>
            <div><label className="block text-xs mb-1">Preferred Vendor ID</label><input className="w-full border rounded p-2 text-sm" value={form.preferredVendorId} onChange={e => setForm(f => ({ ...f, preferredVendorId: e.target.value }))} /></div>
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
              <tr>{['Product', 'Warehouse', 'Min', 'Max', 'Reorder Qty', 'Method', 'Lead Days', 'Active', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {levels.map(l => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{l.productId}</td>
                  <td className="px-3 py-2 text-xs">{l.warehouseId}</td>
                  <td className="px-3 py-2 text-xs">{Number(l.minQty).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{Number(l.maxQty).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{l.reorderQty != null ? Number(l.reorderQty).toFixed(2) : '—'}</td>
                  <td className="px-3 py-2 text-xs">{l.method}</td>
                  <td className="px-3 py-2 text-xs text-center">{l.leadTimeDays}</td>
                  <td className="px-3 py-2">{l.active ? '✅' : '❌'}</td>
                  <td className="px-3 py-2">
                    {l.active && <button onClick={() => deactivate(l.id)} className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50">Deactivate</button>}
                  </td>
                </tr>
              ))}
              {levels.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">No levels configured.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Run Tab ────────────────────────────────────────────────────────────────
function RunTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockInput, setStockInput] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch(`${BASE}/run-logs`); setLogs(d.data); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  const triggerRun = async () => {
    setErr('');
    setRunning(true);
    try {
      // Parse stock snapshot from textarea: "productId:warehouseId=qty" per line
      const stockSnapshot: Record<string, number> = {};
      stockInput.split('\n').forEach(line => {
        const [key, val] = line.trim().split('=');
        if (key && val) stockSnapshot[key.trim()] = parseFloat(val.trim());
      });
      const body: any = { stockSnapshot };
      if (warehouseId) body.warehouseId = warehouseId;
      const result = await apiFetch(`${BASE}/run`, { method: 'POST', body: JSON.stringify(body) });
      setLastResult(result); loadLogs();
    } catch (e: any) { setErr(e.message); }
    finally { setRunning(false); }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded p-4 space-y-3">
        <h3 className="font-semibold text-sm">Trigger Replenishment Run</h3>
        <p className="text-xs text-gray-500">Enter current stock snapshot. Format one entry per line: <code>productId:warehouseId=quantity</code></p>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div>
          <label className="block text-xs mb-1">Warehouse Filter (blank = all)</label>
          <input className="w-full border rounded p-2 text-sm" value={warehouseId} onChange={e => setWarehouseId(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1">Stock Snapshot *</label>
          <textarea rows={5} className="w-full border rounded p-2 text-sm font-mono" placeholder="p1:w1=15&#10;p2:w1=80&#10;p3:w2=5" value={stockInput} onChange={e => setStockInput(e.target.value)} />
        </div>
        <button onClick={triggerRun} disabled={running} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {running ? 'Running…' : '▶ Run Replenishment Check'}
        </button>
        {lastResult && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
            <p className="font-semibold text-green-800">Run complete: {lastResult.runNumber}</p>
            <p className="text-green-700">Scanned {lastResult.levelsScanned} levels · Created {lastResult.suggestionsCreated} suggestion(s)</p>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">Run History</h3>
        {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Run #', 'Warehouse', 'Levels Scanned', 'Suggestions', 'Completed At'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{l.runNumber}</td>
                    <td className="px-3 py-2 text-xs">{l.warehouseId ?? 'All'}</td>
                    <td className="px-3 py-2 text-center text-xs">{l.levelsScanned}</td>
                    <td className="px-3 py-2 text-center text-xs">{l.suggestionsCreated}</td>
                    <td className="px-3 py-2 text-xs">{l.completedAt ? new Date(l.completedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">No runs yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Suggestions Tab ────────────────────────────────────────────────────────
function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('OPEN');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (filterStatus) params.set('status', filterStatus);
      const d = await apiFetch(`${BASE}/suggestions?${params}`);
      setSuggestions(d.data); setTotal(d.total);
    } catch {} finally { setLoading(false); }
  }, [filterStatus]);
  useEffect(() => { load(); }, [load]);

  const action = async (id: string, endpoint: string, body?: any) => {
    await apiFetch(`${BASE}/suggestions/${id}/${endpoint}`, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">{total} suggestion(s)</p>
        <select className="border rounded p-1 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All</option>
          {['OPEN','APPROVED','ORDERED','RECEIVED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Suggestion #', 'Product', 'Warehouse', 'Current Stock', 'Suggested Qty', 'Method', 'Needed By', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {suggestions.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{s.suggestionNumber}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.productId}</td>
                  <td className="px-3 py-2 text-xs">{s.warehouseId}</td>
                  <td className="px-3 py-2 text-xs">{Number(s.currentStock).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs font-semibold">{Number(s.suggestedQty).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{s.method}</td>
                  <td className="px-3 py-2 text-xs">{s.neededByDate ? new Date(s.neededByDate).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2"><Badge label={s.status} colorMap={SUGG_COLORS} /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {s.status === 'OPEN' && <button onClick={() => action(s.id, 'approve')} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Approve</button>}
                      {s.status === 'APPROVED' && <button onClick={() => action(s.id, 'order')} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">Mark Ordered</button>}
                      {s.status === 'ORDERED' && <button onClick={() => action(s.id, 'receive')} className="px-2 py-1 text-xs bg-gray-600 text-white rounded">Mark Received</button>}
                      {!['RECEIVED','CANCELLED'].includes(s.status) && (
                        <button onClick={() => action(s.id, 'cancel', { reason: 'Manual cancel' })} className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {suggestions.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">No suggestions.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Root Page ──────────────────────────────────────────────────────────────
const TABS = ['Dashboard', 'Min-Max Levels', 'Run Replenishment', 'Suggestions'];

export default function MinMaxReplenPage() {
  const [tab, setTab] = useState('Dashboard');
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Min-Max Replenishment Planning</h1>
        <p className="text-sm text-gray-500 mt-1">Configure min/max stock thresholds per product-warehouse pair, trigger automated replenishment scans, and manage order suggestions through their lifecycle.</p>
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
        {tab === 'Min-Max Levels' && <LevelsTab />}
        {tab === 'Run Replenishment' && <RunTab />}
        {tab === 'Suggestions' && <SuggestionsTab />}
      </div>
    </div>
  );
}
