'use client';
import { useState, useEffect, useCallback } from 'react';

const BASE = '/api/inventory/customer-returns';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? res.statusText); }
  return res.status === 204 ? null : res.json();
}

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  RECEIVED: 'bg-yellow-100 text-yellow-800',
  INSPECTED: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-700',
};
const CREDIT_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ISSUED: 'bg-green-100 text-green-800',
  VOIDED: 'bg-red-100 text-red-800',
};
const DISP_COLORS: Record<string, string> = {
  RESTOCK: 'bg-green-100 text-green-800',
  REFURBISH: 'bg-yellow-100 text-yellow-800',
  SCRAP: 'bg-red-100 text-red-800',
  RETURN_TO_VENDOR: 'bg-orange-100 text-orange-800',
  QUARANTINE: 'bg-purple-100 text-purple-800',
};

function Badge({ label, colorMap }: { label: string; colorMap: Record<string, string> }) {
  const cls = colorMap[label] ?? 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{label}</span>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total RMAs" value={data.totalRmas} />
      <StatCard label="Awaiting Approval" value={data.requested} />
      <StatCard label="Approved (not received)" value={data.approved} />
      <StatCard label="Received (pending inspection)" value={data.received} />
      <StatCard label="Inspected (ready to close)" value={data.inspected} />
      <StatCard label="Total Credits" value={data.totalCredits} sub={`${data.pendingCredits} pending`} />
      <StatCard label="Credit Value Issued" value={`$${Number(data.totalCreditIssued).toLocaleString()}`} />
    </div>
  );
}

