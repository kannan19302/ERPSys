'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { vendorResource } from '@/modules/crm';

export default function VendorsPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="crm.vendor.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Vendors"
          description="Manage supplier and partner profiles in your CRM"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Vendors' }]}
        />

        <ListView
          resource={vendorResource}
          onRowClick={(row) => router.push(`/crm/vendors/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Vendor">
          <FormView
            resource={vendorResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
