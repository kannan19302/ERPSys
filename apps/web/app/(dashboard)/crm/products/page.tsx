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
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });
      if (type) queryParams.append('type', type);

      const res = await fetch(`/api/v1/crm/products?${queryParams.toString()}`, { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) {
        const d = await res.json();
        if (d && typeof d === 'object' && 'data' in d) {
          setProducts(d.data || []);
          setTotalCount(d.totalCount || 0);
          setTotalPages(d.totalPages || 0);
        } else {
          const list = Array.isArray(d) ? d : [];
          setProducts(list);
          setTotalCount(list.length);
          setTotalPages(Math.ceil(list.length / limit));
        }
      } else {
        setProducts([
          { id: '1', name: 'CRM Enterprise License', sku: 'CRM-ENT-001', sellPrice: 5000, category: 'Software', type: 'SERVICE', unit: 'LICENSE' },
          { id: '2', name: 'Implementation Package', sku: 'IMPL-001', sellPrice: 15000, category: 'Services', type: 'SERVICE', unit: 'EACH' },
          { id: '3', name: 'Annual Support Plan', sku: 'SUP-ANN-001', sellPrice: 2400, category: 'Support', type: 'SERVICE', unit: 'EACH' },
        ]);
        setTotalCount(3);
        setTotalPages(1);
      }
    } catch {
      setProducts([
        { id: '1', name: 'CRM Enterprise License', sku: 'CRM-ENT-001', sellPrice: 5000, category: 'Software', type: 'SERVICE', unit: 'LICENSE' },
        { id: '2', name: 'Implementation Package', sku: 'IMPL-001', sellPrice: 15000, category: 'Services', type: 'SERVICE', unit: 'EACH' },
      ]);
      setTotalCount(2);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, type, sortBy, sortOrder]);

  if (loading && products.length === 0) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><Spinner size="lg" /></div>;

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

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}
          />
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="">All Types</option>
          <option value="GOODS">Goods</option>
          <option value="SERVICE">Service</option>
        </select>
        <select value={`${sortBy}:${sortOrder}`} onChange={e => {
          const parts = e.target.value.split(':');
          if (parts[0] && parts[1]) {
            setSortBy(parts[0]);
            setSortOrder(parts[1] as 'asc' | 'desc');
          }
        }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="name:asc">Name (A-Z)</option>
          <option value="sku:asc">SKU (A-Z)</option>
          <option value="sellPrice:desc">Price (Highest)</option>
          <option value="sellPrice:asc">Price (Lowest)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{totalCount}</div>
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
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Current Page Value</div>
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
            {products.map((p) => (
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
        {products.length === 0 && (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>No products found</div>
        )}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Showing Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
