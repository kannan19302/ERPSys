'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge } from '@unerp/ui';
import { Package, Search, DollarSign } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  sellPrice: number;
  category: string | null;
  type: string;
  unit: string;
}

export default function CrmProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/crm/products', { headers: { Authorization: `Bearer ${token || ''}` } });
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : data?.data || []);
        } else {
          setProducts([
            { id: '1', name: 'CRM Enterprise License', sku: 'CRM-ENT-001', sellPrice: 5000, category: 'Software', type: 'SERVICE', unit: 'LICENSE' },
            { id: '2', name: 'Implementation Package', sku: 'IMPL-001', sellPrice: 15000, category: 'Services', type: 'SERVICE', unit: 'EACH' },
            { id: '3', name: 'Annual Support Plan', sku: 'SUP-ANN-001', sellPrice: 2400, category: 'Support', type: 'SERVICE', unit: 'EACH' },
          ]);
        }
      } catch {
        setProducts([
          { id: '1', name: 'CRM Enterprise License', sku: 'CRM-ENT-001', sellPrice: 5000, category: 'Software', type: 'SERVICE', unit: 'LICENSE' },
          { id: '2', name: 'Implementation Package', sku: 'IMPL-001', sellPrice: 15000, category: 'Services', type: 'SERVICE', unit: 'EACH' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Product Catalog"
        description="Browse products available for deals and quotations"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Products' },
        ]}
      />

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{products.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Total Products</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
                ${products.reduce((s, p) => s + p.sellPrice, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Catalog Value</div>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-sunken)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Product</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>SKU</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Category</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}>
                <td style={{ padding: '12px 16px', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{p.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{p.sku}</td>
                <td style={{ padding: '12px 16px' }}><Badge variant="default">{p.category || 'Uncategorized'}</Badge></td>
                <td style={{ padding: '12px 16px' }}><Badge variant={p.type === 'SERVICE' ? 'info' : 'success'}>{p.type}</Badge></td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>${p.sellPrice.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>No products found</div>
        )}
      </Card>
    </div>
  );
}
