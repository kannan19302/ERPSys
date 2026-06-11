'use client';

import React, { useState, useEffect } from 'react';
import { Hammer, Play, CheckCircle2 } from 'lucide-react';

interface BOM {
  id: string;
  name: string;
  code: string;
  productId: string;
  isActive: boolean;
  items?: Array<{ id: string; productId: string; quantity: number }>;
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  status: string;
  quantity: number;
  startDate: string | null;
  endDate: string | null;
  bom: BOM;
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

export default function ManufacturingPage() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'boms' | 'orders'>('orders');

  // New BOM Form State
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [newBOM, setNewBOM] = useState({
    name: '',
    code: '',
    productId: '',
    items: [{ productId: '', quantity: '1' }],
  });

  // New Work Order Form State
  const [isWOModalOpen, setIsWOModalOpen] = useState(false);
  const [newWO, setNewWO] = useState({
    bomId: '',
    workOrderNumber: '',
    quantity: '',
    startDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [bomsRes, ordersRes, prodRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/manufacturing/boms', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/manufacturing/work-orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/inventory/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (bomsRes.ok) setBoms(await bomsRes.json());
      if (ordersRes.ok) setWorkOrders(await ordersRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch {
      // Ignored for presentation
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/boms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newBOM,
          items: newBOM.items.map((item) => ({
            productId: item.productId,
            quantity: parseFloat(item.quantity),
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to create BOM');

      setIsBOMModalOpen(false);
      setNewBOM({ name: '', code: '', productId: '', items: [{ productId: '', quantity: '1' }] });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/manufacturing/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newWO,
          quantity: parseFloat(newWO.quantity),
        }),
      });

      if (!res.ok) throw new Error('Failed to create work order');

      setIsWOModalOpen(false);
      setNewWO({ bomId: '', workOrderNumber: '', quantity: '', startDate: '' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/manufacturing/work-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Hammer size={28} style={{ color: 'var(--color-primary)' }} />
            Manufacturing (MRP)
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Manage product component formulas (BOM) and execution lines (Work Orders)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setIsBOMModalOpen(true)}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              padding: 'var(--space-2.5) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
            }}
          >
            New BOM
          </button>
          <button
            onClick={() => setIsWOModalOpen(true)}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              padding: 'var(--space-2.5) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
            }}
          >
            New Work Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            border: 'none',
            background: 'none',
            color: activeTab === 'orders' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'orders' ? 'var(--weight-semibold)' : 'var(--weight-normal)',
            borderBottom: activeTab === 'orders' ? '2px solid var(--color-primary)' : 'none',
            cursor: 'pointer',
          }}
        >
          Work Orders
        </button>
        <button
          onClick={() => setActiveTab('boms')}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            border: 'none',
            background: 'none',
            color: activeTab === 'boms' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'boms' ? 'var(--weight-semibold)' : 'var(--weight-normal)',
            borderBottom: activeTab === 'boms' ? '2px solid var(--color-primary)' : 'none',
            cursor: 'pointer',
          }}
        >
          Bills of Materials (BOM)
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading...</div>
      ) : activeTab === 'orders' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {workOrders.map((wo) => (
            <div
              key={wo.id}
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-2xl)',
                padding: 'var(--space-5)',
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <div>
                <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{wo.workOrderNumber}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>BOM: {wo.bom.name}</p>
              </div>

              <div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-bold)',
                  background:
                    wo.status === 'COMPLETED' ? 'var(--color-success-light)' :
                    wo.status === 'IN_PROGRESS' ? 'var(--color-primary-light)' : 'var(--color-bg-hover)',
                  color:
                    wo.status === 'COMPLETED' ? 'var(--color-success)' :
                    wo.status === 'IN_PROGRESS' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}>
                  {wo.status}
                </span>
              </div>

              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>QUANTITY</p>
                <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>{Number(wo.quantity)}</p>
              </div>

              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>START DATE</p>
                <p style={{ fontSize: 'var(--text-xs)', marginTop: '2px' }}>{wo.startDate ? new Date(wo.startDate).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                {wo.status === 'DRAFT' && (
                  <button
                    onClick={() => handleUpdateStatus(wo.id, 'PLANNED')}
                    style={{ padding: 'var(--space-1.5) var(--space-3)', fontSize: 'var(--text-xs)', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                  >
                    Plan Order
                  </button>
                )}
                {wo.status === 'PLANNED' && (
                  <button
                    onClick={() => handleUpdateStatus(wo.id, 'IN_PROGRESS')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: 'var(--space-1.5) var(--space-3)', fontSize: 'var(--text-xs)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}
                  >
                    <Play size={10} fill="white" /> Start Production
                  </button>
                )}
                {wo.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleUpdateStatus(wo.id, 'COMPLETED')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: 'var(--space-1.5) var(--space-3)', fontSize: 'var(--text-xs)', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}
                  >
                    <CheckCircle2 size={12} /> Complete & Consume
                  </button>
                )}
                {wo.status === 'COMPLETED' && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} /> Finished
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {boms.map((bom) => (
            <div key={bom.id} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <h4 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)' }}>{bom.name}</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Code: {bom.code}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>ITEMS</p>
                {bom.items && bom.items.map((item, idx) => {
                  const p = products.find((pr) => pr.id === item.productId);
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: '2px 0' }}>
                      <span>{p ? p.name : 'Unknown Component'}</span>
                      <span>Qty: {Number(item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New BOM Modal */}
      {isBOMModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateBOM} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '480px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Create New Bill of Materials</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Formula Name</label>
                <input required type="text" placeholder="e.g. Laptop assembly" value={newBOM.name} onChange={(e) => setNewBOM({ ...newBOM, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>BOM Code</label>
                <input required type="text" placeholder="e.g. BOM-LAP-001" value={newBOM.code} onChange={(e) => setNewBOM({ ...newBOM, code: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product to Manufacture</label>
              <select required value={newBOM.productId} onChange={(e) => setNewBOM({ ...newBOM, productId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }}>
                <option value="">Select Target Product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Formula Ingredients / Component Products</label>
                <button
                  type="button"
                  onClick={() => setNewBOM({ ...newBOM, items: [...newBOM.items, { productId: '', quantity: '1' }] })}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 'var(--weight-bold)' }}
                >
                  + Add Component
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '140px', overflowY: 'auto' }}>
                {newBOM.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 40px', gap: 'var(--space-2)' }}>
                    <select required value={item.productId} onChange={(e) => {
                      const updated = [...newBOM.items];
                      updated[idx]!.productId = e.target.value;
                      setNewBOM({ ...newBOM, items: updated });
                    }} style={{ padding: 'var(--space-1.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <input required type="number" min="0.001" step="any" value={item.quantity} onChange={(e) => {
                      const updated = [...newBOM.items];
                      updated[idx]!.quantity = e.target.value;
                      setNewBOM({ ...newBOM, items: updated });
                    }} style={{ padding: 'var(--space-1.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = newBOM.items.filter((_, i) => i !== idx);
                        setNewBOM({ ...newBOM, items: updated });
                      }}
                      style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsBOMModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Save formula</button>
            </div>
          </form>
        </div>
      )}

      {/* New Work Order Modal */}
      {isWOModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <form onSubmit={handleCreateWorkOrder} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Create Work Order</h3>
            
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Select Formula (BOM)</label>
              <select required value={newWO.bomId} onChange={(e) => setNewWO({ ...newWO, bomId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }}>
                <option value="">Select BOM...</option>
                {boms.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Work Order Number</label>
              <input required type="text" placeholder="e.g. WO-2026-001" value={newWO.workOrderNumber} onChange={(e) => setNewWO({ ...newWO, workOrderNumber: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Quantity</label>
                <input required type="number" min="1" value={newWO.quantity} onChange={(e) => setNewWO({ ...newWO, quantity: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Start Date</label>
                <input type="date" value={newWO.startDate} onChange={(e) => setNewWO({ ...newWO, startDate: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setIsWOModalOpen(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--weight-semibold)' }}>Save Order</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
