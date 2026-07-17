'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { caseResource } from '@/modules/crm';

export default function CasesPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="crm.cases.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Cases"
          description="Track customer support and operations cases"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Cases' }]}
        />

        <ListView
          resource={caseResource}
          onRowClick={(row) => router.push(`/crm/cases/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Case">
          <FormView
            resource={caseResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
