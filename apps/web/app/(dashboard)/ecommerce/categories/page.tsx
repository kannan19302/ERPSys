'use client';

import React, { useEffect, useState } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column,
  Modal, ConfirmDialog, ProtectedComponent, useToast,
  TextField, FormField, Textarea,
} from '@unerp/ui';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete, ApiRequestError } from '@/lib/api';

const READ_PERMISSION = 'ecommerce.category.read';
const CREATE_PERMISSION = 'ecommerce.category.create';
const UPDATE_PERMISSION = 'ecommerce.category.update';
const DELETE_PERMISSION = 'ecommerce.category.delete';

interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

const EMPTY_FORM: FormState = { name: '', slug: '', description: '', sortOrder: 0 };

export default function StorefrontCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StorefrontCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<StorefrontCategory[]>('/ecommerce/categories');
      setCategories(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditorOpen(true);
  };

  const openEdit = (category: StorefrontCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sortOrder: category.sortOrder,
    });
    setFormErrors({});
    setEditorOpen(true);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!/^[a-z0-9-]+$/.test(form.slug)) nextErrors.slug = 'Slug must be lowercase letters, numbers, and hyphens only';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        sortOrder: form.sortOrder,
      };
      if (editingId) {
        await apiPatch(`/ecommerce/categories/${editingId}`, payload);
        toast.success('Category updated');
      } else {
        await apiPost('/ecommerce/categories', payload);
        toast.success('Category created');
      }
      setEditorOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error('Failed to save category', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/ecommerce/categories/${deleteTarget.id}`);
      toast.success('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete category', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<StorefrontCategory>[] = [
    {
      key: 'name', header: 'Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Tag size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <span style={{ fontWeight: 'var(--weight-medium)' }}>{row.name}</span>
        </div>
      ),
    },
    {
      key: 'slug', header: 'Slug',
      render: (row) => <Badge variant="info">{row.slug}</Badge>,
    },
    {
      key: 'description', header: 'Description',
      render: (row) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>{row.description || '—'}</span>
      ),
    },
    { key: 'sortOrder', header: 'Sort Order', align: 'right' },
    {
      key: 'actions', header: '', align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <ProtectedComponent permission={UPDATE_PERMISSION}>
            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(row); }} leftIcon={<Pencil size={13} />}>
              Edit
            </Button>
          </ProtectedComponent>
          <ProtectedComponent permission={DELETE_PERMISSION}>
            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} leftIcon={<Trash2 size={13} />}>
              Delete
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
            You do not have permission to view storefront categories.
          </div>
        </Card>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <PageHeader
          title="Storefront Categories"
          description="Group products into browsable categories on the public storefront."
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'E-Commerce', href: '/ecommerce' },
            { label: 'Categories' },
          ]}
          actions={
            <ProtectedComponent permission={CREATE_PERMISSION}>
              <Button variant="primary" onClick={openCreate} leftIcon={<Plus size={14} />}>
                New Category
              </Button>
            </ProtectedComponent>
          }
        />

        {error ? (
          <Card>
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-danger-text)' }}>
              {error}
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Button variant="outline" onClick={fetchCategories}>Retry</Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={categories}
              loading={loading}
              rowKey={(row) => row.id}
              emptyTitle="No categories yet"
              emptyMessage="Create a category to start organizing your storefront catalog."
            />
          </Card>
        )}

        <Modal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={editingId ? 'Edit Category' : 'New Category'}
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
            <TextField
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={formErrors.name}
              placeholder="Electronics"
            />
            <TextField
              label="Slug"
              required
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
              error={formErrors.slug}
              hint="Lowercase letters, numbers, and hyphens only"
              placeholder="electronics"
            />
            <FormField label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Laptops, monitors, and accessories"
              />
            </FormField>
            <TextField
              label="Sort Order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
            />
          </div>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete category?"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? Listings in this category will become uncategorized.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleting}
        />
      </div>
    </ProtectedComponent>
  );
}
