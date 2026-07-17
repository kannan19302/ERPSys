'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, PageHeader, ProtectedComponent } from '@unerp/ui';
import { Users } from 'lucide-react';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { leadResource } from '@/modules/crm';
import { DuplicatesFinder } from '../_components/DuplicatesFinder';

export default function LeadsPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  return (
    <RouteGuard permission="crm.lead.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Leads Management"
          description="Track, qualify, and convert your sales leads"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Leads' }]}
          actions={
            <ProtectedComponent permission="crm.duplicates.scan">
              <Button variant="outline" size="sm" onClick={() => setShowDuplicates(true)}>
                <Users size={14} /> Find Duplicates
              </Button>
            </ProtectedComponent>
          }
        />

        <ListView
          resource={leadResource}
          onRowClick={(row) => router.push(`/crm/leads/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Lead">
          <FormView
            resource={leadResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>

        {showDuplicates && (
          <DuplicatesFinder entity="leads" onClose={() => setShowDuplicates(false)} onMerged={() => setShowDuplicates(false)} />
        )}
      </div>
    </RouteGuard>
  );
}