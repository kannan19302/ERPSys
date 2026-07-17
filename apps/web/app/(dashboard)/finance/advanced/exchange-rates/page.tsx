'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { FormView, ListView, RouteGuard } from '@unerp/framework';
import { exchangeRateResource } from '@/modules/advanced-finance';

export default function ExchangeRatesPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="finance.treasury.read">
      <div className="ui-card">
        <PageHeader title="Multi-Currency & Exchange Rates" description="Manage exchange rates for multi-currency transactions and revaluation." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Exchange Rates' }]} />
        <ListView resource={exchangeRateResource} onCreate={() => setShowCreate(true)} />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Exchange Rate">
          <FormView resource={exchangeRateResource} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </Modal>
      </div>
    </RouteGuard>
  );
}
