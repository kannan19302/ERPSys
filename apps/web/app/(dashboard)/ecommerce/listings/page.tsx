'use client';

import React, { useEffect, useState } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column,
  Modal, ConfirmDialog, ProtectedComponent, useToast,
  TextField, FormField, Select,
} from '@unerp/ui';
import { Plus, Pencil, Trash2, Package, Eye, EyeOff } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete, ApiRequestError } from '@/lib/api';

const READ_PERMISSION = 'ecommerce.listing.read';
const CREATE_PERMISSION = 'ecommerce.listing.create';
const UPDATE_PERMISSION = 'ecommerce.listing.update';
const DELETE_PERMISSION = 'ecommerce.listing.delete';

interface ProductListingRow {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  categoryId: string | null;
  categoryName: string | null;
  isPublished: boolean;
  basePrice: number;
  priceOverride: number | null;
  effectivePrice: number;
  sortOrder: number;
}

interface StorefrontCategory {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  sellPrice: number;
}

interface FormState {
  productId: string;
  categoryId: string;
  isPublished: boolean;
  displayName: string;
  description: string;
  priceOverride: string;
  sortOrder: number;
}

const EMPTY_FORM: FormState = {
  productId: '', categoryId: '', isPublished: false,
  displayName: '', description: '', priceOverride: '', sortOrder: 0,
};

