'use client';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(<T,>(path: string) => client.get<T>(path), [client]);
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
  const apiFetch = useFrameworkFetch();
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
  const apiFetch = useFrameworkFetch();
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
      <ListPageTemplate
        columns={[
          { key: 'batchNo', header: 'Batch No', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
          { key: 'productId', header: 'Product' },
          { key: 'quantity', header: 'Qty' },
          { key: 'expiryDate', header: 'Expiry Date', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
          { key: 'manufactureDate', header: 'Mfg Date', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
          { key: 'status', header: 'Status', render: (v) => <Badge label={String(v)} color={batchStatusColor(String(v))} /> },
        ] as ListColumn[]}
        data={batches as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No batches found"
        emptyDescription="No batches match the current filter."
      />
    </div>
  );
}

// ── Serials Tab ────────────────────────────────────────────────────────────
function SerialsTab() {
  const apiFetch = useFrameworkFetch();
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
      <ListPageTemplate
        columns={[
          { key: 'serialNo', header: 'Serial No', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
          { key: 'productId', header: 'Product' },
          { key: 'warehouseId', header: 'Warehouse', render: (v) => String(v ?? '—') },
          { key: 'warrantyExpiry', header: 'Warranty Expiry', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
          { key: 'status', header: 'Status', render: (v) => <Badge label={String(v)} color={serialStatusColor(String(v))} /> },
        ] as ListColumn[]}
        data={serials as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No serial numbers found"
        emptyDescription="No serial numbers match the current filter."
      />
    </div>
  );
}

// ── Pick Suggestions Tab ───────────────────────────────────────────────────
function PickSuggestionsTab() {
  const apiFetch = useFrameworkFetch();
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
      <ListPageTemplate
        columns={[
          { key: 'productId', header: 'Product' },
          { key: 'strategy', header: 'Strategy', render: (v) => <Badge label={String(v)} color="blue" /> },
          { key: 'batchId', header: 'Batch', render: (v) => <span className="font-mono text-xs">{String(v ?? '—')}</span> },
          { key: 'suggestedQty', header: 'Suggested Qty' },
          { key: 'pickedQty', header: 'Picked Qty' },
          { key: 'status', header: 'Status', render: (v) => <Badge label={String(v)} color={pickStatusColor(String(v))} /> },
        ] as ListColumn[]}
        data={picks as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No pick suggestions found"
        emptyDescription="No pick suggestions match the current filter."
      />
    </div>
  );
}

// ── Expiry Alerts Tab ──────────────────────────────────────────────────────
function ExpiryAlertsTab() {
  const apiFetch = useFrameworkFetch();
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
      <ListPageTemplate
        columns={[
          { key: 'productId', header: 'Product' },
          { key: 'batchId', header: 'Batch', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
          { key: 'expiryDate', header: 'Expiry Date', render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: 'daysUntilExpiry', header: 'Days Until', render: (v) => Number(v) <= 0 ? 'Expired' : `${v}d` },
          { key: 'qty', header: 'Qty' },
          { key: 'severity', header: 'Severity', render: (v) => <Badge label={String(v)} color={severityColor(String(v))} /> },
        ] as ListColumn[]}
        data={alerts as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No alerts found"
        emptyDescription="No expiry alerts match the current filter."
      />
    </div>
  );
}

// ── Quarantine Tab ─────────────────────────────────────────────────────────
function QuarantineTab() {
  const apiFetch = useFrameworkFetch();
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
      <ListPageTemplate
        columns={[
          { key: 'orderNumber', header: 'Order #', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
          { key: 'productId', header: 'Product' },
          { key: 'qty', header: 'Qty' },
          { key: 'reason', header: 'Reason' },
          { key: 'status', header: 'Status', render: (v) => <Badge label={String(v)} color={quarantineStatusColor(String(v))} /> },
          { key: 'releasedAt', header: 'Released At', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
        ] as ListColumn[]}
        data={orders as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No quarantine orders found"
        emptyDescription="No quarantine orders match the current filter."
      />
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
    <RouteGuard permission="inventory.lot-serial.read">
    <div className="ui-page-shell">
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
    </RouteGuard>
  );
}
