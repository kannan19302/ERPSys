'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard, DashboardChart, ViewSwitcher, type ViewMode,
} from '@unerp/ui';
import {
  Truck, Plus, Search, Package, Clock, CheckCircle, AlertTriangle,
  MapPin, BarChart3, TrendingUp, ArrowRight, DollarSign,
} from 'lucide-react';
import Link from 'next/link';

interface Shipment {
  id: string;
  shipmentNumber: string;
  type: string;
  status: string;
  carrierName: string | null;
  trackingNumber: string | null;
  weight: number | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  shippingCost: number;
  originAddress: any;
  destAddress: any;
  createdAt?: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function SupplyChainDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeView, setActiveView] = useState<ViewMode>('chart');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    shipmentNumber: '', type: 'OUTBOUND', carrierName: '', trackingNumber: '', weight: 0,
  });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/supply-chain/shipments', {
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShipments(Array.isArray(data) ? data : data?.data || []);
      }
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shipmentNumber) return;
    setCreating(true);
    try {
      await fetch('/api/v1/supply-chain/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ ...form, weight: Number(form.weight) }),
      });
      setCreateOpen(false);
      setForm({ shipmentNumber: '', type: 'OUTBOUND', carrierName: '', trackingNumber: '', weight: 0 });
      fetchData();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const filtered = shipments.filter(s => {
    const matchesSearch = !search || s.shipmentNumber.toLowerCase().includes(search.toLowerCase()) || (s.carrierName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCost = shipments.reduce((a, s) => a + Number(s.shippingCost || 0), 0);
  const inTransit = shipments.filter(s => s.status === 'IN_TRANSIT').length;
  const delivered = shipments.filter(s => s.status === 'DELIVERED').length;

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [shipments]);

  const typeChart = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shipments]);

  const columns: Column<Shipment>[] = [
    {
      key: 'shipment', header: 'Shipment',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.shipmentNumber}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.carrierName || 'No carrier'}</div>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <Badge variant={row.type === 'OUTBOUND' ? 'info' : row.type === 'INBOUND' ? 'success' : 'warning'}>{row.type}</Badge> },
    { key: 'trackingNumber', header: 'Tracking #', render: (row) => <code style={{ fontSize: '11px' }}>{row.trackingNumber || '—'}</code> },
    { key: 'weight', header: 'Weight', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.weight ? `${row.weight} kg` : '—'}</span> },
    { key: 'estimatedDelivery', header: 'ETA', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{row.estimatedDelivery ? new Date(row.estimatedDelivery).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const quickLinks = [
    { title: 'Shipments', href: '/supply-chain/shipments', icon: Package, desc: 'All shipments' },
    { title: 'Live Tracking', href: '/supply-chain/tracking', icon: MapPin, desc: 'Real-time tracking' },
    { title: 'Carriers', href: '/supply-chain/carriers', icon: Truck, desc: 'Carrier management' },
    { title: 'Demand Forecast', href: '/supply-chain/demand-forecast', icon: TrendingUp, desc: 'Demand planning' },
    { title: 'Route Optimization', href: '/supply-chain/routes', icon: MapPin, desc: 'Optimize routes' },
    { title: 'Analytics', href: '/supply-chain/analytics', icon: BarChart3, desc: 'Performance metrics' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Supply Chain Operations" description="Manage shipments, carriers, logistics, and demand planning"
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Supply Chain' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Shipment</Button>
          </div>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Shipments" value={shipments.length} icon={<Package size={18} />} color="var(--color-primary)" />
        <KPICard title="In Transit" value={inTransit} icon={<Truck size={18} />} color="var(--color-warning)" />
        <KPICard title="Delivered" value={delivered} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        <KPICard title="Shipping Cost" value={fmtCurrency(totalCost)} icon={<DollarSign size={18} />} color="var(--color-info)" />
      </div>

      {/* Charts */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart title="Shipment Status" data={statusChart}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Count' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut" allowedChartTypes={['donut', 'pie', 'bar']} height={280} loading={loading} />
          <DashboardChart title="By Type" data={typeChart}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Count' }] }}
            defaultChartType="bar" allowedChartTypes={['bar', 'pie']} height={280} loading={loading} />
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
        <>
          <Card>
            <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                <input type="text" placeholder="Search shipments..." value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                    border: '1px solid', borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)',
                    background: statusFilter === s ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}>{s === 'ALL' ? 'All' : s.replace('_', ' ')}</button>
                ))}
              </div>
            </div>
          </Card>
          <Card padding="none">
            <DataTable columns={columns} data={filtered} loading={loading} rowKey={r => r.id}
              emptyTitle="No shipments" emptyMessage="Create your first shipment to start tracking." emptyIcon={<Truck size={48} />} />
          </Card>
        </>
      )}

      {/* Quick Links */}
      <div>
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Operations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {quickLinks.map(link => (
            <Link href={link.href} key={link.title} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <link.icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{link.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{link.desc}</div>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Create Shipment Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Shipment" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create Shipment'}</Button></>}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Shipment Number" required placeholder="SHP-2026-001" value={form.shipmentNumber} onChange={e => setForm({ ...form, shipmentNumber: e.target.value })} />
            <FormField label="Type" required><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="OUTBOUND">Outbound</option><option value="INBOUND">Inbound</option><option value="TRANSFER">Transfer</option>
            </Select></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Carrier Name" placeholder="FedEx" value={form.carrierName} onChange={e => setForm({ ...form, carrierName: e.target.value })} />
            <TextField label="Tracking Number" placeholder="1Z999..." value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} />
          </div>
          <TextField label="Weight (kg)" type="number" min={0} step={0.1} value={form.weight || ''} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })} />
        </form>
      </Modal>
    </div>
  );
}
