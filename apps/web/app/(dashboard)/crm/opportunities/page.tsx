'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { opportunityResource } from '@/modules/crm';

export default function OpportunitiesPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="crm.opportunity.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Opportunities"
          description="Track sales deals and pipeline progress"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Opportunities' }]}
        />

        <ListView
          resource={opportunityResource}
          onRowClick={(row) => router.push(`/crm/opportunities/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Opportunity">
          <FormView
            resource={opportunityResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}