'use client';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

type Tab = 'dashboard' | 'asns' | 'inbound' | 'outbound' | 'carriers';

interface DashboardData {
  totalCarriers: number;
  activeCarriers: number;
  pendingAsns: number;
  inTransitAsns: number;
  expectedInbound: number;
  inTransitInbound: number;
  pendingOutbound: number;
  shippedOutbound: number;
  shipmentExceptions: number;
  recentActivity: { id: string; type: string; number: string; status: string; updatedAt: string }[];
}

interface Carrier {
  id: string;
  code: string;
  name: string;
  trackingUrl?: string;
  contactEmail?: string;
  isActive: boolean;
}

interface Asn {
  id: string;
  asnNumber: string;
  vendorId: string;
  warehouseId: string;
  status: string;
  expectedArrival?: string;
  carrierName?: string;
  trackingNumber?: string;
}

interface InboundShipment {
  id: string;
  shipmentNumber: string;
  warehouseId: string;
  status: string;
  trackingNumber?: string;
  expectedArrival?: string;
  arrivedAt?: string;
}

interface OutboundShipment {
  id: string;
  shipmentNumber: string;
  salesOrderId?: string;
  status: string;
  trackingNumber?: string;
  shipDate?: string;
  estimatedDelivery?: string;
}

function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(<T,>(path: string) => client.get<T>(path), [client]);
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_TRANSIT: 'bg-blue-100 text-blue-800',
    ARRIVED: 'bg-purple-100 text-purple-800',
    RECEIVED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    EXPECTED: 'bg-gray-100 text-gray-700',
    RECEIVING: 'bg-indigo-100 text-indigo-800',
    COMPLETE: 'bg-green-100 text-green-800',
    EXCEPTION: 'bg-red-100 text-red-800',
    PACKED: 'bg-teal-100 text-teal-800',
    SHIPPED: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-green-100 text-green-800',
    RETURNED: 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function DashboardTab() {
  const apiFetch = useFrameworkFetch();
  const [data, setData] = useState<DashboardData | null>(null);
  const [exceptions, setExceptions] = useState<OutboundShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<DashboardData>('/inventory/logistics/dashboard'),
      apiFetch<OutboundShipment[]>('/inventory/logistics/exceptions'),
    ]).then(([d, e]) => { setData(d); setExceptions(e); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;
  if (!data) return <p className="text-sm text-red-500 p-4">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Carriers" value={data.activeCarriers} sub={`${data.totalCarriers} total`} />
        <StatCard label="Pending ASNs" value={data.pendingAsns} sub={`${data.inTransitAsns} in transit`} />
        <StatCard label="Expected Inbound" value={data.expectedInbound} sub={`${data.inTransitInbound} in transit`} />
        <StatCard label="Shipment Exceptions" value={data.shipmentExceptions} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Pending Outbound" value={data.pendingOutbound} />
        <StatCard label="Shipped Outbound" value={data.shippedOutbound} />
      </div>
      {exceptions.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3">Shipment Exceptions ({exceptions.length})</h3>
          <div className="space-y-2">
            {exceptions.map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">{e.shipmentNumber}</span>
                {statusBadge(e.status)}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h3>
        {data.recentActivity?.length ? (
          <div className="space-y-2">
            {data.recentActivity.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">[{a.type}] {a.number}</span>
                {statusBadge(a.status)}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">No recent activity.</p>}
      </div>
    </div>
  );
}

function AsnsTab() {
  const apiFetch = useFrameworkFetch();
  const [asns, setAsns] = useState<Asn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Asn[]>('/inventory/logistics/asns').then(setAsns).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <ListPageTemplate
      columns={[
        { key: 'asnNumber', header: 'ASN #', render: (v) => <span className="text-blue-600 font-medium">{String(v)}</span> },
        { key: 'vendorId', header: 'Vendor' },
        { key: 'warehouseId', header: 'Warehouse' },
        { key: 'status', header: 'Status', render: (v) => statusBadge(String(v)) },
        { key: 'expectedArrival', header: 'Expected Arrival', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
        { key: 'carrierName', header: 'Carrier', render: (v) => String(v ?? '—') },
        { key: 'trackingNumber', header: 'Tracking', render: (v) => String(v ?? '—') },
      ] as ListColumn[]}
      data={asns as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No ASNs found"
      emptyDescription="No advance shipment notices found."
    />
  );
}

function InboundTab() {
  const apiFetch = useFrameworkFetch();
  const [shipments, setShipments] = useState<InboundShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<InboundShipment[]>('/inventory/logistics/inbound').then(setShipments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <ListPageTemplate
      columns={[
        { key: 'shipmentNumber', header: 'Shipment #', render: (v) => <span className="text-blue-600 font-medium">{String(v)}</span> },
        { key: 'warehouseId', header: 'Warehouse' },
        { key: 'status', header: 'Status', render: (v) => statusBadge(String(v)) },
        { key: 'trackingNumber', header: 'Tracking #', render: (v) => String(v ?? '—') },
        { key: 'expectedArrival', header: 'Expected', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
        { key: 'arrivedAt', header: 'Arrived', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
      ] as ListColumn[]}
      data={shipments as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No inbound shipments found"
      emptyDescription="No inbound shipments found."
    />
  );
}

function OutboundTab() {
  const apiFetch = useFrameworkFetch();
  const [shipments, setShipments] = useState<OutboundShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<OutboundShipment[]>('/inventory/logistics/outbound').then(setShipments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <ListPageTemplate
      columns={[
        { key: 'shipmentNumber', header: 'Shipment #', render: (v) => <span className="text-blue-600 font-medium">{String(v)}</span> },
        { key: 'salesOrderId', header: 'Sales Order', render: (v) => String(v ?? '—') },
        { key: 'status', header: 'Status', render: (v) => statusBadge(String(v)) },
        { key: 'trackingNumber', header: 'Tracking #', render: (v) => String(v ?? '—') },
        { key: 'shipDate', header: 'Ship Date', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
        { key: 'estimatedDelivery', header: 'Est. Delivery', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '—' },
      ] as ListColumn[]}
      data={shipments as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No outbound shipments found"
      emptyDescription="No outbound shipments found."
    />
  );
}

function CarriersTab() {
  const apiFetch = useFrameworkFetch();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Carrier[]>('/inventory/logistics/carriers').then(setCarriers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <ListPageTemplate
      columns={[
        { key: 'code', header: 'Code', render: (v) => <strong>{String(v)}</strong> },
        { key: 'name', header: 'Name' },
        { key: 'contactEmail', header: 'Contact Email', render: (v) => String(v ?? '—') },
        { key: 'trackingUrl', header: 'Tracking URL', render: (v) => String(v ?? '—') },
        { key: 'isActive', header: 'Status', render: (v) => <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{v ? 'Active' : 'Inactive'}</span> },
      ] as ListColumn[]}
      data={carriers as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No carriers configured"
      emptyDescription="No carriers have been configured."
    />
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'asns', label: 'ASNs' },
  { id: 'inbound', label: 'Inbound' },
  { id: 'outbound', label: 'Outbound' },
  { id: 'carriers', label: 'Carriers' },
];

export default function LogisticsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <RouteGuard permission="inventory.logistics.read">
    <div className="ui-page-shell">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logistics & Shipping</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage ASNs, inbound/outbound shipments, and carriers</p>
      </div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'asns' && <AsnsTab />}
        {tab === 'inbound' && <InboundTab />}
        {tab === 'outbound' && <OutboundTab />}
        {tab === 'carriers' && <CarriersTab />}
      </div>
    </div>
    </RouteGuard>
  );
}
