'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, PageHeader, ProtectedComponent } from '@unerp/ui';
import { Plus, Users } from 'lucide-react';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { customerResource } from '@/modules/crm';
import { DuplicatesFinder } from '../_components/DuplicatesFinder';

// Phase 2 framework migration: schema-driven page (see .ai/UI_FRAMEWORK_PLAN.md).
// List/filter/sort/create logic lives in @unerp/framework + src/modules/crm.ts.

export default function CustomersPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  return (
    <RouteGuard permission="crm.customer.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Customers"
          description="Manage your customer accounts, credit limits, and terms"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Customers' }]}
          actions={
            <ProtectedComponent permission="crm.duplicates.scan">
              <Button variant="outline" size="sm" onClick={() => setShowDuplicates(true)}>
                <Users size={14} /> Find Duplicates
              </Button>
            </ProtectedComponent>
          }
        />

        <ListView
          resource={customerResource}
          onRowClick={(row) => router.push(`/crm/customers/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Customer">
          <FormView
            resource={customerResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>

        {showDuplicates && (
          <DuplicatesFinder entity="customers" onClose={() => setShowDuplicates(false)} onMerged={() => setShowDuplicates(false)} />
        )}
      </div>
    </RouteGuard>
  );
}
