'use client';

import { useState, useEffect, useCallback } from 'react';

const API = '/api';
async function apiFetch(path: string): Promise<any> {
  const res = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

type Tab = 'dashboard' | 'batches' | 'serials' | 'picks' | 'expiry' | 'quarantine';

function StatCard({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${warn ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${warn ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color] ?? colors.gray}`}>{label}</span>;
}

function batchStatusColor(s: string) {
  return { ACTIVE: 'green', QUARANTINE: 'orange', EXPIRED: 'red', PARTIALLY_USED: 'blue', EXHAUSTED: 'gray' }[s] ?? 'gray';
}
function serialStatusColor(s: string) {
  return { AVAILABLE: 'green', RESERVED: 'blue', SOLD: 'gray', RETURNED: 'orange', IN_REPAIR: 'yellow', SCRAPPED: 'red' }[s] ?? 'gray';
}
function pickStatusColor(s: string) {
  return { PENDING: 'yellow', CONFIRMED: 'green', CANCELLED: 'gray' }[s] ?? 'gray';
}
function severityColor(s: string) {
  return { WARNING: 'yellow', CRITICAL: 'red', EXPIRED: 'red' }[s] ?? 'gray';
}
function quarantineStatusColor(s: string) {
  return { ACTIVE: 'orange', RELEASED: 'green', SCRAPPED: 'gray' }[s] ?? 'gray';
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardTab() {
  const [data, setData] = useState<any>(null);
  const [expiry, setExpiry] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/inventory/lot-serial/dashboard'),
      apiFetch('/inventory/lot-serial/expiry-report'),
    ]).then(([d, e]) => { setData(d); setExpiry(e); }).catch(() => {});
  }, []);

  if (!data) return <div className="py-8 text-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Lots / Batches</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Active" value={data.batches?.active ?? 0} />
          <StatCard label="Quarantine" value={data.batches?.quarantine ?? 0} warn={(data.batches?.quarantine ?? 0) > 0} />
          <StatCard label="Expired" value={data.batches?.expired ?? 0} warn={(data.batches?.expired ?? 0) > 0} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Serial Numbers</h3>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <StatCard label="Available" value={data.serials?.available ?? 0} />
          <StatCard label="Sold" value={data.serials?.sold ?? 0} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Pick Suggestions</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Pending" value={data.picks?.pending ?? 0} warn={(data.picks?.pending ?? 0) > 5} />
          <StatCard label="Confirmed" value={data.picks?.confirmed ?? 0} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Expiry Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Expired" value={expiry?.expired ?? 0} warn={(expiry?.expired ?? 0) > 0} />
          <StatCard label="Expiring ≤7 days" value={expiry?.expiringIn7 ?? 0} warn={(expiry?.expiringIn7 ?? 0) > 0} />
          <StatCard label="Expiring ≤30 days" value={expiry?.expiringIn30 ?? 0} warn={(expiry?.expiringIn30 ?? 0) > 0} />
          <StatCard label="Expiring ≤90 days" value={expiry?.expiringIn90 ?? 0} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Alerts & Quarantine</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Unacknowledged Alerts" value={data.alerts?.unacknowledged ?? 0} warn={(data.alerts?.unacknowledged ?? 0) > 0} />
          <StatCard label="Critical Alerts" value={data.alerts?.critical ?? 0} warn={(data.alerts?.critical ?? 0) > 0} />
          <StatCard label="Active Quarantine Orders" value={data.quarantine?.active ?? 0} warn={(data.quarantine?.active ?? 0) > 0} />
        </div>
      </div>
    </div>
  );
}

// ── Batches Tab ────────────────────────────────────────────────────────────
function BatchesTab() {
  const [batches, setBatches] = useState<any[]>([]);
  const [status, setStatus] = useState('ACTIVE');

  const load = useCallback(() => {
    const qs = status ? `?status=${status}` : '';
    apiFetch(`/inventory/lot-serial/batches${qs}`).then((d: any) => setBatches(Array.isArray(d) ? d : [])).catch(() => {});
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'ACTIVE', 'QUARANTINE', 'EXPIRED', 'EXHAUSTED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="pb-2 pr-4">Batch No</th>
              <th className="pb-2 pr-4">Product</th>
              <th className="pb-2 pr-4">Qty</th>
              <th className="pb-2 pr-4">Expiry Date</th>
              <th className="pb-2 pr-4">Mfg Date</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {batches.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 pr-4 font-mono text-xs">{b.batchNo}</td>
                <td className="py-2 pr-4 text-xs">{b.productId}</td>
                <td className="py-2 pr-4">{String(b.quantity)}</td>
                <td className="py-2 pr-4 text-xs">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}</td>
                <td className="py-2 pr-4 text-xs">{b.manufactureDate ? new Date(b.manufactureDate).toLocaleDateString() : '—'}</td>
                <td className="py-2"><Badge label={b.status} color={batchStatusColor(b.status)} /></td>
              </tr>
            ))}
            {batches.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No batches found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Serials Tab ────────────────────────────────────────────────────────────
function SerialsTab() {
  const [serials, setSerials] = useState<any[]>([]);
  const [status, setStatus] = useState('AVAILABLE');

  const load = useCallback(() => {
    const qs = status ? `?status=${status}` : '';
    apiFetch(`/inventory/lot-serial/serials${qs}`).then((d: any) => setSerials(Array.isArray(d) ? d : [])).catch(() => {});
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'AVAILABLE', 'RESERVED', 'SOLD', 'RETURNED', 'SCRAPPED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="pb-2 pr-4">Serial No</th>
              <th className="pb-2 pr-4">Product</th>
              <th className="pb-2 pr-4">Warehouse</th>
              <th className="pb-2 pr-4">Warranty Expiry</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {serials.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 pr-4 font-mono text-xs">{s.serialNo}</td>
                <td className="py-2 pr-4 text-xs">{s.productId}</td>
                <td className="py-2 pr-4 text-xs">{s.warehouseId ?? '—'}</td>
                <td className="py-2 pr-4 text-xs">{s.warrantyExpiry ? new Date(s.warrantyExpiry).toLocaleDateString() : '—'}</td>
                <td className="py-2"><Badge label={s.status} color={serialStatusColor(s.status)} /></td>
              </tr>
            ))}
            {serials.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No serial numbers found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Pick Suggestions Tab ───────────────────────────────────────────────────
function PickSuggestionsTab() {
  const [picks, setPicks] = useState<any[]>([]);
  const [status, setStatus] = useState('PENDING');

  const load = useCallback(() => {
    const qs = status ? `?status=${status}` : '';
    apiFetch(`/inventory/lot-serial/pick-suggestions${qs}`).then((d: any) => setPicks(Array.isArray(d) ? d : [])).catch(() => {});
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'PENDING', 'CONFIRMED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="pb-2 pr-4">Product</th>
              <th className="pb-2 pr-4">Strategy</th>
              <th className="pb-2 pr-4">Batch</th>
              <th className="pb-2 pr-4">Suggested Qty</th>
              <th className="pb-2 pr-4">Picked Qty</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {picks.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 pr-4 text-xs">{p.productId}</td>
                <td className="py-2 pr-4"><Badge label={p.strategy} color="blue" /></td>
                <td className="py-2 pr-4 text-xs font-mono">{p.batchId ?? '—'}</td>
                <td className="py-2 pr-4">{String(p.suggestedQty)}</td>
                <td className="py-2 pr-4">{String(p.pickedQty)}</td>
                <td className="py-2"><Badge label={p.status} color={pickStatusColor(p.status)} /></td>
              </tr>
            ))}
            {picks.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No pick suggestions found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Expiry Alerts Tab ──────────────────────────────────────────────────────
function ExpiryAlertsTab() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAck, setShowAck] = useState(false);

  const load = useCallback(() => {
    apiFetch(`/inventory/lot-serial/expiry-alerts?acknowledged=${showAck}`)
      .then((d: any) => setAlerts(Array.isArray(d) ? d : [])).catch(() => {});
  }, [showAck]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowAck(false)}
          className={`px-3 py-1 rounded text-xs font-medium border ${!showAck ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
          Unacknowledged
        </button>
        <button onClick={() => setShowAck(true)}
          className={`px-3 py-1 rounded text-xs font-medium border ${showAck ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
          Acknowledged
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="pb-2 pr-4">Product</th>
              <th className="pb-2 pr-4">Batch</th>
              <th className="pb-2 pr-4">Expiry Date</th>
              <th className="pb-2 pr-4">Days Until</th>
              <th className="pb-2 pr-4">Qty</th>
              <th className="pb-2">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {alerts.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 pr-4 text-xs">{a.productId}</td>
                <td className="py-2 pr-4 text-xs font-mono">{a.batchId}</td>
                <td className="py-2 pr-4 text-xs">{new Date(a.expiryDate).toLocaleDateString()}</td>
                <td className="py-2 pr-4">{a.daysUntilExpiry <= 0 ? 'Expired' : `${a.daysUntilExpiry}d`}</td>
                <td className="py-2 pr-4">{String(a.qty)}</td>
                <td className="py-2"><Badge label={a.severity} color={severityColor(a.severity)} /></td>
              </tr>
            ))}
            {alerts.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No alerts found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Quarantine Tab ─────────────────────────────────────────────────────────
function QuarantineTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState('ACTIVE');

  const load = useCallback(() => {
    const qs = status ? `?status=${status}` : '';
    apiFetch(`/inventory/lot-serial/quarantine${qs}`).then((d: any) => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'ACTIVE', 'RELEASED', 'SCRAPPED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="pb-2 pr-4">Order #</th>
              <th className="pb-2 pr-4">Product</th>
              <th className="pb-2 pr-4">Qty</th>
              <th className="pb-2 pr-4">Reason</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2">Released At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 pr-4 font-mono text-xs">{o.orderNumber}</td>
                <td className="py-2 pr-4 text-xs">{o.productId}</td>
                <td className="py-2 pr-4">{String(o.qty)}</td>
                <td className="py-2 pr-4 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{o.reason}</td>
                <td className="py-2 pr-4"><Badge label={o.status} color={quarantineStatusColor(o.status)} /></td>
                <td className="py-2 text-xs text-gray-600 dark:text-gray-400">{o.releasedAt ? new Date(o.releasedAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No quarantine orders found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'batches', label: 'Lots & Batches' },
  { key: 'serials', label: 'Serial Numbers' },
  { key: 'picks', label: 'Pick Suggestions' },
  { key: 'expiry', label: 'Expiry Alerts' },
  { key: 'quarantine', label: 'Quarantine' },
];

export default function LotSerialPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lot & Serial Tracking</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Batch/lot management, serial numbers, FEFO/FIFO picking, expiry alerts, and quarantine</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'batches' && <BatchesTab />}
      {tab === 'serials' && <SerialsTab />}
      {tab === 'picks' && <PickSuggestionsTab />}
      {tab === 'expiry' && <ExpiryAlertsTab />}
      {tab === 'quarantine' && <QuarantineTab />}
    </div>
  );
}
