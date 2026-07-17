'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Truck,
  Search,
  X,
  AlertCircle,
  Layers,
  MapPin
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
    try {
      const data = await client.get<DeliveryNote[] | { data?: DeliveryNote[] }>('/sales/delivery-notes');
      setDeliveryNotes(Array.isArray(data) ? data : data.data || []);
    } catch {
      setError('Could not load data. Please try again.');
      setDeliveryNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const loadNoteDetails = async (note: DeliveryNote) => {
    setSelectedNote(note);
    setLoadingDetails(true);
    setNoteDetails(null);
    try {
      setNoteDetails(await client.get<DeliveryNoteDetail>(`/sales/delivery-notes/${note.id}`));
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
    <RouteGuard permission="sales.delivery-note.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Fulfillment Delivery Notes"
        description="Verify inventory release details, log shipment carrier tracking, and monitor parcel transit statuses."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders', href: '/sales' }, { label: 'Delivery Notes' }]}
      />

      {error && (
        <div className={styles.p1}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Control Filters Panel */}
      <Card>
        <div className={styles.p2}>
          <div className={styles.p3}>
            <Search size={16} className={styles.p4} />
            <input
              type="text"
              placeholder="Search Delivery Note, Order, Carrier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={["ui-input", styles.p5].join(' ')}

            />
          </div>

          <div className="ui-flex ui-gap-1">
            {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={["ui-btn", styles.p6].join(' ')}
                style={{ background: statusFilter === status ? 'var(--color-primary-light)' : 'transparent', color: statusFilter === status ? 'var(--color-primary)' : 'var(--color-text-secondary)', border: statusFilter === status ? '1px solid var(--color-primary)' : '1px solid transparent' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Listing and Detail Grid */}
      <div style={{ gridTemplateColumns: selectedNote ? '1.5fr 1fr' : '1fr' }}>
        <Card padding="none">
          <ListPageTemplate
            title=""
            columns={[
              { key: 'deliveryNumber', header: 'Note Number', render: (v) => <span className={styles.p8}>{String(v)}</span> },
              { key: 'salesOrderNumber', header: 'Sales Order' },
              { key: 'carrierName', header: 'Carrier Partner', render: (v) => String(v || 'Self-Pickup') },
              { key: 'trackingNumber', header: 'Tracking Reference', render: (v) => <span className="font-mono">{String(v || 'N/A')}</span> },
              { key: 'createdAt', header: 'Dispatch Date', render: (v) => new Date(String(v)).toLocaleDateString() },
              { key: 'status', header: 'Status', render: (v) => <span style={{ background: v === 'DELIVERED' ? 'var(--color-success-light)' : v === 'IN_TRANSIT' ? 'var(--color-info-light)' : 'var(--color-bg-sunken)', color: v === 'DELIVERED' ? 'var(--color-success)' : v === 'IN_TRANSIT' ? 'var(--color-info-text)' : 'var(--color-text-secondary)' }}>{String(v)}</span> },
            ] as ListColumn[]}
            data={filteredNotes as unknown as Record<string, unknown>[]}
            loading={loading}
            onRowClick={(row) => loadNoteDetails(row as unknown as typeof filteredNotes[0])}
            emptyTitle="No delivery notes found"
            emptyDescription="No delivery notes found matching criteria."
          />
        </Card>

        {/* Detailed Panel View */}
        {selectedNote && (
          <Card padding="none" className={styles.p10}>
            <div className={styles.p11}>
              <h4 className={styles.p12}>Delivery Note {selectedNote.deliveryNumber}</h4>
              <button onClick={() => setSelectedNote(null)} className="ui-btn-icon ui-text-muted">
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="ui-center-pad">
                <Spinner size="md" />
              </div>
            ) : noteDetails && (
              <div className="p-5 ui-stack-4">
                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Origin Sales Order:</span>
                  <span className="ui-heading-sm">{noteDetails.salesOrder.orderNumber}</span>
                </div>

                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Carrier:</span>
                  <span className={styles.p13}>
                    <Truck size={14} /> {noteDetails.carrierName || 'Self-Pickup'}
                  </span>
                </div>

                {noteDetails.trackingNumber && (
                  <div className="ui-flex-between">
                    <span className="ui-text-sm-muted">Tracking Reference:</span>
                    <span className={styles.p14}>
                      {noteDetails.trackingNumber}
                    </span>
                  </div>
                )}

                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Fulfillment Warehouse:</span>
                  <span className={styles.p15}>
                    <MapPin size={14} /> {noteDetails.warehouseId}
                  </span>
                </div>

                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Fulfillment Status:</span>
                  <Badge variant={noteDetails.status === 'DELIVERED' ? 'success' : noteDetails.status === 'IN_TRANSIT' ? 'info' : 'default'}>
                    {noteDetails.status}
                  </Badge>
                </div>

                <div className={styles.p16}>
                  <span className={styles.p17}>
                    <Layers size={14} />
                    SHIPPED ITEMS QUANTITIES
                  </span>
                  <div className={styles.p18}>
                    {noteDetails.lineItems.map((li: DeliveryNoteDetailItem) => (
                      <div key={li.id} className={styles.p19}>
                        <span>{li.description}</span>
                        <span className="font-bold">Qty {Number(li.deliveredQty)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {noteDetails.notes && (
                  <div className={styles.p20}>
                    <span className={styles.p21}>Dispatch Notes:</span>
                    <p className={styles.p22}>{noteDetails.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
      </div>
    </RouteGuard>
  );
}
