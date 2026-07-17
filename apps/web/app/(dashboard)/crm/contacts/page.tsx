'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, PageHeader, ProtectedComponent } from '@unerp/ui';
import { Users } from 'lucide-react';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { contactResource } from '@/modules/crm';
import { DuplicatesFinder } from '../_components/DuplicatesFinder';

export default function ContactsPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  return (
    <RouteGuard permission="crm.contact.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Contacts"
          description="Manage contact persons linked to your customer accounts"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Contacts' }]}
          actions={
            <ProtectedComponent permission="crm.duplicates.scan">
              <Button variant="outline" size="sm" onClick={() => setShowDuplicates(true)}>
                <Users size={14} /> Find Duplicates
              </Button>
            </ProtectedComponent>
          }
        />

        <ListView
          resource={contactResource}
          onRowClick={(row) => router.push(`/crm/contacts/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Contact">
          <FormView
            resource={contactResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>

        {showDuplicates && (
          <DuplicatesFinder entity="contacts" onClose={() => setShowDuplicates(false)} onMerged={() => setShowDuplicates(false)} />
        )}
      </div>
    </RouteGuard>
  );
}