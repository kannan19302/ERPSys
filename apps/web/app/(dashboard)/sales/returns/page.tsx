'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Plus,
  Search,
  X,
  History,
  FileText,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface SalesReturn {
  id: string;
  returnNumber: string;
  status: string;
  returnDate: string;
  totalAmount: number;
  customerName: string;
  orderNumber: string;
  lineItemCount: number;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
}

interface SalesOrderItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface SalesOrderDetail {
  id: string;
  orderNumber: string;
  lineItems: SalesOrderItem[];
}

export default function SalesReturnsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected details drawer
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const [salesOrderId, setSalesOrderId] = useState('');
  const [returnNumber, setReturnNumber] = useState('');
  const [reason, setReason] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ productId: string; description: string; quantity: number; unitPrice: number; taxRate: number }>>([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [returnsRes, ordersRes] = await Promise.all([
        client.get<SalesReturn[] | { data?: SalesReturn[] }>('/sales/returns'),
        client.get<SalesOrder[] | { data?: SalesOrder[] }>('/sales/orders')
      ]);

      setReturns(Array.isArray(returnsRes) ? returnsRes : returnsRes.data || []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
    } catch {
      setError('Could not load data. Please try again.');
      // Mock data
      setReturns([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleOrderChange = async (orderId: string) => {
    setSalesOrderId(orderId);
    if (!orderId) {
      setLineItems([]);
      return;
    }

    setLoadingOrderItems(true);
    try {
      const data = await client.get<SalesOrderDetail>(`/sales/orders/${orderId}`);
      setLineItems(data.lineItems.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
          })));
    } catch {
      // Mock fallback line items
      setLineItems([]);
    } finally {
      setLoadingOrderItems(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      salesOrderId,
      returnNumber,
      reason: reason || undefined,
      lineItems: lineItems.filter(item => item.quantity > 0)
    };

    try {
      await client.post('/sales/returns', payload);

      setModalSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
        loadData();
      }, 1500);
    } catch {
      // save failed — surface the error instead of fabricating a result
      setError('Action could not be completed. Please try again.');
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSalesOrderId('');
    setReturnNumber('');
    setReason('');
    setLineItems([]);
    setModalSuccess(false);
  };

  const filteredReturns = returns.filter(r => {
    return r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getReturnTotal = returns.reduce((acc, r) => acc + r.totalAmount, 0);
  const getReturnCount = returns.length;

  return (
    <RouteGuard permission="sales.return.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Customer Returns"
        description="Log returned deliveries, issue financial credit notes, and trigger restocking automation."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders', href: '/sales' }, { label: 'Returns' }]}
        actions={
          <Button onClick={() => {
            setIsModalOpen(true);
            setReturnNumber(`SR-${Math.floor(1000 + Math.random() * 9000)}`);
          }} variant="primary" className="ui-hstack-2">
            <Plus size={16} />
            <span>Log Customer Return</span>
          </Button>
        }
      />

      {error && (
        <div className={styles.p1}>
          <AlertCircle size={16} className="ui-text-warning" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.p2}>
        <Card className={styles.p3}>
          <div className={styles.p4}>
            <RotateCcw size={24} />
          </div>
          <div>
            <div className={styles.p5}>Total Customer Returns</div>
            <div className={styles.p6}>${getReturnTotal.toLocaleString()}</div>
          </div>
        </Card>

        <Card className={styles.p7}>
          <div className={styles.p8}>
            <History size={24} />
          </div>
          <div>
            <div className={styles.p9}>Return Invoices Count</div>
            <div className={styles.p10}>{getReturnCount} Cases</div>
          </div>
        </Card>

        <Card className={styles.p11}>
          <div className={styles.p12}>
            <FileText size={24} />
          </div>
          <div>
            <div className={styles.p13}>Credit Notes Issued</div>
            <div className={styles.p14}>{getReturnCount} Active</div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-4">
        <div className={styles.p15}>
          <div className={styles.p16}>
            <Search size={16} className={styles.p17} />
            <input
              type="text"
              placeholder="Search return slips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={["ui-input", styles.p18].join(' ')}

            />
          </div>
        </div>

        <ListPageTemplate
          title=""
          columns={[
            { key: 'returnNumber', header: 'Return ID', render: (v) => <span className={styles.p19}>{String(v)}</span> },
            { key: 'customerName', header: 'Client Name' },
            { key: 'orderNumber', header: 'Sales Order', render: (v) => <Badge variant="default">{String(v)}</Badge> },
            { key: 'returnDate', header: 'Date Logged', render: (v) => <span className="ui-text-muted">{new Date(String(v)).toLocaleDateString()}</span> },
            { key: 'lineItemCount', header: 'Items', render: (v) => `${v} Types` },
            { key: 'totalAmount', header: 'Total Credit', render: (v) => <strong>${Number(v).toLocaleString()}</strong> },
            { key: 'status', header: 'Status', render: () => <Badge variant="success">Completed</Badge> },
          ] as ListColumn[]}
          data={filteredReturns as unknown as Record<string, unknown>[]}
          loading={loading}
          onRowClick={(row) => setSelectedReturn(row as unknown as typeof filteredReturns[0])}
          emptyTitle="No Returns Logged"
          emptyDescription="Log returns to update inventory stock and release Credit Notes."
        />
      </Card>

      {/* Selected Return Details Drawer */}
      {selectedReturn && (
        <div className={styles.p20}>
          <div className="ui-flex-between">
            <h3 className="ui-heading-lg">Return Summary</h3>
            <button onClick={() => setSelectedReturn(null)} className="ui-btn-icon ui-text-muted">
              <X size={20} />
            </button>
          </div>

          <div>
            <div className={styles.p21}>{selectedReturn.returnNumber}</div>
            <div className={styles.p22}>Customer: {selectedReturn.customerName}</div>
          </div>

          <div className={styles.p23}>
            <div className="ui-flex-between">
              <span className="ui-text-muted">Original Order:</span>
              <span className="font-semibold">{selectedReturn.orderNumber}</span>
            </div>
            <div className="ui-flex-between">
              <span className="ui-text-muted">Credit Note Issued:</span>
              <span className={styles.p24}>Active (CN-SR)</span>
            </div>
            <div className="ui-flex-between">
              <span className="ui-text-muted">Return Date:</span>
              <span>{new Date(selectedReturn.returnDate).toLocaleString()}</span>
            </div>
            <div className="ui-flex-between">
              <span className="ui-text-muted">Stock Status:</span>
              <span className={styles.p25}>Restocked</span>
            </div>
            <div className="ui-flex-between">
              <span className="ui-text-muted">Total Credit Amount:</span>
              <span className="ui-heading-lg">${selectedReturn.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Log Return Modal */}
      {isModalOpen && (
        <div className={styles.p26}>
          <div className={styles.p27}>
            <div className={styles.p28}>
              <h3 className="ui-heading-base">Log Customer Return & Issue Credit Note</h3>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted">
                <X size={18} />
              </button>
            </div>

            {modalSuccess ? (
              <div className={styles.p29}>
                <RotateCcw size={48} className={styles.p30} />
                <div className="ui-heading-base">Return Slips Created Successfully</div>
                <div className="ui-text-sm-muted">The inventory items have been restocked, and a Credit Note was generated.</div>
              </div>
            ) : (
              <form onSubmit={handleCreateReturn} className={styles.p31}>
                <div className="ui-grid-2">
                  <div className="ui-form-group">
                    <label className={styles.p32}>Return Reference No.</label>
                    <input
                      type="text"
                      required
                      value={returnNumber}
                      onChange={(e) => setReturnNumber(e.target.value)}
                      className={["ui-input", styles.p33].join(' ')}

                    />
                  </div>

                  <div className="ui-form-group">
                    <label className={styles.p34}>Select Sales Order</label>
                    <select
                      required
                      value={salesOrderId}
                      onChange={(e) => handleOrderChange(e.target.value)}
                      className={["ui-input", styles.p35].join(' ')}

                    >
                      <option value="">-- Choose Sales Order --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>{o.orderNumber} ({o.customerName})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ui-form-group">
                  <label className={styles.p36}>Return Reason</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Broken packaging, defective materials, customer change of mind..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={["ui-input", styles.p37].join(' ')}

                  />
                </div>

                <div>
                  <label className={styles.p38}>Line Items to Return</label>
                  {loadingOrderItems ? (
                    <div className={styles.p39}>
                      <Spinner size="md" />
                    </div>
                  ) : lineItems.length === 0 ? (
                    <div className={styles.p40}>
                      Please select a Sales Order to populate return items.
                    </div>
                  ) : (
                    <div className={styles.p41}>
                      <table className={styles.p42}>
                        <thead>
                          <tr className={styles.p43}>
                            <th className={styles.p44}>Description</th>
                            <th className={styles.p45}>Qty</th>
                            <th className={styles.p46}>Unit Price</th>
                            <th className={styles.p47}>Tax (%)</th>
                            <th className={styles.p48}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, index) => {
                            const total = item.quantity * item.unitPrice * (1 + item.taxRate / 100);
                            return (
                              <tr key={index} style={{ borderBottom: index < lineItems.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                <td className="p-2">{item.description}</td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const updated = [...lineItems];
                                      updated[index]!.quantity = Number(e.target.value);
                                      setLineItems(updated);
                                    }}
                                    className={styles.p49}
                                  />
                                </td>
                                <td className={styles.p50}>${item.unitPrice.toLocaleString()}</td>
                                <td className={styles.p51}>{item.taxRate}%</td>
                                <td className={styles.p52}>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className={styles.p53}>
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={submitting || lineItems.length === 0}>
                    {submitting ? 'Registering Return...' : 'Complete Return'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
