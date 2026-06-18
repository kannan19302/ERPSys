'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';

interface BOMItem {
  id: string;
  productId: string;
  quantity: number | string;
}

interface BOM {
  id: string;
  name: string;
  code: string;
  productId: string;
  isActive: boolean;
  items?: BOMItem[];
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

export default function BOMsPage() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [newBOM, setNewBOM] = useState({
    name: '',
    code: '',
    productId: '',
    items: [{ productId: '', quantity: '1' }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [bomsRes, prodRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/manufacturing/boms', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/inventory/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (bomsRes.ok) setBoms(await bomsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (prodRes.ok) setProducts(await prodRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {
      // Ignored
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ClipboardList size={28} style={{ color: 'var(--color-primary)' }} />
            Bills of Materials (BOM)
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Configure product recipe components, raw materials breakdowns, and assemblies costing
          </p>
        </div>
        <button
          onClick={() => setIsBOMModalOpen(true)}
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
          New BOM Formula
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading BOM formulas...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {boms.map((bom) => (
            <div key={bom.id} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <h4 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)' }}>{bom.name}</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Code: {bom.code}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-1)' }}>ITEMS</p>
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
          {boms.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-12)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-2xl)', color: 'var(--color-text-secondary)' }}>
              No Bill of Materials created yet.
            </div>
          )}
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
                <input required type="text" placeholder="e.g. Laptop assembly" value={newBOM.name} onChange={(e) => setNewBOM({ ...newBOM, name: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>BOM Code</label>
                <input required type="text" placeholder="e.g. BOM-LAP-001" value={newBOM.code} onChange={(e) => setNewBOM({ ...newBOM, code: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product to Manufacture</label>
              <select required value={newBOM.productId} onChange={(e) => setNewBOM({ ...newBOM, productId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
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
    </div>
  );
}
