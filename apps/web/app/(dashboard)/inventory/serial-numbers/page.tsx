'use client';
import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { FormView, ListView, RouteGuard } from '@unerp/framework';
import { serialNumberResource } from '@/modules/inventory';

export default function SerialNumbersPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="inventory.stock.read">
      <div className="ui-card">
        <PageHeader title="Serial Numbers" description="Track serialized inventory, status, warehouse assignment, and warranty dates." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Serial Numbers' }]} />
        <ListView resource={serialNumberResource} onCreate={() => setShowCreate(true)} />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Serial Number">
          <FormView resource={serialNumberResource} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </Modal>
      </div>
    </RouteGuard>
  );
}
