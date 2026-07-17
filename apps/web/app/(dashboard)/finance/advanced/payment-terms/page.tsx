'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { paymentTermResource } from '@/modules/finance';

export default function PaymentTermsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="finance.paymentterm.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Payment Terms"
          description="Configure payment schedules, due day intervals, and early payment discounts"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Payment Terms' }]}
        />

        <ListView
          resource={paymentTermResource}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Payment Term">
          <FormView
            resource={paymentTermResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
