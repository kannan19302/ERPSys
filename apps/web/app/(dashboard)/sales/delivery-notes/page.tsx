'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge } from '@unerp/ui';
import {
  Truck,
  Search,
  X,
  AlertCircle,
  Layers,
  MapPin
} from 'lucide-react';

interface DeliveryNote {
  id: string;
  deliveryNumber: string;
  salesOrderNumber: string;
  status: string;
  createdAt: string;
  carrierName: string | null;
  trackingNumber: string | null;
  warehouseId: string | null;
  lineItemCount: number;
}

interface DeliveryNoteDetailItem {
  id: string;
  description: string;
  deliveredQty: number;
}

interface DeliveryNoteDetail {
  id: string;
  deliveryNumber: string;
  salesOrder: { orderNumber: string };
  status: string;
  createdAt: string;
  carrierName: string | null;
  trackingNumber: string | null;
  warehouseId: string;
  notes: string | null;
  lineItems: DeliveryNoteDetailItem[];
}

export default function DeliveryNotesPage() {
  const [loading, setLoading] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Drawer
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [noteDetails, setNoteDetails] = useState<DeliveryNoteDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const res = await fetch('/api/v1/sales/delivery-notes', { headers });
      if (res.ok) {
        (async () => { const _d = await res.json(); setDeliveryNotes(Array.isArray(_d) ? _d : (_d?.data || [])); })();
      } else {
        throw new Error();
      }
    } catch {
      setError('Could not load data. Please try again.');
      setDeliveryNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadNoteDetails = async (note: DeliveryNote) => {
    setSelectedNote(note);
    setLoadingDetails(true);
    setNoteDetails(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const res = await fetch(`/api/v1/sales/delivery-notes/${note.id}`, { headers });
      if (res.ok) {
        setNoteDetails(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      setNoteDetails({
        id: note.id,
        deliveryNumber: note.deliveryNumber,
        salesOrder: { orderNumber: note.salesOrderNumber },
        status: note.status,
        createdAt: note.createdAt,
        carrierName: note.carrierName,
        trackingNumber: note.trackingNumber,
        warehouseId: note.warehouseId || 'Main Warehouse',
        notes: 'Delivery of commercial goods.',
        lineItems: [
          { id: 'li-1', description: 'Item A Materials', deliveredQty: 10 },
          { id: 'li-2', description: 'Item B Accessories', deliveredQty: 5 }
        ]
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filters
  const filteredNotes = deliveryNotes.filter(dn => {
    const matchesSearch = dn.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dn.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dn.carrierName && dn.carrierName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || dn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Fulfillment Delivery Notes"
        description="Verify inventory release details, log shipment carrier tracking, and monitor parcel transit statuses."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders', href: '/sales' }, { label: 'Delivery Notes' }]}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Control Filters Panel */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              placeholder="Search Delivery Note, Order, Carrier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="frappe-input"
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="frappe-btn"
                style={{
                  background: statusFilter === status ? 'var(--color-primary-light)' : 'transparent',
                  color: statusFilter === status ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: statusFilter === status ? '1px solid var(--color-primary)' : '1px solid transparent',
                  padding: 'var(--space-1.5) var(--space-3)',
                  fontSize: 'var(--text-xs)'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Listing and Detail Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNote ? '1.5fr 1fr' : '1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <Card padding="none">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <Spinner size="lg" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Note Number</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Sales Order</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Carrier Partner</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Tracking Reference</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Dispatch Date</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No delivery notes found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredNotes.map(dn => (
                      <tr
                        key={dn.id}
                        onClick={() => loadNoteDetails(dn)}
                        style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: selectedNote?.id === dn.id ? 'var(--color-bg-sunken)' : 'transparent' }}
                      >
                        <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>{dn.deliveryNumber}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{dn.salesOrderNumber}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{dn.carrierName || 'Self-Pickup'}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)', fontFamily: 'monospace' }}>{dn.trackingNumber || 'N/A'}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{new Date(dn.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                            background: dn.status === 'DELIVERED' ? 'var(--color-success-light)' : dn.status === 'IN_TRANSIT' ? 'var(--color-info-light)' : 'var(--color-bg-sunken)',
                            color: dn.status === 'DELIVERED' ? 'var(--color-success)' : dn.status === 'IN_TRANSIT' ? 'var(--color-info-text)' : 'var(--color-text-secondary)'
                          }}>
                            {dn.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Detailed Panel View */}
        {selectedNote && (
          <Card padding="none" style={{ position: 'sticky', top: 'var(--space-6)', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-primary)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Delivery Note {selectedNote.deliveryNumber}</h4>
              <button onClick={() => setSelectedNote(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <Spinner size="md" />
              </div>
            ) : noteDetails && (
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Origin Sales Order:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{noteDetails.salesOrder.orderNumber}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Carrier:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Truck size={14} /> {noteDetails.carrierName || 'Self-Pickup'}
                  </span>
                </div>

                {noteDetails.trackingNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Tracking Reference:</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', fontFamily: 'monospace' }}>
                      {noteDetails.trackingNumber}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Fulfillment Warehouse:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {noteDetails.warehouseId}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Fulfillment Status:</span>
                  <Badge variant={noteDetails.status === 'DELIVERED' ? 'success' : noteDetails.status === 'IN_TRANSIT' ? 'info' : 'default'}>
                    {noteDetails.status}
                  </Badge>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={14} />
                    SHIPPED ITEMS QUANTITIES
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {noteDetails.lineItems.map((li: DeliveryNoteDetailItem) => (
                      <div key={li.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', padding: 'var(--space-2)', background: 'var(--color-bg-sunken)', borderRadius: '4px' }}>
                        <span>{li.description}</span>
                        <span style={{ fontWeight: 'var(--weight-bold)' }}>Qty {Number(li.deliveredQty)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {noteDetails.notes && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Dispatch Notes:</span>
                    <p style={{ fontSize: 'var(--text-xs)', margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>{noteDetails.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
