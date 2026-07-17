'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { bankAccountResource } from '@/modules/finance';

export default function BankAccountsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="finance.bankaccount.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Bank Accounts"
          description="Manage treasury, bank accounts, and corporate cash ledger"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Bank Accounts' }]}
        />

        <ListView
          resource={bankAccountResource}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Bank Account">
          <FormView
            resource={bankAccountResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
