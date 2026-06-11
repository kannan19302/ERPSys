'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Layers, 
  QrCode, 
  MapPin, 
  ClipboardCheck, 
  RefreshCw, 
  CheckCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface SerialNumber {
  id: string;
  serialNumber: string;
  status: string;
  product?: {
    name: string;
  };
}

interface Batch {
  id: string;
  batchNumber: string;
  quantity: string;
  expiryDate?: string;
  product?: {
    name: string;
  };
}

interface BinLocation {
  id: string;
  name: string;
  zone?: string;
  shelf?: string;
  bin?: string;
}

interface CycleCount {
  id: string;
  createdAt: string;
  status: string;
  notes?: string;
}

export default function AdvancedInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [binLocations, setBinLocations] = useState<BinLocation[]>([]);
  const [cycleCounts, setCycleCounts] = useState<CycleCount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeTab, setActiveTab] = useState<'serials' | 'batches' | 'bins' | 'cycle'>('serials');

  // Form states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [inputVal1, setInputVal1] = useState(''); // e.g. serialNumber or batchNumber
  const [inputVal2, setInputVal2] = useState(''); // e.g. quantity or zone
  const [inputVal3, setInputVal3] = useState(''); // e.g. shelf or expiryDate

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, wRes, snRes, bRes, binRes, ccRes] = await Promise.all([
        fetch('http://localhost:3001/inventory/products', { headers }),
        fetch('http://localhost:3001/inventory/warehouses', { headers }),
        fetch('http://localhost:3001/inventory/serial-numbers', { headers }),
        fetch('http://localhost:3001/inventory/batches', { headers }),
        fetch('http://localhost:3001/inventory/bin-locations', { headers }),
        fetch('http://localhost:3001/inventory/cycle-counts', { headers }),
      ]);

      const [pData, wData, snData, bData, binData, ccData] = await Promise.all([
        pRes.json(), wRes.json(), snRes.json(), bRes.json(), binRes.json(), ccRes.json()
      ]);

      setProducts(Array.isArray(pData) ? pData : []);
      setWarehouses(Array.isArray(wData) ? wData : []);
      setSerialNumbers(Array.isArray(snData) ? snData : []);
      setBatches(Array.isArray(bData) ? bData : []);
      setBinLocations(Array.isArray(binData) ? binData : []);
      setCycleCounts(Array.isArray(ccData) ? ccData : []);

      if (pData.length > 0) setSelectedProduct(pData[0].id);
      if (wData.length > 0) setSelectedWarehouse(wData[0].id);

      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal1 || !selectedProduct || !selectedWarehouse) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/inventory/serial-numbers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct,
          warehouseId: selectedWarehouse,
          serialNumber: inputVal1
        })
      });
      setInputVal1('');
      loadData();
    } catch {
      alert('Error registering serial number.');
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal1 || !inputVal2 || !selectedProduct) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/inventory/batches', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct,
          batchNumber: inputVal1,
          quantity: parseFloat(inputVal2),
          expiryDate: inputVal3 || undefined
        })
      });
      setInputVal1('');
      setInputVal2('');
      setInputVal3('');
      loadData();
    } catch {
      alert('Error creating batch.');
    }
  };

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal1 || !selectedWarehouse) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/inventory/bin-locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          name: inputVal1,
          zone: inputVal2 || undefined,
          shelf: inputVal3 || undefined
        })
      });
      setInputVal1('');
      setInputVal2('');
      setInputVal3('');
      loadData();
    } catch {
      alert('Error creating bin location.');
    }
  };

  const handleCompleteCount = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/inventory/cycle-counts/${id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadData();
    } catch {
      alert('Error completing cycle count.');
    }
  };

  const handleCreateCycleCount = async () => {
    if (products.length === 0 || !selectedWarehouse) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/inventory/cycle-counts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          notes: 'Regular Cycle count stock auditing',
          items: products.map(p => ({
            productId: p.id,
            expectedQty: 100,
            countedQty: 100 + Math.floor(Math.random() * 5) - 2 // small simulated variance
          }))
        })
      });
      loadData();
    } catch {
      alert('Error creating cycle count.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Advanced Inventory Module...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Layers style={{ color: 'var(--color-primary)' }} />
          Advanced Stock & Inventory Controls
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Manage serialized products, batch lots, bin configurations, and count audits.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('serials')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'serials' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'serials' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <QrCode size={16} /> Serial Numbers
        </button>
        <button 
          onClick={() => setActiveTab('batches')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'batches' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'batches' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Package size={16} /> Batches & Expiry
        </button>
        <button 
          onClick={() => setActiveTab('bins')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'bins' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'bins' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <MapPin size={16} /> Bin Locations
        </button>
        <button 
          onClick={() => setActiveTab('cycle')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'cycle' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'cycle' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <ClipboardCheck size={16} /> Cycle Counts
        </button>
      </div>

      {/* Tab Panels Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Main List Area */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'serials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Registered Serial Numbers</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Serial Number</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Product</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {serialNumbers.map(sn => (
                    <tr key={sn.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{sn.serialNumber}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{sn.product?.name}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                          background: sn.status === 'AVAILABLE' ? 'var(--color-success-light)' : 'var(--color-border)',
                          color: sn.status === 'AVAILABLE' ? 'var(--color-success)' : 'var(--color-text-secondary)'
                        }}>{sn.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'batches' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Active Product Batches</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Batch ID</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Product</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Quantity</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{b.batchNumber}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{b.product?.name}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{parseFloat(b.quantity)}</td>
                      <td style={{ padding: 'var(--space-2.5)', color: 'var(--color-danger)' }}>
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'bins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Warehouse Bin Locations</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Bin Name</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Zone</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Shelf</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Bin ID</th>
                  </tr>
                </thead>
                <tbody>
                  {binLocations.map(bin => (
                    <tr key={bin.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{bin.name}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{bin.zone || 'N/A'}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{bin.shelf || 'N/A'}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{bin.bin || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'cycle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Stock Count Audits</h2>
                <button onClick={handleCreateCycleCount} style={{
                  background: 'var(--color-primary)', border: 'none', color: '#fff',
                  padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'bold'
                }}>
                  Trigger Cycle Count
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Date Initiated</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Status</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Notes</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleCounts.map(cc => (
                    <tr key={cc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)' }}>{new Date(cc.createdAt).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                          background: cc.status === 'COMPLETED' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                          color: cc.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-warning)'
                        }}>{cc.status}</span>
                      </td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{cc.notes || 'N/A'}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>
                        {cc.status === 'DRAFT' && (
                          <button 
                            onClick={() => handleCompleteCount(cc.id)}
                            style={{
                              background: 'var(--color-success)', color: '#fff', border: 'none',
                              padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px'
                            }}
                          >
                            <CheckCircle size={10} /> Complete count
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Form Column */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'serials' && (
            <form onSubmit={handleRegisterSerial} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Register Serial Number</h3>
              
              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Product</label>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Warehouse</label>
                <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }}>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Serial Number String</label>
                <input type="text" value={inputVal1} onChange={(e) => setInputVal1(e.target.value)} placeholder="e.g. SN-8829-X" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', padding: 'var(--space-2.5)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                Register Serial
              </button>
            </form>
          )}

          {activeTab === 'batches' && (
            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Create Product Batch</h3>
              
              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Product</label>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Batch Number ID</label>
                <input type="text" value={inputVal1} onChange={(e) => setInputVal1(e.target.value)} placeholder="e.g. LOT-2026-A" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Batch Quantity</label>
                <input type="number" value={inputVal2} onChange={(e) => setInputVal2(e.target.value)} placeholder="e.g. 150" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Expiry Date (Optional)</label>
                <input type="date" value={inputVal3} onChange={(e) => setInputVal3(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', padding: 'var(--space-2.5)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                Create Batch
              </button>
            </form>
          )}

          {activeTab === 'bins' && (
            <form onSubmit={handleCreateBin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Create Bin Location</h3>
              
              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Warehouse</label>
                <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }}>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Location Name</label>
                <input type="text" value={inputVal1} onChange={(e) => setInputVal1(e.target.value)} placeholder="e.g. Row-12-Shelf-4" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Zone (Optional)</label>
                <input type="text" value={inputVal2} onChange={(e) => setInputVal2(e.target.value)} placeholder="e.g. Zone-B" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Shelf ID (Optional)</label>
                <input type="text" value={inputVal3} onChange={(e) => setInputVal3(e.target.value)} placeholder="e.g. Shelf-4" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', padding: 'var(--space-2.5)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                Add Location
              </button>
            </form>
          )}

          {activeTab === 'cycle' && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              Trigger audits on the left panel to execute stock counting. Completed audits adjust inventory counts immediately.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
