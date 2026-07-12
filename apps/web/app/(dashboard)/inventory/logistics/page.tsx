'use client';

import { useState, useEffect, useCallback } from 'react';

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

const API = '/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
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
  const [asns, setAsns] = useState<Asn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Asn[]>('/inventory/logistics/asns').then(setAsns).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {['ASN #', 'Vendor', 'Warehouse', 'Status', 'Expected Arrival', 'Carrier', 'Tracking'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {asns.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No ASNs found.</td></tr>
          )}
          {asns.map(a => (
            <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-medium text-blue-600">{a.asnNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{a.vendorId}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{a.warehouseId}</td>
              <td className="px-4 py-3">{statusBadge(a.status)}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {a.expectedArrival ? new Date(a.expectedArrival).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{a.carrierName ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{a.trackingNumber ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InboundTab() {
  const [shipments, setShipments] = useState<InboundShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<InboundShipment[]>('/inventory/logistics/inbound').then(setShipments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {['Shipment #', 'Warehouse', 'Status', 'Tracking #', 'Expected', 'Arrived'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {shipments.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No inbound shipments found.</td></tr>
          )}
          {shipments.map(s => (
            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-medium text-blue-600">{s.shipmentNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{s.warehouseId}</td>
              <td className="px-4 py-3">{statusBadge(s.status)}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{s.trackingNumber ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {s.expectedArrival ? new Date(s.expectedArrival).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {s.arrivedAt ? new Date(s.arrivedAt).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OutboundTab() {
  const [shipments, setShipments] = useState<OutboundShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<OutboundShipment[]>('/inventory/logistics/outbound').then(setShipments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {['Shipment #', 'Sales Order', 'Status', 'Tracking #', 'Ship Date', 'Est. Delivery'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {shipments.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No outbound shipments found.</td></tr>
          )}
          {shipments.map(s => (
            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-medium text-blue-600">{s.shipmentNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{s.salesOrderId ?? '—'}</td>
              <td className="px-4 py-3">{statusBadge(s.status)}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{s.trackingNumber ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {s.shipDate ? new Date(s.shipDate).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CarriersTab() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Carrier[]>('/inventory/logistics/carriers').then(setCarriers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {['Code', 'Name', 'Contact Email', 'Tracking URL', 'Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {carriers.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No carriers configured.</td></tr>
          )}
          {carriers.map(c => (
            <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{c.code}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{c.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{c.contactEmail ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-blue-600 truncate max-w-xs">{c.trackingUrl ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <div className="p-6 space-y-6">
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
  );
}
