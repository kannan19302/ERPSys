'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { accountResource } from '@/modules/finance';

export default function ChartOfAccountsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="finance.account.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Chart of Accounts"
          description="Manage general ledger accounts, hierarchy, and financial categories"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Chart of Accounts' }]}
        />

        <ListView
          resource={accountResource}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Account">
          <FormView
            resource={accountResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
