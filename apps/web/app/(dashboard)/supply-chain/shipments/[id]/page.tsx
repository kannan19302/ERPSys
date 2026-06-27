'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, KPICard,
  Modal, TextField, FormField, Select,
} from '@unerp/ui';
import {
  Package, Truck, MapPin, Calendar, Clock, DollarSign, ArrowLeft,
  FileText, CheckCircle, AlertTriangle, Edit2, History,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Shipment {
  id: string;
  shipmentNumber: string;
  type: string;
  status: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  weight: number | null;
  weightUnit: string;
  shippingCost: number;
  currency: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  originAddress: Record<string, string> | null;
  destAddress: Record<string, string> | null;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const STATUS_STEPS = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function getStatusColor(status: string): string {
  switch (status) {
    case 'DELIVERED': return 'var(--color-success)';
    case 'IN_TRANSIT': return 'var(--color-primary)';
    case 'OUT_FOR_DELIVERY': return 'var(--color-warning)';
    case 'CANCELLED': return 'var(--color-danger)';
    default: return 'var(--color-text-tertiary)';
  }
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/v1/supply-chain/shipments/${id}`, {
          headers: { Authorization: `Bearer ${getToken() || ''}` },
        });
        if (res.ok) {
          setShipment(await res.json());
        }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !shipment) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/supply-chain/shipments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setShipment(updated);
        setUpdateOpen(false);
      }
    } catch { /* handled */ }
    finally { setUpdating(false); }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  if (!shipment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)' }}>
        <Package size={64} style={{ color: 'var(--color-text-tertiary)' }} />
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>Shipment Not Found</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>The shipment you're looking for doesn't exist or has been removed.</p>
        <Link href="/supply-chain/shipments">
          <Button variant="secondary"><ArrowLeft size={14} style={{ marginRight: 6 }} /> Back to Shipments</Button>
        </Link>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(shipment.status);
  const formatAddress = (addr: Record<string, string> | null) => {
    if (!addr) return 'Not specified';
    return [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ') || JSON.stringify(addr);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title={shipment.shipmentNumber}
        description={`${shipment.type} shipment via ${shipment.carrierName || 'Unassigned carrier'}`}
        breadcrumbs={[
          { label: 'Supply Chain', href: '/supply-chain' },
          { label: 'Shipments', href: '/supply-chain/shipments' },
          { label: shipment.shipmentNumber },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => { setNewStatus(shipment.status); setUpdateOpen(true); }}>
              <Edit2 size={14} style={{ marginRight: 6 }} /> Update Status
            </Button>
          </div>
        }
      />

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Status" value={shipment.status.replace(/_/g, ' ')} icon={<CheckCircle size={18} />} color={getStatusColor(shipment.status)} />
        <KPICard title="Shipping Cost" value={fmtCurrency(shipment.shippingCost)} icon={<DollarSign size={18} />} color="var(--color-primary)" />
        <KPICard title="Weight" value={shipment.weight ? `${shipment.weight} ${shipment.weightUnit || 'kg'}` : '—'} icon={<Package size={18} />} color="var(--color-info)" />
        <KPICard title="Est. Delivery" value={fmtDate(shipment.estimatedDelivery)} icon={<Calendar size={18} />} color="var(--color-warning)" />
      </div>

      {/* Status Timeline */}
      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-5)', color: 'var(--color-text)' }}>
            <History size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Shipment Progress
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 var(--space-2)' }}>
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <React.Fragment key={step}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', flex: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isCurrent ? 'var(--color-primary)' : isActive ? 'var(--color-success)' : 'var(--color-bg-sunken)',
                      color: isActive ? 'white' : 'var(--color-text-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
                      border: isCurrent ? '3px solid var(--color-primary-light)' : 'none',
                      transition: 'all 0.3s ease',
                    }}>
                      {isActive ? <CheckCircle size={16} /> : idx + 1}
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: isCurrent ? 'var(--weight-bold)' : 'var(--weight-medium)',
                      color: isActive ? 'var(--color-text)' : 'var(--color-text-tertiary)',
                      whiteSpace: 'nowrap',
                    }}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div style={{
                      flex: 1, height: 3, marginBottom: 20,
                      background: idx < currentStep ? 'var(--color-success)' : 'var(--color-bg-sunken)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'background 0.3s ease',
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Shipment Info */}
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
              <FileText size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Shipment Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                ['Shipment Number', shipment.shipmentNumber],
                ['Type', shipment.type],
                ['Carrier', shipment.carrierName || '—'],
                ['Tracking Number', shipment.trackingNumber || '—'],
                ['Currency', shipment.currency || 'USD'],
                ['Created', fmtDate(shipment.createdAt)],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Address Info */}
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
              <MapPin size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Addresses
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Origin</div>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                  {formatAddress(shipment.originAddress)}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Destination</div>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                  {formatAddress(shipment.destAddress)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Notes */}
      {shipment.notes && (
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)', color: 'var(--color-text)' }}>Notes</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{shipment.notes}</p>
          </div>
        </Card>
      )}

      {/* Delivery Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--color-warning-light)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 'var(--weight-medium)' }}>Estimated Delivery</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{fmtDate(shipment.estimatedDelivery)}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: shipment.actualDelivery ? 'var(--color-success-light)' : 'var(--color-bg-sunken)', color: shipment.actualDelivery ? 'var(--color-success)' : 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 'var(--weight-medium)' }}>Actual Delivery</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{fmtDate(shipment.actualDelivery)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Update Status Modal */}
      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} title="Update Shipment Status" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleStatusUpdate} disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="New Status">
            <Select value={newStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewStatus(e.target.value)}>
              <option value="PENDING">Pending</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
