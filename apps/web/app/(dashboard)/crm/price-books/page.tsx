'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { priceBookResource } from '@/modules/crm';

export default function PriceBooksPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="crm.pricebook.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Price Books"
          description="Manage standard and custom price lists for products"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Price Books' }]}
        />

        <ListView
          resource={priceBookResource}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Price Book">
          <FormView
            resource={priceBookResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