// ── RMAs Tab ───────────────────────────────────────────────────────────────
function RmasTab() {
  const [rmas, setRmas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customerId: '', salesOrderId: '', returnReason: '', customerNotes: '', warehouseId: '',
    lines: [{ productId: '', quantityRequested: '', unitCost: '', lotNumber: '' }],
  });
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (filterStatus) params.set('status', filterStatus);
      const d = await apiFetch(`${BASE}/rmas?${params}`);
      setRmas(d.data); setTotal(d.total);
    } catch {} finally { setLoading(false); }
  }, [filterStatus]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setErr('');
    try {
      const lines = form.lines.map(l => ({
        productId: l.productId,
        quantityRequested: parseFloat(l.quantityRequested),
        ...(l.unitCost ? { unitCost: parseFloat(l.unitCost) } : {}),
        ...(l.lotNumber ? { lotNumber: l.lotNumber } : {}),
      }));
      const body: any = { customerId: form.customerId, returnReason: form.returnReason, lines };
      if (form.salesOrderId) body.salesOrderId = form.salesOrderId;
      if (form.customerNotes) body.customerNotes = form.customerNotes;
      if (form.warehouseId) body.warehouseId = form.warehouseId;
      await apiFetch(`${BASE}/rmas`, { method: 'POST', body: JSON.stringify(body) });
      setShowCreate(false); load();
    } catch (e: any) { setErr(e.message); }
  };

  const action = async (id: string, endpoint: string, method = 'PATCH', body?: any) => {
    await apiFetch(`${BASE}/${endpoint}`, { method, body: body ? JSON.stringify(body) : undefined });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{total} RMA(s)</p>
          <select className="border rounded p-1 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['REQUESTED','APPROVED','REJECTED','RECEIVED','INSPECTED','CLOSED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={() => setShowCreate(v => !v)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          + New RMA
        </button>
      </div>
      {showCreate && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Create RMA</h3>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">Customer ID *</label>
              <input className="w-full border rounded p-2 text-sm" value={form.customerId}
                onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Sales Order ID</label>
              <input className="w-full border rounded p-2 text-sm" value={form.salesOrderId}
                onChange={e => setForm(f => ({ ...f, salesOrderId: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs mb-1">Return Reason *</label>
              <input className="w-full border rounded p-2 text-sm" value={form.returnReason}
                onChange={e => setForm(f => ({ ...f, returnReason: e.target.value }))} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2">Lines</p>
            {form.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input className="border rounded p-1 text-sm" placeholder="Product ID" value={l.productId}
                  onChange={e => { const lines = form.lines.map((x, j) => j === i ? { ...x, productId: e.target.value } : x); setForm(f => ({ ...f, lines })); }} />
                <input type="number" className="border rounded p-1 text-sm" placeholder="Qty" value={l.quantityRequested}
                  onChange={e => { const lines = form.lines.map((x, j) => j === i ? { ...x, quantityRequested: e.target.value } : x); setForm(f => ({ ...f, lines })); }} />
                <input type="number" className="border rounded p-1 text-sm" placeholder="Unit Cost" value={l.unitCost}
                  onChange={e => { const lines = form.lines.map((x, j) => j === i ? { ...x, unitCost: e.target.value } : x); setForm(f => ({ ...f, lines })); }} />
                <input className="border rounded p-1 text-sm" placeholder="Lot #" value={l.lotNumber}
                  onChange={e => { const lines = form.lines.map((x, j) => j === i ? { ...x, lotNumber: e.target.value } : x); setForm(f => ({ ...f, lines })); }} />
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, lines: [...f.lines, { productId: '', quantityRequested: '', unitCost: '', lotNumber: '' }] }))}
              className="text-xs text-blue-600 hover:underline">+ Add Line</button>
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
              <tr>{['RMA #', 'Customer', 'Reason', 'Status', 'Lines', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rmas.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.rmaNumber}</td>
                  <td className="px-3 py-2 text-xs">{r.customerId}</td>
                  <td className="px-3 py-2 text-xs max-w-xs truncate">{r.returnReason}</td>
                  <td className="px-3 py-2"><Badge label={r.status} colorMap={STATUS_COLORS} /></td>
                  <td className="px-3 py-2 text-center text-xs">{r.lines?.length ?? 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.status === 'REQUESTED' && (
                        <>
                          <button onClick={() => action(r.id, `rmas/${r.id}/approve`)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Approve</button>
                          <button onClick={() => action(r.id, `rmas/${r.id}/reject`, 'PATCH', { reason: 'Not eligible' })} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Reject</button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button onClick={() => action(r.id, `rmas/${r.id}/receive`, 'PATCH', { lines: [] })} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">Mark Received</button>
                      )}
                      {r.status === 'INSPECTED' && (
                        <button onClick={() => action(r.id, `rmas/${r.id}/close`)} className="px-2 py-1 text-xs bg-gray-600 text-white rounded">Close</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rmas.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No RMAs found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Inspection Tab ─────────────────────────────────────────────────────────
function InspectionTab() {
  const [rmaId, setRmaId] = useState('');
  const [rma, setRma] = useState<any>(null);
  const [err, setErr] = useState('');

  const loadRma = async () => {
    if (!rmaId) return;
    setErr('');
    try { setRma(await apiFetch(`${BASE}/rmas/${rmaId}`)); }
    catch (e: any) { setErr(e.message); setRma(null); }
  };

  const inspect = async (lineId: string, disposition: string) => {
    await apiFetch(`${BASE}/rmas/${rmaId}/lines/${lineId}/inspect`, {
      method: 'PATCH', body: JSON.stringify({ disposition }),
    });
    loadRma();
  };

  const dispositions = ['RESTOCK','REFURBISH','SCRAP','RETURN_TO_VENDOR','QUARANTINE'];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs mb-1">RMA ID</label>
          <input className="w-full border rounded p-2 text-sm" placeholder="Paste RMA ID…" value={rmaId}
            onChange={e => setRmaId(e.target.value)} />
        </div>
        <button onClick={loadRma} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Load</button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {rma && (
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <p className="font-semibold">{rma.rmaNumber}</p>
            <Badge label={rma.status} colorMap={STATUS_COLORS} />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Product', 'Lot', 'Qty Req', 'Qty Recv', 'Disposition', 'Set Disposition'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(rma.lines ?? []).map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{l.productId}</td>
                  <td className="px-3 py-2 text-xs">{l.lotNumber ?? '—'}</td>
                  <td className="px-3 py-2 text-xs">{Number(l.quantityRequested).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{Number(l.quantityReceived).toFixed(2)}</td>
                  <td className="px-3 py-2">{l.disposition ? <Badge label={l.disposition} colorMap={DISP_COLORS} /> : '—'}</td>
                  <td className="px-3 py-2">
                    <select className="border rounded p-1 text-xs" defaultValue=""
                      onChange={e => { if (e.target.value) inspect(l.id, e.target.value); }}>
                      <option value="">Set…</option>
                      {dispositions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Credits Tab ────────────────────────────────────────────────────────────
function CreditsTab() {
  const [credits, setCredits] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ rmaId: '', creditAmount: '', currency: 'USD', notes: '' });
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch(`${BASE}/credits`); setCredits(d.data); setTotal(d.total); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const issue = async () => {
    setErr('');
    try {
      await apiFetch(`${BASE}/rmas/${form.rmaId}/credit`, {
        method: 'POST', body: JSON.stringify({
          creditAmount: parseFloat(form.creditAmount),
          currency: form.currency, notes: form.notes || undefined,
        }),
      });
      setShowCreate(false); load();
    } catch (e: any) { setErr(e.message); }
  };

  const voidCredit = async (id: string) => {
    const reason = prompt('Void reason:') ?? 'Manual void';
    await apiFetch(`${BASE}/credits/${id}/void`, { method: 'PATCH', body: JSON.stringify({ voidReason: reason }) });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{total} credit(s)</p>
        <button onClick={() => setShowCreate(v => !v)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          + Issue Credit
        </button>
      </div>
      {showCreate && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Issue Credit Memo</h3>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">RMA ID *</label>
              <input className="w-full border rounded p-2 text-sm" value={form.rmaId}
                onChange={e => setForm(f => ({ ...f, rmaId: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Credit Amount *</label>
              <input type="number" className="w-full border rounded p-2 text-sm" value={form.creditAmount}
                onChange={e => setForm(f => ({ ...f, creditAmount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Currency</label>
              <input className="w-full border rounded p-2 text-sm" value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Notes</label>
              <input className="w-full border rounded p-2 text-sm" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={issue} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">Issue</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm border rounded">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Credit #', 'RMA', 'Customer', 'Amount', 'Currency', 'Status', 'Issued At', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {credits.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{c.creditNumber}</td>
                  <td className="px-3 py-2 font-mono text-xs">{c.rmaId}</td>
                  <td className="px-3 py-2 text-xs">{c.customerId}</td>
                  <td className="px-3 py-2 text-xs font-semibold">{Number(c.creditAmount).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{c.currency}</td>
                  <td className="px-3 py-2"><Badge label={c.status} colorMap={CREDIT_COLORS} /></td>
                  <td className="px-3 py-2 text-xs">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">
                    {c.status === 'ISSUED' && (
                      <button onClick={() => voidCredit(c.id)} className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50">Void</button>
                    )}
                  </td>
                </tr>
              ))}
              {credits.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500">No credits found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Restocks Tab ───────────────────────────────────────────────────────────
function RestocksTab() {
  const [restocks, setRestocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rmaLineId: '', productId: '', warehouseId: '', binLocationId: '', quantityRestocked: '', notes: '' });
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setRestocks(await apiFetch(`${BASE}/restocks`)); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const record = async () => {
    setErr('');
    try {
      await apiFetch(`${BASE}/restocks`, {
        method: 'POST',
        body: JSON.stringify({
          rmaLineId: form.rmaLineId, productId: form.productId, warehouseId: form.warehouseId,
          quantityRestocked: parseFloat(form.quantityRestocked),
          ...(form.binLocationId ? { binLocationId: form.binLocationId } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
        }),
      });
      setShowForm(false); load();
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{restocks.length} restock record(s)</p>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          + Record Restock
        </button>
      </div>
      {showForm && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Record Restock</h3>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            {(['rmaLineId', 'productId', 'warehouseId', 'binLocationId', 'quantityRestocked', 'notes'] as const).map(key => (
              <div key={key}>
                <label className="block text-xs mb-1">{key}</label>
                <input className="w-full border rounded p-2 text-sm" value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={record} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">Record</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border rounded">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['RMA Line', 'Product', 'Warehouse', 'Bin', 'Qty Restocked', 'Restocked At'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {restocks.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.rmaLineId}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.productId}</td>
                  <td className="px-3 py-2 text-xs">{r.warehouseId}</td>
                  <td className="px-3 py-2 text-xs">{r.binLocationId ?? '—'}</td>
                  <td className="px-3 py-2 text-xs">{Number(r.quantityRestocked).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{new Date(r.restockedAt).toLocaleString()}</td>
                </tr>
              ))}
              {restocks.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No restocks yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Root Page ──────────────────────────────────────────────────────────────
const TABS = ['Dashboard', 'RMAs', 'Inspection', 'Credits', 'Restocks'];

export default function CustomerReturnsPage() {
  const [tab, setTab] = useState('Dashboard');
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Customer Returns & Reverse Logistics</h1>
        <p className="text-sm text-gray-500 mt-1">Manage RMAs, return inspections, credit memos, and restock workflows for customer-returned goods.</p>
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
        {tab === 'RMAs' && <RmasTab />}
        {tab === 'Inspection' && <InspectionTab />}
        {tab === 'Credits' && <CreditsTab />}
        {tab === 'Restocks' && <RestocksTab />}
      </div>
    </div>
  );
}
