'use client';
import styles from './operations.module.css';
import React, { useState, useEffect } from 'react';
import {
  Card, Button, Badge, StatusBadge, DataTable, type Column, Drawer, Modal, TextField, FormField, Select, Spinner,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Package, Search, Plus, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Carrier {
  id: string;
  name: string;
}

interface ASN {
  id: string;
  asnNumber: string;
  status: string;
}

interface TrackingEvent {
  id: string;
  eventCode: string;
  description: string;
  location: string | null;
  occurredAt: string;
  source: string;
}

interface ShipmentException {
  id: string;
  exceptionCode: string;
  description: string;
  severity: string;
  status: string;
  reportedBy: string;
  createdAt: string;
  resolutionNote: string | null;
}

interface DisplayShipment {
  id: string;
  shipmentNumber: string;
  warehouseId: string;
  carrierId: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  status: string;
  totalWeight: number | null;
  totalPallets: number | null;
  totalCartons: number | null;
  notes: string | null;
  createdAt: string;
  // Inbound-specific
  asnId?: string | null;
  expectedArrival?: string | null;
  arrivedAt?: string | null;
  // Outbound-specific
  salesOrderId?: string | null;
  serviceLevelId?: string | null;
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
  recipientName?: string | null;
  recipientAddr?: string | null;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ShipmentsTab() {
  const client = useApiClient();
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [shipments, setShipments] = useState<DisplayShipment[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [asns, setAsns] = useState<ASN[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Drawer / Selection state
  const [selected, setSelected] = useState<DisplayShipment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [exceptions, setExceptions] = useState<ShipmentException[]>([]);

  // Modals state
  const [createInboundOpen, setCreateInboundOpen] = useState(false);
  const [createOutboundOpen, setCreateOutboundOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [reportExceptionOpen, setReportExceptionOpen] = useState(false);
  const [resolveExceptionOpen, setResolveExceptionOpen] = useState(false);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);

  // Form states
  const [inboundForm, setInboundForm] = useState({
    shipmentNumber: '', warehouseId: '', carrierId: '', asnId: '', trackingNumber: '',
    expectedArrival: '', totalPallets: 0, totalCartons: 0, totalWeight: 0, notes: '',
  });

  const [outboundForm, setOutboundForm] = useState({
    shipmentNumber: '', warehouseId: '', carrierId: '', serviceLevelId: '', salesOrderId: '',
    trackingNumber: '', estimatedDelivery: '', totalPallets: 0, totalCartons: 0, totalWeight: 0,
    recipientName: '', recipientAddr: '', notes: '',
  });

  const [eventForm, setEventForm] = useState({
    eventCode: 'IN_TRANSIT', description: '', location: '', source: 'MANUAL',
  });

  const [exceptionForm, setExceptionForm] = useState({
    exceptionCode: '', description: '', severity: 'MEDIUM',
  });

  const [resolutionNote, setResolutionNote] = useState('');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const endpoint = direction === 'inbound' ? '/supply-chain/inbound-shipments' : '/supply-chain/outbound-shipments';
      const data = await client.get<any[] | { data?: any[] }>(endpoint);
      const list = Array.isArray(data) ? data : data.data || [];
      
      setShipments(
        list.map((s: any) => ({
          id: s.id,
          shipmentNumber: s.shipmentNumber,
          warehouseId: s.warehouseId,
          carrierId: s.carrierId,
          carrierName: s.carrier?.name || 'No Carrier',
          trackingNumber: s.trackingNumber,
          status: s.status,
          totalWeight: s.totalWeight ? Number(s.totalWeight) : null,
          totalPallets: s.totalPallets,
          totalCartons: s.totalCartons,
          notes: s.notes,
          createdAt: s.createdAt,
          asnId: s.asnId,
          expectedArrival: s.expectedArrival,
          arrivedAt: s.arrivedAt,
          salesOrderId: s.salesOrderId,
          serviceLevelId: s.serviceLevelId,
          estimatedDelivery: s.estimatedDelivery,
          deliveredAt: s.deliveredAt,
          recipientName: s.recipientName,
          recipientAddr: s.recipientAddr,
        }))
      );
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const fetchLookups = async () => {
    try {
      const carrierList = await client.get<Carrier[]>('/supply-chain/carriers');
      setCarriers(carrierList);

      const asnList = await client.get<ASN[]>('/supply-chain/asn');
      setAsns(asnList.filter(a => a.status !== 'RECEIVED'));
    } catch { /* empty */ }
  };

  const fetchDetails = async (shipment: DisplayShipment) => {
    try {
      const [eventsList, exceptionsList] = await Promise.all([
        client.get<TrackingEvent[]>(`/supply-chain/shipments/${direction}/${shipment.id}/events`),
        client.get<ShipmentException[]>(`/supply-chain/shipments/${shipment.id}/exceptions`),
      ]);
      setEvents(eventsList);
      setExceptions(exceptionsList);
    } catch { /* empty */ }
  };

  useEffect(() => {
    fetchShipments();
    fetchLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, client]);

  const handleRowClick = async (row: DisplayShipment) => {
    setSelected(row);
    setDrawerOpen(true);
    fetchDetails(row);
  };

  const handleCreateInbound = async () => {
    if (!inboundForm.shipmentNumber || !inboundForm.warehouseId) return;
    try {
      await client.post('/supply-chain/inbound-shipments', {
        ...inboundForm,
        carrierId: inboundForm.carrierId || null,
        asnId: inboundForm.asnId || null,
        expectedArrival: inboundForm.expectedArrival ? new Date(inboundForm.expectedArrival).toISOString() : null,
        totalPallets: Number(inboundForm.totalPallets) || null,
        totalCartons: Number(inboundForm.totalCartons) || null,
        totalWeight: Number(inboundForm.totalWeight) || null,
      });
      setCreateInboundOpen(false);
      setInboundForm({
        shipmentNumber: '', warehouseId: '', carrierId: '', asnId: '', trackingNumber: '',
        expectedArrival: '', totalPallets: 0, totalCartons: 0, totalWeight: 0, notes: '',
      });
      fetchShipments();
    } catch { /* handled */ }
  };

  const handleCreateOutbound = async () => {
    if (!outboundForm.shipmentNumber || !outboundForm.warehouseId) return;
    try {
      await client.post('/supply-chain/outbound-shipments', {
        ...outboundForm,
        carrierId: outboundForm.carrierId || null,
        serviceLevelId: outboundForm.serviceLevelId || null,
        estimatedDelivery: outboundForm.estimatedDelivery ? new Date(outboundForm.estimatedDelivery).toISOString() : null,
        totalPallets: Number(outboundForm.totalPallets) || null,
        totalCartons: Number(outboundForm.totalCartons) || null,
        totalWeight: Number(outboundForm.totalWeight) || null,
      });
      setCreateOutboundOpen(false);
      setOutboundForm({
        shipmentNumber: '', warehouseId: '', carrierId: '', serviceLevelId: '', salesOrderId: '',
        trackingNumber: '', estimatedDelivery: '', totalPallets: 0, totalCartons: 0, totalWeight: 0,
        recipientName: '', recipientAddr: '', notes: '',
      });
      fetchShipments();
    } catch { /* handled */ }
  };

  const handleAddEvent = async () => {
    if (!selected || !eventForm.description) return;
    try {
      await client.post(`/supply-chain/shipments/${direction}/${selected.id}/events`, eventForm);
      setAddEventOpen(false);
      setEventForm({ eventCode: 'IN_TRANSIT', description: '', location: '', source: 'MANUAL' });
      fetchDetails(selected);
      fetchShipments(); // Reload main statuses
    } catch { /* handled */ }
  };

  const handleReportException = async () => {
    if (!selected || !exceptionForm.exceptionCode || !exceptionForm.description) return;
    try {
      await client.post(`/supply-chain/shipments/${selected.id}/exceptions`, {
        ...exceptionForm,
        direction: direction.toUpperCase(),
      });
      setReportExceptionOpen(false);
      setExceptionForm({ exceptionCode: '', description: '', severity: 'MEDIUM' });
      fetchDetails(selected);
    } catch { /* handled */ }
  };

  const handleResolveException = async () => {
    if (!selectedExceptionId || !resolutionNote) return;
    try {
      await client.patch(`/supply-chain/exceptions/${selectedExceptionId}/resolve`, { resolutionNote });
      setResolveExceptionOpen(false);
      setResolutionNote('');
      setSelectedExceptionId(null);
      if (selected) fetchDetails(selected);
    } catch { /* handled */ }
  };

  const filtered = shipments.filter(s => {
    const matchSearch = !search || s.shipmentNumber.toLowerCase().includes(search.toLowerCase()) || (s.carrierName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<DisplayShipment>[] = [
    {
      key: 'shipment', header: 'Shipment',
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={direction === 'outbound' ? styles.iconWellOutbound : styles.iconWellInbound}>
            <Package size={16} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.shipmentNumber}</div>
            <div className="ui-text-xs-tertiary">{row.carrierName}</div>
          </div>
        </div>
      ),
    },
    { key: 'tracking', header: 'Tracking', render: (row) => row.trackingNumber ? <code className={styles.trackingCode}>{row.trackingNumber}</code> : <span className={styles.trackingFallback}>—</span> },
    { key: 'weight', header: 'Weight', render: (row) => <span className="ui-text-sm-muted">{row.totalWeight ? `${row.totalWeight} kg` : '—'}</span> },
    { key: 'qty', header: 'Pallets/Cartons', render: (row) => <span className="text-sm">{row.totalPallets || 0} / {row.totalCartons || 0}</span> },
    { key: 'eta', header: 'ETA / Expected', render: (row) => <span className="ui-text-xs-muted">{row.expectedArrival || row.estimatedDelivery ? new Date(row.expectedArrival || row.estimatedDelivery || '').toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <RouteGuard permission="supply-chain.shipment.read">
      <div className="ui-stack-6">
        <div className="ui-flex-between">
          <div className="ui-hstack-2">
            <Button variant={direction === 'inbound' ? 'primary' : 'secondary'} onClick={() => setDirection('inbound')}>Inbound Shipments</Button>
            <Button variant={direction === 'outbound' ? 'primary' : 'secondary'} onClick={() => setDirection('outbound')}>Outbound Shipments</Button>
          </div>
          <Button variant="primary" onClick={() => direction === 'inbound' ? setCreateInboundOpen(true) : setCreateOutboundOpen(true)}>
            <Plus size={14} className="mr-2" /> Add {direction === 'inbound' ? 'Inbound' : 'Outbound'}
          </Button>
        </div>

        <Card>
          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input type="text" placeholder="Search by number or carrier..." value={search} onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput} />
            </div>
            <div className="ui-flex ui-gap-2">
              {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETE', 'EXCEPTION'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? styles.filterButtonActive : styles.filterButton}>
                  {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        ) : (
          <Card padding="none">
            <DataTable columns={columns} data={filtered} rowKey={r => r.id} onRowClick={handleRowClick}
              emptyTitle={`No ${direction} shipments`} emptyMessage={`Add a new ${direction} shipment to begin tracking.`} emptyIcon={<Package size={48} />} />
          </Card>
        )}

        {/* Create Inbound Modal */}
        <Modal open={createInboundOpen} onClose={() => setCreateInboundOpen(false)} title="Create Inbound Shipment" size="lg"
          footer={<><Button variant="secondary" onClick={() => setCreateInboundOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreateInbound}>Save Shipment</Button></>}>
          <div className="ui-stack-4">
            <div className="ui-grid-2 ui-gap-3">
              <TextField label="Shipment Number" required value={inboundForm.shipmentNumber} onChange={e => setInboundForm({ ...inboundForm, shipmentNumber: e.target.value })} placeholder="INB-2026-0001" />
              <TextField label="Warehouse ID" required value={inboundForm.warehouseId} onChange={e => setInboundForm({ ...inboundForm, warehouseId: e.target.value })} placeholder="wh-1" />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Carrier">
                <Select value={inboundForm.carrierId} onChange={e => setInboundForm({ ...inboundForm, carrierId: e.target.value })}>
                  <option value="">Choose Carrier</option>
                  {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </FormField>
              <FormField label="ASN Connection">
                <Select value={inboundForm.asnId} onChange={e => setInboundForm({ ...inboundForm, asnId: e.target.value })}>
                  <option value="">No ASN Connection</option>
                  {asns.map(a => <option key={a.id} value={a.id}>{a.asnNumber}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField label="Tracking Number" value={inboundForm.trackingNumber} onChange={e => setInboundForm({ ...inboundForm, trackingNumber: e.target.value })} placeholder="1Z999..." />
              <TextField label="Expected Arrival" type="datetime-local" value={inboundForm.expectedArrival} onChange={e => setInboundForm({ ...inboundForm, expectedArrival: e.target.value })} />
            </div>
            <div className="ui-grid-3 ui-gap-3">
              <TextField label="Total Pallets" type="number" value={inboundForm.totalPallets} onChange={e => setInboundForm({ ...inboundForm, totalPallets: Number(e.target.value) })} />
              <TextField label="Total Cartons" type="number" value={inboundForm.totalCartons} onChange={e => setInboundForm({ ...inboundForm, totalCartons: Number(e.target.value) })} />
              <TextField label="Total Weight (kg)" type="number" value={inboundForm.totalWeight} onChange={e => setInboundForm({ ...inboundForm, totalWeight: Number(e.target.value) })} />
            </div>
            <TextField label="Notes" value={inboundForm.notes} onChange={e => setInboundForm({ ...inboundForm, notes: e.target.value })} placeholder="Inbound receiving instructions..." />
          </div>
        </Modal>

        {/* Create Outbound Modal */}
        <Modal open={createOutboundOpen} onClose={() => setCreateOutboundOpen(false)} title="Create Outbound Shipment" size="lg"
          footer={<><Button variant="secondary" onClick={() => setCreateOutboundOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreateOutbound}>Save Shipment</Button></>}>
          <div className="ui-stack-4">
            <div className="ui-grid-2 ui-gap-3">
              <TextField label="Shipment Number" required value={outboundForm.shipmentNumber} onChange={e => setOutboundForm({ ...outboundForm, shipmentNumber: e.target.value })} placeholder="OUT-2026-0001" />
              <TextField label="Warehouse ID" required value={outboundForm.warehouseId} onChange={e => setOutboundForm({ ...outboundForm, warehouseId: e.target.value })} placeholder="wh-1" />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Carrier">
                <Select value={outboundForm.carrierId} onChange={e => setOutboundForm({ ...outboundForm, carrierId: e.target.value })}>
                  <option value="">Choose Carrier</option>
                  {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </FormField>
              <TextField label="Sales Order ID" value={outboundForm.salesOrderId} onChange={e => setOutboundForm({ ...outboundForm, salesOrderId: e.target.value })} placeholder="so-1" />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField label="Tracking Number" value={outboundForm.trackingNumber} onChange={e => setOutboundForm({ ...outboundForm, trackingNumber: e.target.value })} placeholder="1Z999..." />
              <TextField label="Estimated Delivery" type="datetime-local" value={outboundForm.estimatedDelivery} onChange={e => setOutboundForm({ ...outboundForm, estimatedDelivery: e.target.value })} />
            </div>
            <div className="ui-grid-3 ui-gap-3">
              <TextField label="Total Pallets" type="number" value={outboundForm.totalPallets} onChange={e => setOutboundForm({ ...outboundForm, totalPallets: Number(e.target.value) })} />
              <TextField label="Total Cartons" type="number" value={outboundForm.totalCartons} onChange={e => setOutboundForm({ ...outboundForm, totalCartons: Number(e.target.value) })} />
              <TextField label="Total Weight (kg)" type="number" value={outboundForm.totalWeight} onChange={e => setOutboundForm({ ...outboundForm, totalWeight: Number(e.target.value) })} />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField label="Recipient Name" value={outboundForm.recipientName} onChange={e => setOutboundForm({ ...outboundForm, recipientName: e.target.value })} />
              <TextField label="Recipient Address" value={outboundForm.recipientAddr} onChange={e => setOutboundForm({ ...outboundForm, recipientAddr: e.target.value })} />
            </div>
            <TextField label="Notes" value={outboundForm.notes} onChange={e => setOutboundForm({ ...outboundForm, notes: e.target.value })} placeholder="Outbound delivery notes..." />
          </div>
        </Modal>

        {/* Details Drawer */}
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Shipment: ${selected?.shipmentNumber}`} size="lg">
          {selected && (
            <div className="ui-stack-6">
              <Card>
                <div className="ui-grid-2 ui-gap-3">
                  <div>
                    <div className="ui-text-xs-tertiary">Status</div>
                    <Badge variant={selected.status === 'DELIVERED' || selected.status === 'COMPLETE' ? 'success' : selected.status === 'EXCEPTION' ? 'danger' : 'warning'}>{selected.status}</Badge>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Carrier</div>
                    <div className="ui-text-sm font-semibold">{selected.carrierName || 'No carrier'}</div>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Tracking Number</div>
                    <div className="ui-text-sm font-mono font-semibold">{selected.trackingNumber || '—'}</div>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Warehouse ID</div>
                    <div className="ui-text-sm font-semibold">{selected.warehouseId}</div>
                  </div>
                  {direction === 'inbound' ? (
                    <>
                      <div>
                        <div className="ui-text-xs-tertiary">Expected Arrival</div>
                        <div className="ui-text-sm font-semibold">{selected.expectedArrival ? new Date(selected.expectedArrival).toLocaleString() : '—'}</div>
                      </div>
                      <div>
                        <div className="ui-text-xs-tertiary">Arrived At</div>
                        <div className="ui-text-sm font-semibold">{selected.arrivedAt ? new Date(selected.arrivedAt).toLocaleString() : '—'}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="ui-text-xs-tertiary">Estimated Delivery</div>
                        <div className="ui-text-sm font-semibold">{selected.estimatedDelivery ? new Date(selected.estimatedDelivery).toLocaleString() : '—'}</div>
                      </div>
                      <div>
                        <div className="ui-text-xs-tertiary">Delivered At</div>
                        <div className="ui-text-sm font-semibold">{selected.deliveredAt ? new Date(selected.deliveredAt).toLocaleString() : '—'}</div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Actions */}
              <div className="ui-hstack-2">
                <Button variant="primary" onClick={() => setAddEventOpen(true)}>Add Tracking Event</Button>
                <Button variant="danger" onClick={() => setReportExceptionOpen(true)}>Report Exception</Button>
              </div>

              {/* Exceptions */}
              <div className="ui-heading-md">Shipment Exceptions</div>
              {exceptions.length === 0 ? (
                <div className="ui-text-sm-muted py-2">No active exceptions reported.</div>
              ) : (
                <div className="ui-stack-2">
                  {exceptions.map(ex => (
                    <Card key={ex.id} padding="md" className="ui-hstack-3 ui-justify-between">
                      <div className="ui-hstack-2 ui-items-center">
                        <AlertTriangle className={ex.status === 'RESOLVED' ? 'text-success' : 'text-danger'} size={18} />
                        <div>
                          <div className="ui-heading-sm">{ex.exceptionCode} - <Badge variant={ex.status === 'RESOLVED' ? 'success' : 'danger'}>{ex.status}</Badge></div>
                          <div className="ui-text-xs-tertiary">{ex.description}</div>
                          {ex.resolutionNote && <div className="ui-text-xs-muted mt-1 font-semibold">Resolution: {ex.resolutionNote}</div>}
                        </div>
                      </div>
                      {ex.status !== 'RESOLVED' && (
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedExceptionId(ex.id); setResolveExceptionOpen(true); }}>
                          Resolve
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {/* Milestones History */}
              <div className="ui-heading-md">Tracking Timeline</div>
              {events.length === 0 ? (
                <div className="ui-text-sm-muted py-2">No tracking updates logged.</div>
              ) : (
                <div className="ui-stack-3 border-l-2 border-border pl-4 ml-2">
                  {events.map(ev => (
                    <div key={ev.id} className="relative py-1">
                      <div className="absolute -left-6 top-2 w-3.5 h-3.5 rounded-full bg-primary border-4 border-bg" />
                      <div className="ui-text-xs-tertiary font-mono">{new Date(ev.occurredAt).toLocaleString()} · {ev.location || 'Unknown Location'}</div>
                      <div className="ui-heading-sm font-semibold">{ev.eventCode}</div>
                      <div className="ui-text-sm-muted">{ev.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Drawer>

        {/* Add Event Modal */}
        <Modal open={addEventOpen} onClose={() => setAddEventOpen(false)} title="Add Tracking Event" size="md"
          footer={<><Button variant="secondary" onClick={() => setAddEventOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAddEvent}>Log Event</Button></>}>
          <div className="ui-stack-4">
            <FormField label="Event Code">
              <Select value={eventForm.eventCode} onChange={e => setEventForm({ ...eventForm, eventCode: e.target.value })}>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="EXCEPTION">Exception</option>
              </Select>
            </FormField>
            <TextField label="Description" required value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Departed sorting facility" />
            <TextField label="Location" value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Memphis, TN" />
          </div>
        </Modal>

        {/* Report Exception Modal */}
        <Modal open={reportExceptionOpen} onClose={() => setReportExceptionOpen(false)} title="Report Shipment Exception" size="md"
          footer={<><Button variant="secondary" onClick={() => setReportExceptionOpen(false)}>Cancel</Button><Button variant="danger" onClick={handleReportException}>Report Exception</Button></>}>
          <div className="ui-stack-4">
            <TextField label="Exception Code" required value={exceptionForm.exceptionCode} onChange={e => setExceptionForm({ ...exceptionForm, exceptionCode: e.target.value })} placeholder="WEATHER_DELAY" />
            <TextField label="Description" required value={exceptionForm.description} onChange={e => setExceptionForm({ ...exceptionForm, description: e.target.value })} placeholder="Severe storms delaying carrier dispatch." />
            <FormField label="Severity">
              <Select value={exceptionForm.severity} onChange={e => setExceptionForm({ ...exceptionForm, severity: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </FormField>
          </div>
        </Modal>

        {/* Resolve Exception Modal */}
        <Modal open={resolveExceptionOpen} onClose={() => setResolveExceptionOpen(false)} title="Resolve Exception" size="md"
          footer={<><Button variant="secondary" onClick={() => setResolveExceptionOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleResolveException}>Resolve Exception</Button></>}>
          <div className="ui-stack-4">
            <TextField label="Resolution Note" required value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} placeholder="Carrier has resumed transit." />
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
