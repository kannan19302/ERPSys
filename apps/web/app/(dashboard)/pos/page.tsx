'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Search, 
  CircleDollarSign,
  Coffee
} from 'lucide-react';

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

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load terminals
      const tRes = await fetch('http://localhost:3001/pos/terminals', { headers });
      const tData = await tRes.json();
      setTerminals(Array.isArray(tData) ? tData : []);
      if (tData.length > 0) setSelectedTerminal(tData[0].id);

      // Load registers
      const rRes = await fetch('http://localhost:3001/pos/registers', { headers });
      const rData = await rRes.json();
      const active = rData.find((reg: POSRegister) => reg.status === 'OPEN');
      if (active) setActiveRegister(active);

      // Load products
      const pRes = await fetch('http://localhost:3001/inventory/products', { headers });
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
      const res = await fetch('http://localhost:3001/pos/registers/open', {
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
      await fetch(`http://localhost:3001/pos/registers/${activeRegister.id}/close`, {
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
      const res = await fetch(`http://localhost:3001/pos/registers/${activeRegister.id}/shifts/start`, {
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
      await fetch(`http://localhost:3001/pos/shifts/${currentShift.id}/end`, {
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
    alert(`Checkout complete! Total Paid: $${getTotal().toFixed(2)}`);
    setCart([]);
  };

  const filteredProducts = products.filter(p => 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Store style={{ color: 'var(--color-primary)' }} />
            Point of Sale Terminal
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Run retail counter checkout, handle registers, open cash sessions, and log staff shifts.
          </p>
        </div>
      </div>

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
                />
              </div>
            </div>

            <button 
              onClick={handleOpenRegister}
              style={{
                background: 'var(--color-primary)', color: '#ffffff', border: 'none',
                padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)'
              }}
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
                />
              </div>
              
              {/* Shift tracker action */}
              {!shiftOpen ? (
                <button onClick={handleStartShift} style={{
                  background: 'var(--color-primary)', border: 'none', color: '#fff',
                  padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)'
                }}>
                  <Coffee size={14} /> Start Shift
                </button>
              ) : (
                <button onClick={handleEndShift} style={{
                  background: 'var(--color-warning)', border: 'none', color: '#fff',
                  padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)'
                }}>
                  <Coffee size={14} /> End Shift
                </button>
              )}

              <button onClick={handleCloseRegister} style={{
                background: 'var(--color-danger)', border: 'none', color: '#fff',
                padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 'var(--text-xs)', fontWeight: 'bold'
              }}>
                Close Drawer
              </button>
            </div>

            {/* Grid list of products */}
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
          </div>

          {/* Cart Column */}
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <ShoppingCart size={18} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Checkout Cart</h2>
              <span style={{ marginLeft: 'auto', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '50%', fontSize: '10px', fontWeight: 'bold' }}>
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
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '4px', display: 'flex', padding: '2px' }}><Minus size={12} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '4px', display: 'flex', padding: '2px' }}><Plus size={12} /></button>
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
                  color: '#ffffff', border: 'none', padding: 'var(--space-3)',
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
