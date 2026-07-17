'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { FormView, ListView, RouteGuard } from '@unerp/framework';
import { financialPeriodResource } from '@/modules/advanced-finance';

export default function FinancialPeriodsPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="finance.period.read">
      <div className="ui-card">
        <PageHeader title="Financial Periods" description="Create and review accounting periods used for close management." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Financial Periods' }]} />
        <ListView resource={financialPeriodResource} onCreate={() => setShowCreate(true)} />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Financial Period">
          <FormView resource={financialPeriodResource} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </Modal>
      </div>
    </RouteGuard>
  );
}
