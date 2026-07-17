'use client';
import styles from './operations.module.css';
import React, { useState, useEffect } from 'react';
import {
  Card, Button, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard, Drawer, Spinner,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { ClipboardList, Plus, Search, Calendar, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

interface ASNLineItem {
  id: string;
  productId: string;
  expectedQty: number;
  receivedQty: number;
  uom: string;
  lotNumber: string | null;
  serialNos: string | null;
  notes: string | null;
}

interface ASN {
  id: string;
  asnNumber: string;
  vendorId: string;
  purchaseOrderId: string | null;
  warehouseId: string;
  shipDate: string | null;
  expectedArrival: string | null;
  status: string;
  carrierName: string | null;
  trackingNumber: string | null;
  notes: string | null;
  receivedAt: string | null;
  lineItems: ASNLineItem[];
}

export default function AsnsTab() {
  const client = useApiClient();
  const [asns, setAsns] = useState<ASN[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedAsn, setSelectedAsn] = useState<ASN | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form states for creating ASN
  const [asnForm, setAsnForm] = useState({
    asnNumber: '',
    vendorId: '',
    purchaseOrderId: '',
    warehouseId: '',
    shipDate: '',
    expectedArrival: '',
    carrierName: '',
    trackingNumber: '',
    notes: '',
  });

  const [formItems, setFormItems] = useState<{ productId: string; expectedQty: number; lotNumber?: string }[]>([
    { productId: '', expectedQty: 1 },
  ]);

  // Form state for receiving ASN
  const [receiveItems, setReceiveItems] = useState<{ id: string; actualQty: number; lotNumber?: string; notes?: string }[]>([]);

  const fetchAsns = async () => {
    try {
      const data = await client.get<ASN[] | { data?: ASN[] }>('/supply-chain/asn');
      setAsns(Array.isArray(data) ? data : data.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAsns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asnForm.asnNumber || !asnForm.vendorId || !asnForm.warehouseId || formItems.some(i => !i.productId)) return;

    try {
      await client.post('/supply-chain/asn', {
        ...asnForm,
        shipDate: asnForm.shipDate ? new Date(asnForm.shipDate).toISOString() : null,
        expectedArrival: asnForm.expectedArrival ? new Date(asnForm.expectedArrival).toISOString() : null,
        lineItems: formItems.map(item => ({
          ...item,
          expectedQty: Number(item.expectedQty),
        })),
      });
      setCreateOpen(false);
      // Reset form
      setAsnForm({
        asnNumber: '',
        vendorId: '',
        purchaseOrderId: '',
        warehouseId: '',
        shipDate: '',
        expectedArrival: '',
        carrierName: '',
        trackingNumber: '',
        notes: '',
      });
      setFormItems([{ productId: '', expectedQty: 1 }]);
      fetchAsns();
    } catch { /* handled */ }
  };

  const handleReceiveSubmit = async () => {
    if (!selectedAsn) return;
    try {
      await client.post(`/supply-chain/asn/${selectedAsn.id}/receive`, {
        lineItems: receiveItems.map(item => ({
          ...item,
          actualQty: Number(item.actualQty),
        })),
      });
      setReceiveOpen(false);
      setSelectedAsn(null);
      fetchAsns();
    } catch { /* handled */ }
  };

  const openReceiveModal = (asn: ASN) => {
    setSelectedAsn(asn);
    setReceiveItems(
      asn.lineItems.map(item => ({
        id: item.id,
        actualQty: item.expectedQty,
        lotNumber: item.lotNumber || '',
        notes: '',
      }))
    );
    setReceiveOpen(true);
  };

  const openDetailsDrawer = (asn: ASN) => {
    setSelectedAsn(asn);
    setDrawerOpen(true);
  };

  const filtered = asns.filter(asn =>
    asn.asnNumber.toLowerCase().includes(search.toLowerCase()) ||
    (asn.carrierName || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<ASN>[] = [
    {
      key: 'asnNumber',
      header: 'ASN Number',
      render: (row) => (
        <div className="ui-hstack-2">
          <ClipboardList size={16} className="text-primary" />
          <span className="font-semibold text-sm">{row.asnNumber}</span>
        </div>
      ),
    },
    { key: 'vendorId', header: 'Vendor ID', render: (row) => <span className="text-sm">{row.vendorId}</span> },
    { key: 'warehouseId', header: 'Warehouse ID', render: (row) => <span className="text-sm">{row.warehouseId}</span> },
    {
      key: 'expectedArrival',
      header: 'Expected Arrival',
      render: (row) => (
        <span className="ui-text-xs-muted">
          {row.expectedArrival ? new Date(row.expectedArrival).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'RECEIVED' ? 'success' : row.status === 'PENDING' ? 'warning' : 'info'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="ui-hstack-2 ui-justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => openDetailsDrawer(row)}>
            <Eye size={12} className="mr-1" /> View
          </Button>
          {row.status !== 'RECEIVED' && (
            <Button variant="primary" size="sm" onClick={() => openReceiveModal(row)}>
              Receive
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RouteGuard permission="supply-chain.asn.read">
      <div className="ui-stack-6">
        <div className="ui-flex-between">
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search ASNs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-2" /> Add ASN
          </Button>
        </div>

        <div className="ui-grid-auto">
          <KPICard title="Total ASNs" value={asns.length} icon={<ClipboardList size={18} />} color="var(--color-primary)" />
          <KPICard title="Pending Receipt" value={asns.filter(a => a.status !== 'RECEIVED').length} icon={<Calendar size={18} />} color="var(--color-warning)" />
          <KPICard title="Fully Received" value={asns.filter(a => a.status === 'RECEIVED').length} icon={<CheckCircle2 size={18} />} color="var(--color-success)" />
        </div>

        <Card padding="none">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(r) => r.id}
            onRowClick={openDetailsDrawer}
            emptyTitle="No Advance Shipping Notices"
            emptyMessage="Create ASNs to manage pre-arrival shipping notifications from vendors."
            emptyIcon={<ClipboardList size={48} />}
          />
        </Card>

        {/* Create ASN Modal */}
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Create Advance Shipping Notice (ASN)"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>Save ASN</Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="ASN Number"
                required
                value={asnForm.asnNumber}
                onChange={(e) => setAsnForm({ ...asnForm, asnNumber: e.target.value })}
                placeholder="ASN-2026-0001"
              />
              <TextField
                label="Vendor ID"
                required
                value={asnForm.vendorId}
                onChange={(e) => setAsnForm({ ...asnForm, vendorId: e.target.value })}
                placeholder="vendor-cuid-or-code"
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Warehouse ID"
                required
                value={asnForm.warehouseId}
                onChange={(e) => setAsnForm({ ...asnForm, warehouseId: e.target.value })}
                placeholder="warehouse-cuid-or-code"
              />
              <TextField
                label="Purchase Order ID (Optional)"
                value={asnForm.purchaseOrderId}
                onChange={(e) => setAsnForm({ ...asnForm, purchaseOrderId: e.target.value })}
                placeholder="po-cuid-or-code"
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Ship Date"
                type="datetime-local"
                value={asnForm.shipDate}
                onChange={(e) => setAsnForm({ ...asnForm, shipDate: e.target.value })}
              />
              <TextField
                label="Expected Arrival"
                type="datetime-local"
                value={asnForm.expectedArrival}
                onChange={(e) => setAsnForm({ ...asnForm, expectedArrival: e.target.value })}
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Carrier Name"
                value={asnForm.carrierName}
                onChange={(e) => setAsnForm({ ...asnForm, carrierName: e.target.value })}
                placeholder="FedEx"
              />
              <TextField
                label="Tracking Number"
                value={asnForm.trackingNumber}
                onChange={(e) => setAsnForm({ ...asnForm, trackingNumber: e.target.value })}
                placeholder="1Z999AA10123..."
              />
            </div>
            <TextField
              label="Notes"
              value={asnForm.notes}
              onChange={(e) => setAsnForm({ ...asnForm, notes: e.target.value })}
              placeholder="Add shipping notes..."
            />

            <div className="ui-heading-sm mt-4 mb-2">Line Items</div>
            <div className="ui-stack-2">
              {formItems.map((item, idx) => (
                <div key={idx} className="ui-grid-3 ui-gap-3 ui-items-end">
                  <TextField
                    label={idx === 0 ? "Product ID" : undefined}
                    required
                    value={item.productId}
                    onChange={(e) => {
                      const updated = [...formItems];
                      const current = updated[idx];
                      if (current) {
                        current.productId = e.target.value;
                        setFormItems(updated);
                      }
                    }}
                    placeholder="Product ID"
                  />
                  <TextField
                    label={idx === 0 ? "Expected Quantity" : undefined}
                    type="number"
                    required
                    value={item.expectedQty}
                    onChange={(e) => {
                      const updated = [...formItems];
                      const current = updated[idx];
                      if (current) {
                        current.expectedQty = Number(e.target.value);
                        setFormItems(updated);
                      }
                    }}
                  />
                  <div className="ui-hstack-2">
                    <TextField
                      label={idx === 0 ? "Lot Number (Optional)" : undefined}
                      value={item.lotNumber || ''}
                      onChange={(e) => {
                        const updated = [...formItems];
                        const current = updated[idx];
                        if (current) {
                          current.lotNumber = e.target.value;
                          setFormItems(updated);
                        }
                      }}
                      placeholder="Lot #"
                    />
                    {formItems.length > 1 && (
                      <Button
                        variant="secondary"
                        onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFormItems([...formItems, { productId: '', expectedQty: 1 }])}
                className="ui-self-start"
              >
                Add Item
              </Button>
            </div>
          </div>
        </Modal>

        {/* Receive Goods Modal */}
        <Modal
          open={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          title={`Receive Goods - ASN: ${selectedAsn?.asnNumber}`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setReceiveOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleReceiveSubmit}>Submit Receipt</Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <div className="ui-text-sm-muted mb-4">
              Enter the actual quantities received for each line item. Any differences from expected quantities will automatically log an ASN discrepancy report.
            </div>

            {selectedAsn?.lineItems.map((item, idx) => {
              const receiveItem = receiveItems.find(r => r.id === item.id);
              return (
                <Card key={item.id} padding="md" className="ui-stack-3">
                  <div className="ui-flex-between">
                    <div>
                      <div className="ui-heading-sm">Product ID: {item.productId}</div>
                      <div className="ui-text-xs-tertiary">Expected: {item.expectedQty} {item.uom}</div>
                    </div>
                    <div className="w-1/3">
                      <TextField
                        label="Received Quantity"
                        type="number"
                        value={receiveItem?.actualQty ?? 0}
                        onChange={(e) => {
                          const updated = [...receiveItems];
                          const target = updated.find(r => r.id === item.id);
                          if (target) target.actualQty = Number(e.target.value);
                          setReceiveItems(updated);
                        }}
                      />
                    </div>
                  </div>
                  <div className="ui-grid-2 ui-gap-3 mt-2">
                    <TextField
                      label="Lot Number"
                      value={receiveItem?.lotNumber || ''}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        const target = updated.find(r => r.id === item.id);
                        if (target) target.lotNumber = e.target.value;
                        setReceiveItems(updated);
                      }}
                      placeholder="Override Lot #"
                    />
                    <TextField
                      label="Discrepancy Notes / Damage"
                      value={receiveItem?.notes || ''}
                      onChange={(e) => {
                        const updated = [...receiveItems];
                        const target = updated.find(r => r.id === item.id);
                        if (target) target.notes = e.target.value;
                        setReceiveItems(updated);
                      }}
                      placeholder="Shortage, damages..."
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </Modal>

        {/* Details Drawer */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={`ASN Details: ${selectedAsn?.asnNumber}`}
          size="lg"
        >
          {selectedAsn && (
            <div className="ui-stack-6">
              <Card>
                <div className="ui-grid-2 ui-gap-3">
                  <div>
                    <div className="ui-text-xs-tertiary">Status</div>
                    <Badge variant={selectedAsn.status === 'RECEIVED' ? 'success' : 'warning'}>{selectedAsn.status}</Badge>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Vendor ID</div>
                    <div className="ui-text-sm font-semibold">{selectedAsn.vendorId}</div>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Warehouse ID</div>
                    <div className="ui-text-sm font-semibold">{selectedAsn.warehouseId}</div>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Purchase Order ID</div>
                    <div className="ui-text-sm font-semibold">{selectedAsn.purchaseOrderId || '—'}</div>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Ship Date</div>
                    <div className="ui-text-sm font-semibold">
                      {selectedAsn.shipDate ? new Date(selectedAsn.shipDate).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Expected Arrival</div>
                    <div className="ui-text-sm font-semibold">
                      {selectedAsn.expectedArrival ? new Date(selectedAsn.expectedArrival).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Carrier</div>
                    <div className="ui-text-sm font-semibold">{selectedAsn.carrierName || '—'}</div>
                  </div>
                  <div>
                    <div className="ui-text-xs-tertiary">Tracking Number</div>
                    <div className="ui-text-sm font-semibold">{selectedAsn.trackingNumber || '—'}</div>
                  </div>
                </div>
                {selectedAsn.notes && (
                  <div className="mt-3">
                    <div className="ui-text-xs-tertiary">Notes</div>
                    <div className="ui-text-sm-muted">{selectedAsn.notes}</div>
                  </div>
                )}
              </Card>

              <div className="ui-heading-md">Expected Line Items</div>
              <Card padding="none">
                <table className="ui-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-3">Product ID</th>
                      <th className="text-right py-2 px-3">Expected Qty</th>
                      <th className="text-right py-2 px-3">Received Qty</th>
                      <th className="text-left py-2 px-3">UOM</th>
                      <th className="text-left py-2 px-3">Lot Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAsn.lineItems.map(item => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="py-2 px-3 text-sm">{item.productId}</td>
                        <td className="py-2 px-3 text-right text-sm">{item.expectedQty}</td>
                        <td className="py-2 px-3 text-right text-sm font-semibold">{item.receivedQty}</td>
                        <td className="py-2 px-3 text-sm">{item.uom}</td>
                        <td className="py-2 px-3 text-sm">{item.lotNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </Drawer>
      </div>
    </RouteGuard>
  );
}
