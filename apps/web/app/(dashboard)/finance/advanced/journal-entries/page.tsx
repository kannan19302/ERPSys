'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { journalResource } from '@/modules/finance';

export default function JournalEntriesPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="finance.journal.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Journal Entries"
          description="Record and post financial transactions to general ledger accounts"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Journal Entries' }]}
        />

        <ListView
          resource={journalResource}
          onRowClick={(row) => router.push(`/finance/advanced/journal-entries/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Journal Entry">
          <FormView
            resource={journalResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
