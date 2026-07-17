'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Modal, PageHeader, ProtectedComponent, StatCardRow, useToast } from '@unerp/ui';
import { ListView, FormView, RouteGuard, useApiClient } from '@unerp/framework';
import { invoiceResource } from '@/modules/finance';
import { FileText, TrendingUp, DollarSign } from 'lucide-react';

export default function FinancePage() {
  const router = useRouter();
  const client = useApiClient();
  const { success, error } = useToast();
  const [showCreate, setShowCreate] = useState(false);

  // We can fetch key dashboard metrics dynamically or render them.
  // In framework-standard style, ListView handles list operations directly.

  return (
    <RouteGuard permission="finance.invoice.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Finance Dashboard"
          description="Track incoming billing, invoices, payments, and cash accounts"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance' }]}
        />

        <ListView
          resource={invoiceResource}
          onRowClick={(row) => router.push(`/finance/invoices/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Invoice">
          <FormView
            resource={invoiceResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
