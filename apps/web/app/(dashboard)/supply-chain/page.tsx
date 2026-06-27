'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, DashboardKPICard, DashboardChart, ViewSwitcher, type ViewMode } from '@unerp/ui';
import {
  Truck,
  AlertCircle,
  CheckCircle,
  X,
  Package,
  Clock
} from 'lucide-react';

interface ShipmentData {
  id: string;
  shipmentNumber: string;
  type: string;
  status: string;
  carrierName: string | null;
  trackingNumber: string | null;
  weight: number | null;
  estimatedDelivery: string | null;
}

export default function SupplyChainPage() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'tracking'>('shipments');
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('chart');

  // Form Modals
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Form State
  const [shipmentNumber, setShipmentNumber] = useState('');
  const [type, setType] = useState('OUTBOUND');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [weight, setWeight] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/supply-chain/shipments', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShipments(Array.isArray(data) ? data : (data?.data || []));
    } catch {
      setError('Could not load data. Please try again.');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        shipmentNumber,
        type,
        carrierName: carrierName || undefined,
        trackingNumber: trackingNumber || undefined,
        weight: weight || undefined
      };
      
      const res = await fetch('/api/v1/supply-chain/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error();
      
      setModalSuccess(true);
      setTimeout(() => {
        setIsShipmentModalOpen(false);
        resetForm();
        fetchData();
      }, 1500);
    } catch {
      setError('Action could not be completed. Please try again.');
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShipmentNumber('');
    setType('OUTBOUND');
    setCarrierName('');
    setTrackingNumber('');
    setWeight(0);
    setModalSuccess(false);
  };

  // Computations for stats
  const totalShipments = shipments.length;
  const inTransitCount = useMemo(() => shipments.filter(s => s.status === 'IN_TRANSIT').length, [shipments]);
  const pendingCount = useMemo(() => shipments.filter(s => s.status === 'PENDING' || s.status === 'DRAFT').length, [shipments]);
  const deliveredCount = useMemo(() => shipments.filter(s => s.status === 'DELIVERED').length, [shipments]);

  // Compute chart data
  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shipments]);

  const carrierDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      const name = s.carrierName || 'TBD';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shipments]);

  const typeDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shipments]);

  const filteredShipments = shipments.filter(s => s.shipmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) || (s.carrierName && s.carrierName.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Supply Chain & Logistics"
        description="Monitor inbound and outbound shipments, carrier tracking, and logistics routes."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Supply Chain' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button variant="primary" onClick={() => setIsShipmentModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              New Shipment
            </Button>
          </div>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* KPI Stats with Drill-Down */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <DashboardKPICard
          title="Total Shipments"
          value={String(totalShipments)}
          icon={<Package size={18} />}
          color="var(--color-primary)"
          loading={loading}
          drillDown={{
            modalTitle: 'All Shipments',
            columns: [
              { key: 'shipmentNumber', label: 'Shipment No.' },
              { key: 'type', label: 'Type' },
              { key: 'carrierName', label: 'Carrier' },
              { key: 'status', label: 'Status' }
            ],
            rows: shipments.map(s => ({ ...s }))
          }}
        />
        <DashboardKPICard
          title="In Transit"
          value={String(inTransitCount)}
          icon={<Truck size={18} />}
          color="var(--color-warning)"
          loading={loading}
          drillDown={{
            modalTitle: 'Shipments In Transit',
            columns: [
              { key: 'shipmentNumber', label: 'Shipment No.' },
              { key: 'carrierName', label: 'Carrier' },
              { key: 'trackingNumber', label: 'Tracking' },
              { key: 'status', label: 'Status' }
            ],
            rows: shipments.filter(s => s.status === 'IN_TRANSIT').map(s => ({ ...s }))
          }}
        />
        <DashboardKPICard
          title="Pending Dispatch"
          value={String(pendingCount)}
          icon={<Clock size={18} />}
          color="var(--color-info-text)"
          loading={loading}
          drillDown={{
            modalTitle: 'Pending Shipments',
            columns: [
              { key: 'shipmentNumber', label: 'Shipment No.' },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status' }
            ],
            rows: shipments.filter(s => s.status === 'PENDING' || s.status === 'DRAFT').map(s => ({ ...s }))
          }}
        />
        <DashboardKPICard
          title="Delivered"
          value={String(deliveredCount)}
          icon={<CheckCircle size={18} />}
          color="var(--color-success)"
          loading={loading}
          drillDown={{
            modalTitle: 'Delivered Shipments',
            columns: [
              { key: 'shipmentNumber', label: 'Shipment No.' },
              { key: 'carrierName', label: 'Carrier' },
              { key: 'estimatedDelivery', label: 'Delivery Date' }
            ],
            rows: shipments.filter(s => s.status === 'DELIVERED').map(s => ({ ...s }))
          }}
        />
      </div>

      {/* Chart View */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart
            title="Shipment Status Distribution"
            subtitle="Breakdown of all active and past shipments"
            data={statusDistributionData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Shipments' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut"
            allowedChartTypes={['donut', 'pie', 'bar']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Carrier Utilization"
            subtitle="Number of shipments handled by carrier"
            data={carrierDistributionData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Shipments', color: '#3b82f6' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'donut', 'pie']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Shipment Types Share"
            subtitle="Inbound vs Outbound vs Transfers"
            data={typeDistributionData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Shipments' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="pie"
            allowedChartTypes={['pie', 'donut', 'bar']}
            height={280}
            loading={loading}
          />
        </div>
      )}

      {/* Standard List/Tracking Views */}
      {activeView === 'list' && (
        <>
          {/* Tabs Menu Panel */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)' }}>
            <button
              onClick={() => { setActiveTab('shipments'); setSearchQuery(''); }}
              style={{
                padding: 'var(--space-3) var(--space-5)', background: 'none', border: 'none',
                borderBottom: activeTab === 'shipments' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'shipments' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'shipments' ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 0.15s ease'
              }}
            >
              All Shipments ({shipments.length})
            </button>
            <button
              onClick={() => { setActiveTab('tracking'); setSearchQuery(''); }}
              style={{
                padding: 'var(--space-3) var(--space-5)', background: 'none', border: 'none',
                borderBottom: activeTab === 'tracking' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'tracking' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'tracking' ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 0.15s ease'
              }}
            >
              Active Tracking
            </button>
          </div>

          <Card padding="none" style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <Spinner size="lg" />
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Shipment Number</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Type</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Carrier</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Tracking</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.filter(s => activeTab === 'shipments' || s.status === 'IN_TRANSIT').map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)' }}>{s.shipmentNumber}</td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{s.type}</td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{s.carrierName || 'TBD'}</td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{s.trackingNumber || '-'}</td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <Badge variant={s.status === 'DELIVERED' ? 'success' : s.status === 'IN_TRANSIT' ? 'warning' : 'default'}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {/* Shipment Modal */}
      {isShipmentModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0 }}>Create Shipment</h3>
              <button onClick={() => setIsShipmentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateShipment} style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle size={40} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-3)' }} />
                  <p>Shipment Scheduled successfully.</p>
                </div>
              ) : (
                <>
                  <input type="text" placeholder="Shipment Number (e.g., SHP-001)" value={shipmentNumber} onChange={e => setShipmentNumber(e.target.value)} required style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} className="frappe-input" />
                  <select value={type} onChange={e => setType(e.target.value)} required style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} className="frappe-input">
                    <option value="OUTBOUND">Outbound</option>
                    <option value="INBOUND">Inbound</option>
                    <option value="TRANSFER">Warehouse Transfer</option>
                  </select>
                  <input type="text" placeholder="Carrier Name (e.g., FedEx)" value={carrierName} onChange={e => setCarrierName(e.target.value)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} className="frappe-input" />
                  <input type="text" placeholder="Tracking Number" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} className="frappe-input" />
                  <input type="number" placeholder="Weight (kg)" value={weight} onChange={e => setWeight(Number(e.target.value))} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} className="frappe-input" />
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <Button variant="outline" type="button" onClick={() => setIsShipmentModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : 'Create Shipment'}</Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
