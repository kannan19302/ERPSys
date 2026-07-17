'use client';
import styles from './supply-chain.module.css';
import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard, DashboardChart, ViewSwitcher, type ViewMode,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
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

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function SupplyChainDashboard() {
  const client = useApiClient();
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
      const data = await client.get<Shipment[] | { data?: Shipment[] }>('/supply-chain/shipments');
      setShipments(Array.isArray(data) ? data : data.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shipmentNumber) return;
    setCreating(true);
    try {
      await client.post('/supply-chain/shipments', { ...form, weight: Number(form.weight) });
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
        <div className="ui-hstack-3">
          <div className={styles.iconWell}>
            <Truck size={16} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.shipmentNumber}</div>
            <div className="ui-text-xs-tertiary">{row.carrierName || 'No carrier'}</div>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <Badge variant={row.type === 'OUTBOUND' ? 'info' : row.type === 'INBOUND' ? 'success' : 'warning'}>{row.type}</Badge> },
    { key: 'trackingNumber', header: 'Tracking #', render: (row) => row.trackingNumber ? <code className={styles.trackingCode}>{row.trackingNumber}</code> : <span className="ui-text-xs-tertiary">—</span> },
    { key: 'weight', header: 'Weight', render: (row) => <span className="ui-text-sm-muted">{row.weight ? `${row.weight} kg` : '—'}</span> },
    { key: 'estimatedDelivery', header: 'ETA', render: (row) => <span className="ui-text-xs-muted">{row.estimatedDelivery ? new Date(row.estimatedDelivery).toLocaleDateString() : '—'}</span> },
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
    <RouteGuard permission="supply-chain.read">
    <div className="ui-stack-6">
      <PageHeader title="Supply Chain Operations" description="Manage shipments, carriers, logistics, and demand planning"
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Supply Chain' }]}
        actions={
          <div className="ui-flex ui-gap-2">
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Shipment</Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="ui-grid-auto">
        <KPICard title="Total Shipments" value={shipments.length} icon={<Package size={18} />} color="var(--color-primary)" />
        <KPICard title="In Transit" value={inTransit} icon={<Truck size={18} />} color="var(--color-warning)" />
        <KPICard title="Delivered" value={delivered} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        <KPICard title="Shipping Cost" value={fmtCurrency(totalCost)} icon={<DollarSign size={18} />} color="var(--color-info)" />
      </div>

      {/* Charts */}
      {activeView === 'chart' && (
        <div className={styles.chartGrid}>
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
            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input type="text" placeholder="Search shipments..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput} />
              </div>
              <div className="ui-flex ui-gap-2">
                {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? styles.filterButtonActive : styles.filterButton}>
                    {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                  </button>
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
        <h3 className={styles.sectionHeading}>Operations</h3>
        <div className={styles.quickLinksGrid}>
          {quickLinks.map(link => (
            <Link href={link.href} key={link.title} className={styles.quickLinkAnchor}>
              <div className={styles.quickLinkCard}>
                <div className={styles.iconWell}>
                  <link.icon size={16} />
                </div>
                <div className="ui-flex-1">
                  <div className="ui-heading-sm">{link.title}</div>
                  <div className="ui-text-xs-tertiary">{link.desc}</div>
                </div>
                <ArrowRight size={14} className="ui-text-tertiary" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Create Shipment Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Shipment" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create Shipment'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Shipment Number" required placeholder="SHP-2026-001" value={form.shipmentNumber} onChange={e => setForm({ ...form, shipmentNumber: e.target.value })} />
            <FormField label="Type" required><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="OUTBOUND">Outbound</option><option value="INBOUND">Inbound</option><option value="TRANSFER">Transfer</option>
            </Select></FormField>
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Carrier Name" placeholder="FedEx" value={form.carrierName} onChange={e => setForm({ ...form, carrierName: e.target.value })} />
            <TextField label="Tracking Number" placeholder="1Z999..." value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} />
          </div>
          <TextField label="Weight (kg)" type="number" min={0} step={0.1} value={form.weight || ''} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })} />
        </form>
      </Modal>
    </div>
    </RouteGuard>
  );
}
