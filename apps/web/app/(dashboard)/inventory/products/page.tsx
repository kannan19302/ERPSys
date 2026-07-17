'use client';
import styles from './page.module.css';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, PageHeader, Select } from '@unerp/ui';
import { ListView, FormView, RouteGuard, useResourceList, type FieldValues } from '@unerp/framework';
import { categoryResource, productResource } from '@/modules/inventory';

export default function InventoryProductsPage() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState('');

  const { data: categoriesResult } = useResourceList(categoryResource, { pageSize: 100 });
  const categories = useMemo(
    () => (categoriesResult?.data ?? []).map((c: FieldValues) => String(c.name)),
    [categoriesResult],
  );

  return (
    <RouteGuard permission="inventory.product.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Products Catalog"
          description="Catalog product SKUs, manage storable assets, and review multi-warehouse variants."
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Inventory', href: '/inventory' },
            { label: 'Products' },
          ]}
        />

        <ListView
          resource={productResource}
          filters={{ category: category || undefined }}
          onRowClick={(row) => router.push(`/inventory/products/${row.id}`)}
          onCreate={() => setIsCreateOpen(true)}
          toolbar={
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.s1}>
              <option value="">All categories</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          }
        />

        <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Catalog Product SKU">
          <FormView
            resource={productResource}
            onSuccess={() => setIsCreateOpen(false)}
            onCancel={() => setIsCreateOpen(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
