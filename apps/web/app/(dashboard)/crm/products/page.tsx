'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { crmProductResource } from '@/modules/crm';

export default function CrmProductsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="crm.product.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Products"
          description="Manage CRM catalog products, services, and rates"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Products' }]}
        />

        <ListView
          resource={crmProductResource}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Product">
          <FormView
            resource={crmProductResource}
            onSuccess={() => setShowCreate(true)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
