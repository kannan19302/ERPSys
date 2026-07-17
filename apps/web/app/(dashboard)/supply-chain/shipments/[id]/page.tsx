'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, KPICard,
  Modal, TextField, FormField, Select,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
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
  const client = useApiClient();
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
        setShipment(await client.get<Shipment>(`/supply-chain/shipments/${id}`));
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [id, client]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !shipment) return;
    setUpdating(true);
    try {
      const updated = await client.request<Shipment>(`/supply-chain/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      setShipment(updated);
      setUpdateOpen(false);
    } catch { /* handled */ }
    finally { setUpdating(false); }
  };

  if (loading) {
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  if (!shipment) {
    return (
      <RouteGuard permission="supply-chain.shipments.read">
      <div className={styles.s1}>
        <Package size={64} className="ui-text-tertiary" />
        <h2 className={styles.s2}>Shipment Not Found</h2>
        <p className="ui-text-sm-muted">The shipment you're looking for doesn't exist or has been removed.</p>
        <Link href="/supply-chain/shipments">
          <Button variant="secondary"><ArrowLeft size={14} className="mr-2" /> Back to Shipments</Button>
        </Link>
      </div>
      </RouteGuard>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(shipment.status);
  const formatAddress = (addr: Record<string, string> | null) => {
    if (!addr) return 'Not specified';
    return [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ') || JSON.stringify(addr);
  };

  return (
    <RouteGuard permission="supply-chain.shipments.read">
    <div className="ui-stack-6">
      <PageHeader
        title={shipment.shipmentNumber}
        description={`${shipment.type} shipment via ${shipment.carrierName || 'Unassigned carrier'}`}
        breadcrumbs={[
          { label: 'Supply Chain', href: '/supply-chain' },
          { label: 'Shipments', href: '/supply-chain/shipments' },
          { label: shipment.shipmentNumber },
        ]}
        actions={
          <div className="ui-flex ui-gap-2">
            <Button variant="secondary" onClick={() => { setNewStatus(shipment.status); setUpdateOpen(true); }}>
              <Edit2 size={14} className="mr-2" /> Update Status
            </Button>
          </div>
        }
      />

      {/* KPI Summary */}
      <div className="ui-grid-auto-sm">
        <KPICard title="Status" value={shipment.status.replace(/_/g, ' ')} icon={<CheckCircle size={18} />} color={getStatusColor(shipment.status)} />
        <KPICard title="Shipping Cost" value={fmtCurrency(shipment.shippingCost)} icon={<DollarSign size={18} />} color="var(--color-primary)" />
        <KPICard title="Weight" value={shipment.weight ? `${shipment.weight} ${shipment.weightUnit || 'kg'}` : '—'} icon={<Package size={18} />} color="var(--color-info)" />
        <KPICard title="Est. Delivery" value={fmtDate(shipment.estimatedDelivery)} icon={<Calendar size={18} />} color="var(--color-warning)" />
      </div>

      {/* Status Timeline */}
      <Card>
        <div className="p-5">
          <h3 className={styles.s3}>
            <History size={16} className={styles.s4} /> Shipment Progress
          </h3>
          <div className={styles.s5}>
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <React.Fragment key={step}>
                  <div className={styles.s6}>
                    <div style={{ background: isCurrent ? 'var(--color-primary)' : isActive ? 'var(--color-success)' : 'var(--color-bg-sunken)', color: isActive ? 'white' : 'var(--color-text-tertiary)', border: isCurrent ? '3px solid var(--color-primary-light)' : 'none' }} className={styles.s7}>
                      {isActive ? <CheckCircle size={16} /> : idx + 1}
                    </div>
                    <span style={{ fontWeight: isCurrent ? 'var(--weight-bold)' : 'var(--weight-medium)', color: isActive ? 'var(--color-text)' : 'var(--color-text-tertiary)' }} className={styles.s8}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div style={{ background: idx < currentStep ? 'var(--color-success)' : 'var(--color-bg-sunken)' }} className={styles.s9} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="ui-grid-2">
        {/* Shipment Info */}
        <Card>
          <div className="p-5">
            <h3 className={styles.s10}>
              <FileText size={16} className={styles.s4} /> Shipment Details
            </h3>
            <div className="ui-stack-3">
              {[
                ['Shipment Number', shipment.shipmentNumber],
                ['Type', shipment.type],
                ['Carrier', shipment.carrierName || '—'],
                ['Tracking Number', shipment.trackingNumber || '—'],
                ['Currency', shipment.currency || 'USD'],
                ['Created', fmtDate(shipment.createdAt)],
              ].map(([label, value]) => (
                <div key={label as string} className={styles.s11}>
                  <span className="ui-text-sm-muted">{label}</span>
                  <span className={styles.s12}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Address Info */}
        <Card>
          <div className="p-5">
            <h3 className={styles.s10}>
              <MapPin size={16} className={styles.s4} /> Addresses
            </h3>
            <div className="ui-stack-4">
              <div>
                <div style={{ textTransform: 'uppercase' as const }} className={styles.s13}>Origin</div>
                <div className={styles.s14}>
                  {formatAddress(shipment.originAddress)}
                </div>
              </div>
              <div className={styles.s15}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ textTransform: 'uppercase' as const }} className={styles.s13}>Destination</div>
                <div className={styles.s14}>
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
          <div className="p-5">
            <h3 className={styles.s16}>Notes</h3>
            <p className={styles.s17}>{shipment.notes}</p>
          </div>
        </Card>
      )}

      {/* Delivery Info */}
      <div className="ui-grid-2">
        <Card>
          <div className="p-5 ui-hstack-4">
            <div className={styles.s18}>
              <Clock size={24} />
            </div>
            <div>
              <div className={styles.s19}>Estimated Delivery</div>
              <div className={styles.s20}>{fmtDate(shipment.estimatedDelivery)}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5 ui-hstack-4">
            <div style={{ background: shipment.actualDelivery ? 'var(--color-success-light)' : 'var(--color-bg-sunken)', color: shipment.actualDelivery ? 'var(--color-success)' : 'var(--color-text-tertiary)' }} className={styles.s21}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div className={styles.s19}>Actual Delivery</div>
              <div className={styles.s20}>{fmtDate(shipment.actualDelivery)}</div>
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
        <div className="ui-stack-4">
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
    </RouteGuard>
  );
}
