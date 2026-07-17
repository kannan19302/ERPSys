'use client';
import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { FormView, ListView, RouteGuard } from '@unerp/framework';
import { categoryResource } from '@/modules/ecommerce';

export default function StorefrontCategoriesPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="ecommerce.category.read">
      <div className="ui-card">
        <PageHeader title="Storefront Categories" description="Organize products into customer-facing storefront categories." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'E-Commerce', href: '/ecommerce' }, { label: 'Categories' }]} />
        <ListView resource={categoryResource} onCreate={() => setShowCreate(true)} />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Storefront Category">
          <FormView resource={categoryResource} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </Modal>
      </div>
    </RouteGuard>
  );
}
