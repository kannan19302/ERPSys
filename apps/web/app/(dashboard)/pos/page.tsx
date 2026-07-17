'use client';

import styles from './page.module.css';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Search,
  CircleDollarSign,
  Coffee,
  BarChart3,
  List
} from 'lucide-react';
import { Card, PageHeader, Button, Spinner, DashboardChart, ViewSwitcher, StatCardRow, type ViewMode } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface POSTerminal {
  id: string;
  name: string;
  code: string;
}

interface POSRegister {
  id: string;
  terminalId: string;
  status: string;
}

interface POSProduct {
  id: string;
  name: string;
  sku: string;
  sellPrice: string;
}

interface CartItem extends POSProduct {
  quantity: number;
}

interface POSShift {
  id: string;
  registerId: string;
  employeeId: string;
}

export default function POSPage() {
  const client = useApiClient();
  const [terminals, setTerminals] = useState<POSTerminal[]>([]);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Register state
  const [selectedTerminal, setSelectedTerminal] = useState<string>('');
  const [startingCash, setStartingCash] = useState<number>(200);
  const [activeRegister, setActiveRegister] = useState<POSRegister | null>(null);
  const [employeeId] = useState<string>('emp-system-default');
  const [shiftOpen, setShiftOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<POSShift | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // POS view toggling: 'checkout' vs 'analytics'
  const [posViewMode, setPosViewMode] = useState<'checkout' | 'analytics'>('checkout');

  // Completed transactions tracking (simulated for charts)
  const [salesHistory, setSalesHistory] = useState<Array<{ id: string; total: number; itemsCount: number; date: string }>>([
    { id: '1', total: 45.90, itemsCount: 3, date: '10:00 AM' },
    { id: '2', total: 120.50, itemsCount: 5, date: '10:30 AM' },
    { id: '3', total: 15.00, itemsCount: 1, date: '11:15 AM' },
  ]);

  const loadData = async () => {
    try {
      // Load terminals
      const tData = await client.get<POSTerminal[]>('/pos/terminals');
      setTerminals(Array.isArray(tData) ? tData : []);
      const firstTerminal = tData[0];
      if (firstTerminal) setSelectedTerminal(firstTerminal.id);

      // Load registers
      const rData = await client.get<POSRegister[]>('/pos/registers');
      const active = rData.find((reg: POSRegister) => reg.status === 'OPEN');
      if (active) setActiveRegister(active);

      // Load products
      const pData = await client.get<POSProduct[]>('/inventory/products');
      setProducts(Array.isArray(pData) ? pData : []);
    } catch {
      // Silent error
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleOpenRegister = async () => {
    if (!selectedTerminal) return;
    try {
      const data = await client.post<POSRegister>('/pos/registers/open', { terminalId: selectedTerminal, startingCash });
      setActiveRegister(data);
      loadData();
    } catch {
      alert('Error opening register.');
    }
  };

  const handleCloseRegister = async () => {
    if (!activeRegister) return;
    const endingCash = prompt('Enter Ending Cash Amount:', '250');
    if (!endingCash) return;
    try {
      await client.request(`/pos/registers/${activeRegister.id}/close`, { method: 'PUT', body: JSON.stringify({ endingCash: parseFloat(endingCash), actualCash: parseFloat(endingCash) }) });
      setActiveRegister(null);
      setShiftOpen(false);
      loadData();
    } catch {
      alert('Error closing register.');
    }
  };

  const handleStartShift = async () => {
    if (!activeRegister) return;
    try {
      const data = await client.post<POSShift>(`/pos/registers/${activeRegister.id}/shifts/start`, { employeeId });
      setCurrentShift(data);
      setShiftOpen(true);
    } catch {
      alert('Error starting shift.');
    }
  };

  const handleEndShift = async () => {
    if (!currentShift) return;
    try {
      await client.request(`/pos/shifts/${currentShift.id}/end`, { method: 'PUT' });
      setShiftOpen(false);
      setCurrentShift(null);
      alert('Shift ended successfully.');
    } catch {
      alert('Error ending shift.');
    }
  };

  // Cart Management
  const addToCart = (product: POSProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, amount: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = item.quantity + amount;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getSubtotal = () => cart.reduce((acc, item) => acc + (parseFloat(item.sellPrice) * item.quantity), 0);
  const getTax = () => getSubtotal() * 0.1;
  const getTotal = () => getSubtotal() + getTax();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const finalTotal = getTotal();
    const finalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Add to history
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSalesHistory(prev => [...prev, { id: Date.now().toString(), total: finalTotal, itemsCount: finalCount, date: nowStr }]);

    alert(`Checkout complete! Total Paid: $${finalTotal.toFixed(2)}`);
    setCart([]);
  };

  // Computations
  const totalSalesRevenue = useMemo(() => salesHistory.reduce((sum, s) => sum + s.total, 0), [salesHistory]);
  const totalItemsSold = useMemo(() => salesHistory.reduce((sum, s) => sum + s.itemsCount, 0), [salesHistory]);
  const drawerBalance = startingCash + totalSalesRevenue;

  // Chart data
  const hourlySalesData = useMemo(() => {
    return salesHistory.map(s => ({
      name: s.date,
      value: s.total
    }));
  }, [salesHistory]);

  const productDistributionData = useMemo(() => {
    return products.slice(0, 5).map(p => ({
      name: p.name.substring(0, 12),
      value: parseFloat(p.sellPrice)
    }));
  }, [products]);

  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RouteGuard permission="pos.read">
    <div className={styles.p1}>
      {/* Header */}
      <PageHeader
        title="Point of Sale Terminal"
        description="Run retail counter checkout, handle registers, open cash sessions, and log staff shifts."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'POS' }]}
      />

      {/* Check Register Status */}
      {!activeRegister ? (
        <div className={styles.p2}>
          <div className={styles.p3}>
            <CircleDollarSign size={48} className={styles.p4} />
            <h2 className="ui-heading-lg">Open Cash Session</h2>
            <p className="ui-text-sm-muted">
              Configure a terminal counter and set starting drawer cash to log transactions.
            </p>

            <div className={styles.p5}>
              <div>
                <label className={styles.p6}>Select Terminal</label>
                <select
                  value={selectedTerminal}
                  onChange={(e) => setSelectedTerminal(e.target.value)}

                  className={["ui-input", styles.p7].join(' ')}
                >
                  {terminals.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.p8}>Starting Cash ($)</label>
                <input
                  type="number"
                  value={startingCash}
                  onChange={(e) => setStartingCash(parseFloat(e.target.value))}

                  className={["ui-input", styles.p9].join(' ')}
                />
              </div>
            </div>

            <button
              onClick={handleOpenRegister}

              className={["ui-btn ui-btn-primary", styles.p10].join(' ')}
            >
              Open Register
            </button>
          </div>
        </div>
      ) : (
        /* POS Layout */
        <div className={styles.p11}>

          {/* Products Column */}
          <div className={styles.p12}>
            <div className="ui-flex ui-gap-3">

              {/* POS Switcher */}
              <div className={styles.p13}>
                <button
                  onClick={() => setPosViewMode('checkout')}
                  style={{ background: posViewMode === 'checkout' ? 'var(--color-bg-elevated)' : 'transparent', color: posViewMode === 'checkout' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                >
                  <List size={14} /> Checkout
                </button>
                <button
                  onClick={() => setPosViewMode('analytics')}
                  style={{ background: posViewMode === 'analytics' ? 'var(--color-bg-elevated)' : 'transparent', color: posViewMode === 'analytics' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                >
                  <BarChart3 size={14} /> View Analytics
                </button>
              </div>

              {posViewMode === 'checkout' && (
                <div className={styles.p16}>
                  <Search size={16} className={styles.p17} />
                  <input
                    type="text"
                    placeholder="Scan barcode or type product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}

                    className={["ui-input", styles.p18].join(' ')}
                  />
                </div>
              )}

              {/* Shift tracker action */}
              {!shiftOpen ? (
                <button onClick={handleStartShift}  className={["ui-btn ui-btn-primary", styles.p19].join(' ')}>
                  <Coffee size={14} /> Start Shift
                </button>
              ) : (
                <button onClick={handleEndShift}  className={["ui-btn", styles.p20].join(' ')}>
                  <Coffee size={14} /> End Shift
                </button>
              )}

              <button onClick={handleCloseRegister}  className={["ui-btn", styles.p21].join(' ')}>
                Close Drawer
              </button>
            </div>

            {posViewMode === 'checkout' ? (
              /* Grid list of products */
              <div className={styles.p22}>
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={styles.p23}
                  >
                    <div>
                      <span className={styles.p24}>{p.sku}</span>
                      <h3 className={styles.p25}>{p.name}</h3>
                    </div>
                    <div className={styles.p26}>
                      <span className={styles.p27}>
                        ${parseFloat(p.sellPrice).toFixed(2)}
                      </span>
                      <Plus size={16} className="ui-text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Analytics View */
              <div className={styles.p28}>
                <StatCardRow columns={3} stats={[
                  { label: 'Session Sales', value: `$${totalSalesRevenue.toFixed(2)}`, icon: <CircleDollarSign size={16} />, color: 'var(--chart-2)' },
                  { label: 'Drawer Cash Balance', value: `$${drawerBalance.toFixed(2)}`, icon: <CreditCard size={16} />, color: 'var(--chart-1)' },
                  { label: 'Total Items Sold', value: totalItemsSold, icon: <ShoppingCart size={16} />, color: 'var(--chart-3)' },
                ]} />

                <div className="ui-grid-2">
                  <DashboardChart
                    title="Checkout Transactions timeline"
                    subtitle="Hourly sales recorded in active shift"
                    data={hourlySalesData}
                    config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Sale Total', color: 'var(--color-primary)' }] }}
                    defaultChartType="line"
                    allowedChartTypes={['line', 'bar']}
                    height={220}
                  />
                  <DashboardChart
                    title="Top Product Value"
                    subtitle="Product prices breakdown catalog"
                    data={productDistributionData}
                    config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Price', color: 'var(--color-success)' }] }}
                    defaultChartType="bar"
                    allowedChartTypes={['bar', 'donut']}
                    height={220}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Column */}
          <div className={styles.p29}>
            <div className={styles.p30}>
              <ShoppingCart size={18} className="ui-text-primary" />
              <h2 className={styles.p31}>Checkout Cart</h2>
              <span className={styles.p32}>
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>

            {/* Cart Items list */}
            <div className={styles.p33}>
              {cart.map(item => (
                <div key={item.id} className={styles.p34}>
                  <div className={styles.p35}>
                    <p className={styles.p36}>{item.name}</p>
                    <p className={styles.p37}>${parseFloat(item.sellPrice).toFixed(2)} each</p>
                  </div>
                  <div className="ui-hstack-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className={styles.p38}><Minus size={12} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className={styles.p39}><Plus size={12} /></button>
                    <button onClick={() => removeFromCart(item.id)} className={styles.p40}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className={styles.p41}>
                  Cart is empty. Tap items to checkout.
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className={styles.p42}>
              <div className={styles.p43}>
                <span>Subtotal</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              <div className={styles.p44}>
                <span>VAT (10%)</span>
                <span>${getTax().toFixed(2)}</span>
              </div>
              <div className={styles.p45}>
                <span>Total</span>
                <span className="ui-text-primary">${getTotal().toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                style={{ background: cart.length > 0 ? 'var(--color-primary)' : 'var(--color-border)', cursor: cart.length > 0 ? 'pointer' : 'default' }}
              >
                <CreditCard size={18} /> Checkout
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
