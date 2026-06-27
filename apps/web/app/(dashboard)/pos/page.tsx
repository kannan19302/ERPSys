'use client';

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
import { Card, PageHeader, Button, Spinner, DashboardKPICard, DashboardChart, ViewSwitcher, type ViewMode } from '@unerp/ui';

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
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load terminals
      const tRes = await fetch('/api/v1/pos/terminals', { headers });
      const tData = await tRes.json();
      setTerminals(Array.isArray(tData) ? tData : []);
      if (tData.length > 0) {
        setSelectedTerminal(tData[0].id);
      }

      // Load registers
      const rRes = await fetch('/api/v1/pos/registers', { headers });
      const rData = await rRes.json();
      const active = rData.find((reg: POSRegister) => reg.status === 'OPEN');
      if (active) setActiveRegister(active);

      // Load products
      const pRes = await fetch('/api/v1/inventory/products', { headers });
      const pData = await pRes.json();
      setProducts(Array.isArray(pData) ? pData : []);
    } catch {
      // Silent error
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRegister = async () => {
    if (!selectedTerminal) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/pos/registers/open', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ terminalId: selectedTerminal, startingCash })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRegister(data);
        loadData();
      } else {
        alert(data.message || 'Failed to open register.');
      }
    } catch {
      alert('Error opening register.');
    }
  };

  const handleCloseRegister = async () => {
    if (!activeRegister) return;
    const endingCash = prompt('Enter Ending Cash Amount:', '250');
    if (!endingCash) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/pos/registers/${activeRegister.id}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endingCash: parseFloat(endingCash), actualCash: parseFloat(endingCash) })
      });
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
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/pos/registers/${activeRegister.id}/shifts/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentShift(data);
        setShiftOpen(true);
      } else {
        alert(data.message);
      }
    } catch {
      alert('Error starting shift.');
    }
  };

  const handleEndShift = async () => {
    if (!currentShift) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/pos/shifts/${currentShift.id}/end`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <PageHeader
        title="Point of Sale Terminal"
        description="Run retail counter checkout, handle registers, open cash sessions, and log staff shifts."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'POS' }]}
      />

      {/* Check Register Status */}
      {!activeRegister ? (
        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)'
        }}>
          <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', textAlign: 'center' }}>
            <CircleDollarSign size={48} style={{ color: 'var(--color-primary)', alignSelf: 'center' }} />
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Open Cash Session</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Configure a terminal counter and set starting drawer cash to log transactions.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Select Terminal</label>
                <select 
                  value={selectedTerminal} 
                  onChange={(e) => setSelectedTerminal(e.target.value)}
                  style={{
                    width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)'
                  }}
                  className="frappe-input"
                >
                  {terminals.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Starting Cash ($)</label>
                <input 
                  type="number" 
                  value={startingCash}
                  onChange={(e) => setStartingCash(parseFloat(e.target.value))}
                  style={{
                    width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)'
                  }}
                  className="frappe-input"
                />
              </div>
            </div>

            <button 
              onClick={handleOpenRegister}
              style={{
                background: 'var(--color-primary)', color: 'var(--color-bg-elevated)', border: 'none',
                padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)'
              }}
              className="frappe-btn frappe-btn-primary"
            >
              Open Register
            </button>
          </div>
        </div>
      ) : (
        /* POS Layout */
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 3fr', gap: 'var(--space-6)', overflow: 'hidden' }}>
          
          {/* Products Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              
              {/* POS Switcher */}
              <div style={{ display: 'flex', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
                <button 
                  onClick={() => setPosViewMode('checkout')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', border: 'none',
                    background: posViewMode === 'checkout' ? 'var(--color-bg-elevated)' : 'transparent',
                    color: posViewMode === 'checkout' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'bold'
                  }}
                >
                  <List size={14} /> Checkout
                </button>
                <button 
                  onClick={() => setPosViewMode('analytics')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', border: 'none',
                    background: posViewMode === 'analytics' ? 'var(--color-bg-elevated)' : 'transparent',
                    color: posViewMode === 'analytics' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'bold'
                  }}
                >
                  <BarChart3 size={14} /> View Analytics
                </button>
              </div>

              {posViewMode === 'checkout' && (
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    placeholder="Scan barcode or type product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-9)',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)', color: 'var(--color-text)', fontSize: 'var(--text-sm)'
                    }}
                    className="frappe-input"
                  />
                </div>
              )}
              
              {/* Shift tracker action */}
              {!shiftOpen ? (
                <button onClick={handleStartShift} style={{
                  background: 'var(--color-primary)', border: 'none', color: 'var(--color-bg-elevated)',
                  padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)'
                }} className="frappe-btn frappe-btn-primary">
                  <Coffee size={14} /> Start Shift
                </button>
              ) : (
                <button onClick={handleEndShift} style={{
                  background: 'var(--color-warning)', border: 'none', color: 'var(--color-bg-elevated)',
                  padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)'
                }} className="frappe-btn">
                  <Coffee size={14} /> End Shift
                </button>
              )}

              <button onClick={handleCloseRegister} style={{
                background: 'var(--color-danger)', border: 'none', color: 'var(--color-bg-elevated)',
                padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 'var(--text-xs)', fontWeight: 'bold'
              }} className="frappe-btn">
                Close Drawer
              </button>
            </div>

            {posViewMode === 'checkout' ? (
              /* Grid list of products */
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)', overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
                {filteredProducts.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => addToCart(p)}
                    style={{
                      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex',
                      flexDirection: 'column', justifyItems: 'space-between', cursor: 'pointer',
                      transition: 'border-color var(--duration-fast)', gap: 'var(--space-3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>{p.sku}</span>
                      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 'var(--space-1) 0 0 0' }}>{p.name}</h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        ${parseFloat(p.sellPrice).toFixed(2)}
                      </span>
                      <Plus size={16} style={{ color: 'var(--color-text-secondary)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Analytics View */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                  <DashboardKPICard title="Session Sales" value={`$${totalSalesRevenue.toFixed(2)}`} icon={<CircleDollarSign size={18} />} color="var(--color-success)"
                    drillDown={{
                      modalTitle: 'Shift Completed Sales',
                      columns: [
                        { key: 'id', label: 'Sale ID' },
                        { key: 'date', label: 'Time' },
                        { key: 'itemsCount', label: 'Items Sold' },
                        { key: 'total', label: 'Sale Amount', render: (v) => `$${Number(v).toFixed(2)}` }
                      ],
                      rows: salesHistory.map(s => ({ ...s }))
                    }}
                  />
                  <DashboardKPICard title="Drawer Cash Balance" value={`$${drawerBalance.toFixed(2)}`} icon={<CreditCard size={18} />} color="var(--color-primary)"
                    drillDown={{
                      modalTitle: 'Drawer Cash Reconciliation',
                      columns: [
                        { key: 'label', label: 'Type' },
                        { key: 'amount', label: 'Amount', render: (v) => `$${Number(v).toFixed(2)}` }
                      ],
                      rows: [
                        { label: 'Starting Cash Float', amount: startingCash },
                        { label: 'Session Sales Cash', amount: totalSalesRevenue },
                        { label: 'Total Current Cash', amount: drawerBalance }
                      ]
                    }}
                  />
                  <DashboardKPICard title="Total Items Sold" value={String(totalItemsSold)} icon={<ShoppingCart size={18} />} color="var(--color-info-text)"
                    drillDown={{
                      modalTitle: 'Sold Items Metrics',
                      columns: [
                        { key: 'id', label: 'Sale ID' },
                        { key: 'date', label: 'Time' },
                        { key: 'itemsCount', label: 'Items Count' }
                      ],
                      rows: salesHistory.map(s => ({ ...s }))
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
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
                    config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Price', color: '#10b981' }] }}
                    defaultChartType="bar"
                    allowedChartTypes={['bar', 'donut']}
                    height={220}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Column */}
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <ShoppingCart size={18} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Checkout Cart</h2>
              <span style={{ marginLeft: 'auto', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: 'var(--space-1) var(--space-2)', borderRadius: '50%', fontSize: '10px', fontWeight: 'bold' }}>
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>

            {/* Cart Items list */}
            <div style={{ flex: 1, padding: 'var(--space-4)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>${parseFloat(item.sellPrice).toFixed(2)} each</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', padding: '2px' }}><Minus size={12} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', padding: '2px' }}><Plus size={12} /></button>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', justifyContent: 'center' }}>
                  Cart is empty. Tap items to checkout.
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <span>Subtotal</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <span>VAT (10%)</span>
                <span>${getTax().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 'bold', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--color-primary)' }}>${getTotal().toFixed(2)}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                style={{
                  background: cart.length > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'var(--color-bg-elevated)', border: 'none', padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-lg)', cursor: cart.length > 0 ? 'pointer' : 'default',
                  fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)'
                }}
              >
                <CreditCard size={18} /> Checkout
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