export default function ProductListingsPage() {
  const toast = useToast();
  const [listings, setListings] = useState<ProductListingRow[]>([]);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductListingRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Product picker (searchable select against Inventory's product list)
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingsData, categoriesData] = await Promise.all([
        apiGet<ProductListingRow[]>('/ecommerce/listings'),
        apiGet<StorefrontCategory[]>('/ecommerce/categories'),
      ]);
      setListings(listingsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load product listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!editorOpen || editingId) return; // only search when creating a new listing
    let active = true;
    setProductSearchLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await apiGet<{ data: ProductOption[] }>(
          `/inventory/products?limit=20${productSearch ? `&search=${encodeURIComponent(productSearch)}` : ''}`,
        );
        if (active) setProductOptions(res.data);
      } catch {
        if (active) setProductOptions([]);
      } finally {
        if (active) setProductSearchLoading(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [productSearch, editorOpen, editingId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setProductSearch('');
    setProductOptions([]);
    setEditorOpen(true);
  };

  const openEdit = (listing: ProductListingRow) => {
    setEditingId(listing.id);
    setForm({
      productId: listing.productId,
      categoryId: listing.categoryId || '',
      isPublished: listing.isPublished,
      displayName: listing.productName,
      description: '',
      priceOverride: listing.priceOverride != null ? String(listing.priceOverride) : '',
      sortOrder: listing.sortOrder,
    });
    setFormErrors({});
    setEditorOpen(true);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!editingId && !form.productId) nextErrors.productId = 'Select a product to publish';
    if (form.priceOverride && (isNaN(Number(form.priceOverride)) || Number(form.priceOverride) <= 0)) {
      nextErrors.priceOverride = 'Price override must be a positive number';
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      if (editingId) {
        await apiPatch(`/ecommerce/listings/${editingId}`, {
          categoryId: form.categoryId || null,
          isPublished: form.isPublished,
          displayName: form.displayName || null,
          description: form.description || null,
          priceOverride: form.priceOverride ? Number(form.priceOverride) : null,
          sortOrder: form.sortOrder,
        });
        toast.success('Listing updated');
      } else {
        await apiPost('/ecommerce/listings', {
          productId: form.productId,
          categoryId: form.categoryId || undefined,
          isPublished: form.isPublished,
          displayName: form.displayName || undefined,
          description: form.description || undefined,
          priceOverride: form.priceOverride ? Number(form.priceOverride) : undefined,
          sortOrder: form.sortOrder,
        });
        toast.success('Product published to storefront');
      }
      setEditorOpen(false);
      fetchAll();
    } catch (err) {
      toast.error('Failed to save listing', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/ecommerce/listings/${deleteTarget.id}`);
      toast.success('Listing removed');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error('Failed to remove listing', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  const togglePublish = async (row: ProductListingRow) => {
    try {
      await apiPatch(`/ecommerce/listings/${row.id}`, { isPublished: !row.isPublished });
      toast.success(row.isPublished ? 'Listing unpublished' : 'Listing published');
      fetchAll();
    } catch (err) {
      toast.error('Failed to update listing', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const columns: Column<ProductListingRow>[] = [
    {
      key: 'productName', header: 'Product',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Package size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <div>
            <div style={{ fontWeight: 'var(--weight-medium)' }}>{row.productName}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.productSku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'categoryName', header: 'Category',
      render: (row) => row.categoryName
        ? <Badge variant="info">{row.categoryName}</Badge>
        : <span style={{ color: 'var(--color-text-tertiary)' }}>Uncategorized</span>,
    },
    {
      key: 'effectivePrice', header: 'Price', align: 'right',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)' }}>{row.effectivePrice.toFixed(2)}</div>
          {row.priceOverride != null && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textDecoration: 'line-through' }}>
              {row.basePrice.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'isPublished', header: 'Status',
      render: (row) => (
        <Badge variant={row.isPublished ? 'success' : 'default'}>
          {row.isPublished ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    { key: 'sortOrder', header: 'Sort', align: 'right' },
    {
      key: 'actions', header: '', align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <ProtectedComponent permission={UPDATE_PERMISSION}>
            <Button
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); togglePublish(row); }}
              leftIcon={row.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
            >
              {row.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(row); }} leftIcon={<Pencil size={13} />}>
              Edit
            </Button>
          </ProtectedComponent>
          <ProtectedComponent permission={DELETE_PERMISSION}>
            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} leftIcon={<Trash2 size={13} />}>
              Remove
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];

  return (
    <ProtectedComponent
      permission={READ_PERMISSION}
      fallback={
        <Card>
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            You do not have permission to view storefront listings.
          </div>
        </Card>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <PageHeader
          title="Product Listings"
          description="Publish existing Inventory products to the public storefront and control price overrides."
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'E-Commerce', href: '/ecommerce' },
            { label: 'Listings' },
          ]}
          actions={
            <ProtectedComponent permission={CREATE_PERMISSION}>
              <Button variant="primary" onClick={openCreate} leftIcon={<Plus size={14} />}>
                Publish Product
              </Button>
            </ProtectedComponent>
          }
        />

        {error ? (
          <Card>
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-danger-text)' }}>
              {error}
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Button variant="outline" onClick={fetchAll}>Retry</Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={listings}
              loading={loading}
              rowKey={(row) => row.id}
              emptyTitle="No products published yet"
              emptyMessage="Publish an existing Inventory product to make it visible on the storefront."
            />
          </Card>
        )}

        <Modal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={editingId ? 'Edit Listing' : 'Publish Product to Storefront'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {!editingId && (
              <FormField label="Product" required error={formErrors.productId} hint="Search by name or SKU">
                <TextField
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                />
                <Select
                  value={form.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  <option value="">{productSearchLoading ? 'Searching...' : 'Select a product'}</option>
                  {productOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.sellPrice}</option>
                  ))}
                </Select>
              </FormField>
            )}
            <FormField label="Category">
              <Select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormField>
            <TextField
              label="Display Name Override"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              hint="Leave blank to use the Inventory product name"
            />
            <TextField
              label="Price Override"
              type="number"
              step="0.01"
              value={form.priceOverride}
              onChange={(e) => setForm((f) => ({ ...f, priceOverride: e.target.value }))}
              error={formErrors.priceOverride}
              hint="Leave blank to use the product's standard sell price"
            />
            <TextField
              label="Sort Order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
            />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 'var(--text-sm)' }}>Publish immediately</span>
            </label>
          </div>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Remove listing?"
          message={`Are you sure you want to unpublish and remove "${deleteTarget?.productName}" from the storefront?`}
          confirmLabel="Remove"
          variant="danger"
          loading={deleting}
        />
      </div>
    </ProtectedComponent>
  );
}
