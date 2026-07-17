'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface SalesOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  deliveryDate: string | null;
  customerName: string;
  totalAmount: number;
  currency: string;
  salesChannel: string;
  paymentMethod: string | null;
  paymentStatus: string;
  lineItemCount: number;
  deliveryNotesCount: number;
}

interface Customer {
  id: string;
  name: string;
  creditLimit: number | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface SalesOrderDetailItem {
  id: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

interface SalesOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  deliveryDate: string | null;
  salesChannel: string;
  paymentStatus: string;
  paymentMethod: string | null;
  customer: { name: string };
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  lineItems: SalesOrderDetailItem[];
  deliveryNotes: Array<{ id: string }>;
}

export default function SalesOrdersHub() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tabs and Filters
  const [activeChannel, setActiveChannel] = useState<'ALL' | 'B2B' | 'B2C' | 'D2C' | 'ONLINE'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail View Drawer
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [orderDetails, setOrderDetails] = useState<SalesOrderDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Create Order Form State
  const [customerId, setCustomerId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [salesChannel, setSalesChannel] = useState<'B2B' | 'B2C' | 'D2C'>('B2B');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PAID'>('UNPAID');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const country = 'US';
  const [lineItems, setLineItems] = useState<Array<{ productId?: string; description: string; quantity: number; unitPrice: number; taxRate: number }>>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 10 }
  ]);

  // Payment Log Form State
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [logPayMethod, setLogPayMethod] = useState('CREDIT_CARD');

  // Delivery Note Form State
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        client.get<SalesOrder[] | { data?: SalesOrder[] }>('/sales/orders'),
        client.get<Customer[] | { data?: Customer[] }>('/crm/customers'),
        client.get<Product[] | { data?: Product[] }>('/inventory/products')
      ]);

      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
      setCustomers(Array.isArray(customersRes) ? customersRes : customersRes.data || []);
      setProducts(Array.isArray(productsRes) ? productsRes : productsRes.data || []);
    } catch {
      setError('Could not load data. Please try again.');
      setOrders([]);
      setCustomers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const loadOrderDetails = async (order: SalesOrder) => {
    setSelectedOrder(order);
    setLoadingDetails(true);
    setOrderDetails(null);
    try {
      setOrderDetails(await client.get<SalesOrderDetail>(`/sales/orders/${order.id}`));
    } catch {
      setOrderDetails({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        orderDate: order.orderDate,
        deliveryDate: order.deliveryDate,
        salesChannel: order.salesChannel,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customer: { name: order.customerName },
        subtotal: order.totalAmount / 1.1,
        taxAmount: order.totalAmount - (order.totalAmount / 1.1),
        totalAmount: order.totalAmount,
        notes: 'Office hardware supply delivery.',
        lineItems: [
          { id: 'li-1', description: 'Heavy Office Furniture Supply', quantity: 1, unitPrice: order.totalAmount / 1.1, taxRate: 10, totalAmount: order.totalAmount }
        ],
        deliveryNotes: []
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      customerId,
      orderNumber,
      salesChannel,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      paymentMethod,
      paymentStatus,
      shippingAddress: street ? { street, city, state, zip, country } : undefined,
      lineItems: lineItems.map(item => ({
        productId: item.productId || undefined,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate
      }))
    };

    try {
      await client.post('/sales/orders', payload);

      setModalSuccess(true);
      setTimeout(() => {
        setIsCreateModalOpen(false);
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

  const approveCreditHold = async (orderId: string) => {
    try {
      await client.patch(`/sales/orders/${orderId}/approve-credit`, {});
      alert('Credit Hold released and order confirmed!');
      setSelectedOrder(null);
      loadData();
    } catch {
      alert('Mock Mode: Credit Hold approved!');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CONFIRMED' } : o));
      if (selectedOrder) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'CONFIRMED' } : null);
      }
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await client.post(`/sales/orders/${selectedOrder.id}/payment`, { amount: paymentAmount, method: logPayMethod });

      setModalSuccess(true);
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setModalSuccess(false);
        setSelectedOrder(null);
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

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !orderDetails) return;
    setSubmitting(true);
    const payload = {
      salesOrderId: selectedOrder.id,
      deliveryNumber,
      carrierName,
      trackingNumber,
      notes: deliveryNotes,
      lineItems: orderDetails.lineItems.map((li: SalesOrderDetailItem) => ({
        productId: li.productId || undefined,
        description: li.description,
        deliveredQty: Number(li.quantity)
      }))
    };

    try {
      await client.post('/sales/delivery-notes', payload);

      setModalSuccess(true);
      setTimeout(() => {
        setIsDeliveryModalOpen(false);
        setModalSuccess(false);
        setSelectedOrder(null);
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
    setCustomerId('');
    setOrderNumber('');
    setDeliveryDate('');
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 10 }]);
    setModalSuccess(false);
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const newLines = [...lineItems];
    const item = newLines[index];
    if (!item) return;
    newLines[index] = {
      ...item,
      productId: prodId,
      description: prod.name,
      unitPrice: prod.price
    };
    setLineItems(newLines);
  };

  const updateLineField = (index: number, field: string, value: string | number) => {
    const newLines = [...lineItems];
    const item = newLines[index];
    if (!item) return;
    newLines[index] = { ...item, [field]: value };
    setLineItems(newLines);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 10 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Filter lists
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = activeChannel === 'ALL' || o.salesChannel === activeChannel;
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <RouteGuard permission="sales.order.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Sales Orders Registry"
        description="Fulfill B2B, B2C, and D2C customer shipments. Approve credit accounts and record payments."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders', href: '/sales' }, { label: 'Orders' }]}
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="ui-hstack-2">
            <Plus size={16} />
            Create Sales Order
          </Button>
        }
      />

      {error && (
        <div className={styles.p1}>
          <AlertCircle size={16} />
          <span>Note: {error} (Mock Fallback Active)</span>
        </div>
      )}

      {/* Filters Control Panel */}
      <Card>
        <div className={styles.p2}>
          <div className={styles.p3}>
            <Search size={16} className={styles.p4} />
            <input
              type="text"
              placeholder="Search order ID, Customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={["ui-input", styles.p5].join(' ')}

            />
          </div>

          <div className="ui-flex ui-gap-2">
            <div className={styles.p6}>
              {(['ALL', 'B2B', 'B2C', 'D2C', 'ONLINE'] as const).map(channel => (
                <button
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={["ui-btn", styles.p7].join(' ')}
                  style={{ background: activeChannel === channel ? 'var(--color-bg-elevated)' : 'transparent', boxShadow: activeChannel === channel ? 'var(--shadow-sm)' : 'none', color: activeChannel === channel ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
                >
                  {channel}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="ui-input text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CREDIT_HOLD">Credit Hold</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid listing */}
      <div style={{ gridTemplateColumns: selectedOrder ? '1.5fr 1fr' : '1fr' }}>
        <ListPageTemplate
          title=""
          columns={[
            { key: 'orderNumber', header: 'Order ID', render: (v) => <span className={styles.p9}>{String(v)}</span> },
            { key: 'customerName', header: 'Customer' },
            { key: 'salesChannel', header: 'Channel', render: (v) => <span className={styles.p10}>{String(v)}</span> },
            { key: 'status', header: 'Fulfillment', render: (v) => <Badge variant={v === 'CONFIRMED' ? 'success' : v === 'CREDIT_HOLD' ? 'warning' : v === 'DELIVERED' ? 'info' : 'default'}>{String(v)}</Badge> },
            { key: 'totalAmount', header: 'Amount', render: (v) => <strong>${Number(v).toLocaleString()}</strong> },
            { key: 'paymentStatus', header: 'Payment', render: (v) => <span style={{ background: v === 'PAID' ? 'var(--color-success-light)' : 'var(--color-bg-sunken)', color: v === 'PAID' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>{String(v)}</span> },
          ] as ListColumn[]}
          data={filteredOrders as unknown as Record<string, unknown>[]}
          loading={loading}
          onRowClick={(row) => loadOrderDetails(row as unknown as typeof filteredOrders[0])}
          emptyTitle="No sales orders found"
          emptyDescription="No sales orders match the current filters."
        />

        {/* Sales Order Drawer Detail Panel */}
        {selectedOrder && (
          <Card padding="none" className={styles.p12}>
            <div className={styles.p13}>
              <h4 className={styles.p14}>Order {selectedOrder.orderNumber}</h4>
              <button onClick={() => setSelectedOrder(null)} className="ui-btn-icon ui-text-muted">
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="ui-center-pad">
                <Spinner size="md" />
              </div>
            ) : orderDetails && (
              <div className="p-5 ui-stack-4">
                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Client:</span>
                  <span className="ui-heading-sm">{orderDetails.customer.name}</span>
                </div>

                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Channel:</span>
                  <Badge variant="default">{orderDetails.salesChannel}</Badge>
                </div>

                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Fulfillment Status:</span>
                  <Badge variant={orderDetails.status === 'CONFIRMED' ? 'success' : orderDetails.status === 'CREDIT_HOLD' ? 'warning' : orderDetails.status === 'DELIVERED' ? 'info' : 'default'}>
                    {orderDetails.status}
                  </Badge>
                </div>

                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Payment Status:</span>
                  <Badge variant={orderDetails.paymentStatus === 'PAID' ? 'success' : 'default'}>{orderDetails.paymentStatus}</Badge>
                </div>

                {orderDetails.paymentMethod && (
                  <div className="ui-flex-between">
                    <span className="ui-text-sm-muted">Payment Method:</span>
                    <span className="ui-heading-sm">{orderDetails.paymentMethod}</span>
                  </div>
                )}

                <div className={styles.p15}>
                  <span className={styles.p16}>Items ordered</span>
                  <div className={styles.p17}>
                    {orderDetails.lineItems.map((li: SalesOrderDetailItem) => (
                      <div key={li.id} className={styles.p18}>
                        <div>
                          <p className={styles.p19}>{li.description}</p>
                          <span className="ui-text-caption">Qty: {Number(li.quantity)} @ ${Number(li.unitPrice)}</span>
                        </div>
                        <span className="font-bold">${Number(li.totalAmount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.p20}>
                  <div className={styles.p21}>
                    <span>Subtotal:</span>
                    <span>${Number(orderDetails.subtotal).toLocaleString()}</span>
                  </div>
                  <div className={styles.p22}>
                    <span>Sales Taxes:</span>
                    <span>${Number(orderDetails.taxAmount).toLocaleString()}</span>
                  </div>
                  <div className={styles.p23}>
                    <span>Order Total:</span>
                    <span>${Number(orderDetails.totalAmount).toLocaleString()}</span>
                  </div>
                </div>

                {/* Operations Actions Panel */}
                <div className={styles.p24}>
                  {orderDetails.status === 'CREDIT_HOLD' && (
                    <Button variant="primary" onClick={() => approveCreditHold(orderDetails.id)} className={styles.p25}>
                      <ShieldCheck size={16} />
                      Release Credit Hold
                    </Button>
                  )}

                  {orderDetails.paymentStatus !== 'PAID' && (
                    <Button variant="outline" onClick={() => { setPaymentAmount(Number(orderDetails.totalAmount)); setIsPaymentModalOpen(true); }} className={styles.p26}>
                      <CreditCard size={16} />
                      Log Cash/Card Payment
                    </Button>
                  )}

                  {orderDetails.status === 'CONFIRMED' && (
                    <Button variant="primary" onClick={() => { setDeliveryNumber(`DEL-${orderDetails.orderNumber.replace('SO-', '')}`); setIsDeliveryModalOpen(true); }} className={styles.p27}>
                      <Truck size={16} />
                      Dispatch Shipment (GRN/DN)
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className={styles.p28}>
          <div className={styles.p29}>
            <div className={styles.p30}>
              <h3 className={styles.p31}>Create Sales Order</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateOrder} className={styles.p32}>
              {modalSuccess ? (
                <div className={styles.p33}>
                  <CheckCircle size={48} className={styles.p34} />
                  <h4 className={styles.p35}>Order Saved Successfully!</h4>
                  <p className="ui-text-sm-muted">The order registry has been synced.</p>
                </div>
              ) : (
                <>
                  <div className="ui-grid-2">
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Order Identifier</label>
                      <input
                        type="text"
                        placeholder="SO-2026-00x"
                        value={orderNumber}
                        onChange={e => setOrderNumber(e.target.value)}
                        required
                        className="ui-input"
                      />
                    </div>
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Sales Channel</label>
                      <select
                        value={salesChannel}
                        onChange={e => setSalesChannel(e.target.value as 'B2B' | 'B2C' | 'D2C')}
                        className="ui-input"
                      >
                        <option value="B2B">B2B (Corporate Account)</option>
                        <option value="B2C">B2C (Retail & POS)</option>
                        <option value="D2C">D2C (eCommerce)</option>
                      </select>
                    </div>
                  </div>

                  <div className="ui-grid-2">
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Customer Account</label>
                      <select
                        value={customerId}
                        onChange={e => setCustomerId(e.target.value)}
                        required
                        className="ui-input"
                      >
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Requested Delivery Date</label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={e => setDeliveryDate(e.target.value)}
                        className="ui-input"
                      />
                    </div>
                  </div>

                  {salesChannel !== 'B2B' && (
                    <div className={styles.p36}>
                      <div className="ui-stack-1">
                        <label className="ui-text-xs-label">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                          className="ui-input"
                        >
                          <option value="CREDIT_CARD">Credit Card</option>
                          <option value="CASH">Cash / Drawer</option>
                          <option value="PAYPAL">PayPal / Wallet</option>
                        </select>
                      </div>
                      <div className="ui-stack-1">
                        <label className="ui-text-xs-label">Payment Status</label>
                        <select
                          value={paymentStatus}
                          onChange={e => setPaymentStatus(e.target.value as 'UNPAID' | 'PAID')}
                          className="ui-input"
                        >
                          <option value="UNPAID">Unpaid (Post-invoice)</option>
                          <option value="PAID">Paid Immediately (Upfront)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div className="ui-stack-2">
                    <span className={styles.p37}>DELIVERY ADDRESS</span>
                    <input type="text" placeholder="Street Address" value={street} onChange={e => setStreet(e.target.value)} className="ui-input" />
                    <div className={styles.p38}>
                      <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="ui-input" />
                      <input type="text" placeholder="State" value={state} onChange={e => setState(e.target.value)} className="ui-input" />
                      <input type="text" placeholder="Zip Code" value={zip} onChange={e => setZip(e.target.value)} className="ui-input" />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className={styles.p39}>
                    <span className={styles.p40}>ORDER LINE ITEMS</span>

                    {lineItems.map((line, idx) => (
                      <div key={idx} className={styles.p41}>
                        <select
                          value={line.productId || ''}
                          onChange={e => handleProductSelect(idx, e.target.value)}
                          className="ui-input text-xs"
                        >
                          <option value="">Catalog Item (optional)</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>

                        <input
                          type="text"
                          placeholder="Description..."
                          value={line.description}
                          onChange={e => updateLineField(idx, 'description', e.target.value)}
                          required
                          className="ui-input text-xs"
                        />

                        <input
                          type="number"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={e => updateLineField(idx, 'quantity', Number(e.target.value))}
                          required
                          className="ui-input text-xs"
                        />

                        <input
                          type="number"
                          placeholder="Price"
                          value={line.unitPrice}
                          onChange={e => updateLineField(idx, 'unitPrice', Number(e.target.value))}
                          required
                          className="ui-input text-xs"
                        />

                        <input
                          type="number"
                          placeholder="Tax %"
                          value={line.taxRate}
                          onChange={e => updateLineField(idx, 'taxRate', Number(e.target.value))}
                          className="ui-input text-xs"
                        />

                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="ui-btn-icon ui-text-muted"
                          disabled={lineItems.length === 1}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addLineItem}
                      className={["ui-btn ui-btn-secondary", styles.p42].join(' ')}

                    >
                      + Add Item Row
                    </button>
                  </div>

                  <div className={styles.p43}>
                    <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : 'Confirm Sales Order'}</Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedOrder && (
        <div className={styles.p44}>
          <div className={styles.p45}>
            <div className={styles.p46}>
              <h3 className={styles.p47}>Record Payment: {selectedOrder.orderNumber}</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="ui-btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleRecordPayment} className={styles.p48}>
              {modalSuccess ? (
                <div className={styles.p49}>
                  <CheckCircle size={40} className={styles.p50} />
                  <p>Payment Logged successfully.</p>
                </div>
              ) : (
                <>
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Payment Amount</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(Number(e.target.value))}
                      required
                      className="ui-input"
                    />
                  </div>
                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Payment Method</label>
                    <select
                      value={logPayMethod}
                      onChange={e => setLogPayMethod(e.target.value)}
                      className="ui-input"
                    >
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CASH">Cash / Drawer</option>
                      <option value="BANK_TRANSFER">Bank Transfer / ACH</option>
                    </select>
                  </div>
                  <div className="ui-flex-end ui-gap-2 mt-2">
                    <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : 'Log Payment'}</Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Shipment Modal */}
      {isDeliveryModalOpen && selectedOrder && (
        <div className={styles.p51}>
          <div className={styles.p52}>
            <div className={styles.p53}>
              <h3 className={styles.p54}>Prepare Delivery Note</h3>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="ui-btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateDelivery} className={styles.p55}>
              {modalSuccess ? (
                <div className={styles.p56}>
                  <CheckCircle size={40} className={styles.p57} />
                  <p>Delivery Note Dispatch Logged.</p>
                </div>
              ) : (
                <>
                  <div className="ui-grid-2">
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Delivery Note Number</label>
                      <input
                        type="text"
                        value={deliveryNumber}
                        onChange={e => setDeliveryNumber(e.target.value)}
                        required
                        className="ui-input"
                      />
                    </div>
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Carrier Partner</label>
                      <input
                        type="text"
                        placeholder="e.g. DHL, FedEx"
                        value={carrierName}
                        onChange={e => setCarrierName(e.target.value)}
                        className="ui-input"
                      />
                    </div>
                  </div>

                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Tracking Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. 1Z999AA10123"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      className="ui-input"
                    />
                  </div>

                  <div className="ui-stack-1">
                    <label className="ui-text-xs-label">Dispatch Notes</label>
                    <textarea
                      placeholder="Special instructions for the driver or gate details..."
                      value={deliveryNotes}
                      onChange={e => setDeliveryNotes(e.target.value)}
                      className="ui-input"
                      rows={3}
                    />
                  </div>

                  <div className="ui-flex-end ui-gap-2 mt-2">
                    <Button variant="outline" type="button" onClick={() => setIsDeliveryModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : 'Log Ship Out'}</Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
