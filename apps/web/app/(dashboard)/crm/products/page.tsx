'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Badge, Modal, TextField, FormField, Select, useToast, DataTable, type Column, type SortOrder } from '@unerp/ui';
import { Package, Search, DollarSign, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../../src/lib/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  sellPrice: number;
  costPrice: number;
  category: string | null;
  type: string;
  status: string;
  isActive: boolean;
  discontinuedAt: string | null;
  requiresApproval: boolean;
}

export default function CrmProductsPage() {
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', sku: '', sellPrice: '', costPrice: '', type: 'GOODS', category: '', status: 'ACTIVE', requiresApproval: false
  });

  const [editOpen, setEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', sku: '', sellPrice: '', costPrice: '', type: 'GOODS', category: '', status: 'ACTIVE', requiresApproval: false
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);

      const res = await apiGet<{ data: Product[]; totalCount: number; totalPages: number }>(
        `/crm/products?${queryParams.toString()}`
      );
      if (res && res.data) {
        setProducts(res.data);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 0);
      }
    } catch {
      // Fallback mocks
      const mockList: Product[] = [
        { id: '1', name: 'CRM Enterprise License', sku: 'CRM-ENT-001', sellPrice: 5000, costPrice: 500, category: 'Software', type: 'SERVICE', status: 'ACTIVE', isActive: true, discontinuedAt: null, requiresApproval: false },
        { id: '2', name: 'Implementation Package', sku: 'IMPL-001', sellPrice: 15000, costPrice: 3000, category: 'Services', type: 'SERVICE', status: 'ACTIVE', isActive: true, discontinuedAt: null, requiresApproval: true },
        { id: '3', name: 'Annual Support Plan', sku: 'SUP-ANN-001', sellPrice: 2400, costPrice: 200, category: 'Support', type: 'SERVICE', status: 'DRAFT', isActive: true, discontinuedAt: null, requiresApproval: false },
        { id: '4', name: 'Legacy Hardware Gateway', sku: 'HW-LEG-099', sellPrice: 350, costPrice: 180, category: 'Hardware', type: 'GOODS', status: 'DISCONTINUED', isActive: false, discontinuedAt: '2026-01-15', requiresApproval: false },
      ];
      const filtered = mockList.filter(p => {
        if (type && p.type !== type) return false;
        if (status && p.status !== status) return false;
        if (debouncedSearch && !p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) && !p.sku.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
        return true;
      });
      setProducts(filtered);
      setTotalCount(filtered.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, type, status, sortBy, sortOrder]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.sku.trim() || !createForm.sellPrice) {
      error('Name, SKU and Sell Price are required.');
      return;
    }
    setCreating(true);
    try {
      await apiPost('/crm/products', {
        name: createForm.name.trim(),
        sku: createForm.sku.trim(),
        sellPrice: Number(createForm.sellPrice),
        costPrice: Number(createForm.costPrice) || 0,
        type: createForm.type,
        category: createForm.category.trim() || undefined,
        status: createForm.status,
        requiresApproval: createForm.requiresApproval,
      });
      success('Product created successfully.');
      setCreateOpen(false);
      setCreateForm({
        name: '', sku: '', sellPrice: '', costPrice: '', type: 'GOODS', category: '', status: 'ACTIVE', requiresApproval: false
      });
      fetchProducts();
    } catch (err: any) {
      error(err.message || 'Failed to create product.');
    } finally {
      setCreating(false);
    }
  };

  const triggerEdit = (p: Product) => {
    setEditProduct(p);
    setEditForm({
      name: p.name,
      sku: p.sku,
      sellPrice: String(p.sellPrice),
      costPrice: String(p.costPrice || 0),
      type: p.type,
      category: p.category || '',
      status: p.status,
      requiresApproval: p.requiresApproval || false,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    if (!editForm.name.trim() || !editForm.sku.trim() || !editForm.sellPrice) {
      error('Name, SKU and Sell Price are required.');
      return;
    }
    setUpdating(true);
    try {
      await apiPut(`/crm/products/${editProduct.id}`, {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        sellPrice: Number(editForm.sellPrice),
        costPrice: Number(editForm.costPrice) || 0,
        type: editForm.type,
        category: editForm.category.trim() || undefined,
        status: editForm.status,
        requiresApproval: editForm.requiresApproval,
      });
      success('Product updated successfully.');
      setEditOpen(false);
      fetchProducts();
    } catch (err: any) {
      error(err.message || 'Failed to update product.');
    } finally {
      setUpdating(false);
    }
  };

  const triggerDelete = (p: Product) => {
    setProductToDelete(p);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await apiDelete(`/crm/products/${productToDelete.id}`);
      success('Product deleted successfully.');
      setDeleteOpen(false);
      fetchProducts();
    } catch (err: any) {
      error(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusVariant = (st: string): 'default' | 'success' | 'info' | 'primary' | 'warning' | 'danger' | undefined => {
    switch (st) {
      case 'ACTIVE': return 'success';
      case 'DRAFT': return 'warning';
      case 'DISCONTINUED': return 'danger';
      default: return 'default';
    }
  };

  const handleSortChange = (key: string, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name', header: 'Product / SKU', sortable: true,
      render: (p) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{p.name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontFamily: 'monospace', marginTop: 2 }}>{p.sku}</div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <Badge variant="default">{p.category || 'Uncategorized'}</Badge> },
    { key: 'type', header: 'Type', render: (p) => <Badge variant={p.type === 'SERVICE' ? 'info' : 'success'}>{p.type}</Badge> },
    { key: 'status', header: 'Lifecycle', sortable: true, render: (p) => <Badge variant={getStatusVariant(p.status)}>{p.status}</Badge> },
    {
      key: 'sellPrice', header: 'Price', align: 'right', sortable: true,
      render: (p) => `$${p.sellPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'actions', header: 'Actions', align: 'center', width: '120px',
      render: (p) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); triggerEdit(p); }} style={{ padding: '4px 8px' }}>
            <Edit2 size={12} />
          </Button>
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); triggerDelete(p); }} style={{ padding: '4px 8px', color: 'var(--color-danger)' }}>
            <Trash2 size={12} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Product Lifecycle Catalog"
        description="Configure your product offering, pricing strategies, lifecycle states, and margin analytics."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Products' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} style={{ marginRight: 6 }} /> New Product
          </Button>
        }
      />

      {/* Analytics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{totalCount}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total Configured Products</div>
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
                {products.filter(p => p.status === 'ACTIVE').length} Active
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Products in Active Status</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text" placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}
          />
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="">All Types</option>
          <option value="GOODS">Goods</option>
          <option value="SERVICE">Service</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="">All Lifecycles</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="DISCONTINUED">Discontinued</option>
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

      {/* Main Table */}
      <Card padding="none">
        <DataTable<Product>
          columns={columns}
          data={products}
          loading={loading}
          rowKey={(p) => p.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          emptyTitle="No products configured"
          emptyMessage="Click 'New Product' to add one."
        />
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

      {/* Create Product Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Product Offering" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create Offering'}</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Product Name" required placeholder="CRM Enterprise Plan" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="SKU / Reference ID" required placeholder="CRM-ENT-001" value={createForm.sku} onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })} />
            <FormField label="Type">
              <Select value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}>
                <option value="GOODS">Goods (Physical)</option>
                <option value="SERVICE">Service (Digital / Subscription)</option>
              </Select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Sell Price" type="number" required placeholder="99.99" value={createForm.sellPrice} onChange={(e) => setCreateForm({ ...createForm, sellPrice: e.target.value })} />
            <TextField label="Cost Price" type="number" placeholder="40.00" value={createForm.costPrice} onChange={(e) => setCreateForm({ ...createForm, costPrice: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Category Label" placeholder="Software" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} />
            <FormField label="Initial Lifecycle Stage">
              <Select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="DISCONTINUED">Discontinued</option>
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input id="createApproval" type="checkbox" checked={createForm.requiresApproval} onChange={(e) => setCreateForm({ ...createForm, requiresApproval: e.target.checked })} style={{ cursor: 'pointer' }} />
            <label htmlFor="createApproval" style={{ fontSize: 'var(--text-sm)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Requires Contract Approval (holds contract if added as line item)</label>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Update Product Offering" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate as any} disabled={updating}>{updating ? 'Updating...' : 'Save Offering'}</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Product Name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="SKU / Reference ID" required value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
            <FormField label="Type">
              <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                <option value="GOODS">Goods (Physical)</option>
                <option value="SERVICE">Service (Digital / Subscription)</option>
              </Select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Sell Price" type="number" required value={editForm.sellPrice} onChange={(e) => setEditForm({ ...editForm, sellPrice: e.target.value })} />
            <TextField label="Cost Price" type="number" value={editForm.costPrice} onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Category Label" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
            <FormField label="Lifecycle Stage">
              <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="DISCONTINUED">Discontinued</option>
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <input id="editApproval" type="checkbox" checked={editForm.requiresApproval} onChange={(e) => setEditForm({ ...editForm, requiresApproval: e.target.checked })} style={{ cursor: 'pointer' }} />
            <label htmlFor="editApproval" style={{ fontSize: 'var(--text-sm)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Requires Contract Approval</label>
          </div>

          {/* Stock Stub Info for Analytics */}
          <div style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
            <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>Stock Status Stub</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: 'var(--color-text-secondary)' }}>
              <span>Available Stock: 150 units</span>
              <span>Reorder threshold: 20 units</span>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Product" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Confirm Delete'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2)' }}>
          <ShieldAlert size={24} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Are you sure?</div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              This will remove the product offering from active listings. Existing transaction history will remain intact.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
