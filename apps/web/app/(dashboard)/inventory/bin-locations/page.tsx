'use client';
import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { FormView, ListView, RouteGuard } from '@unerp/framework';
import { binLocationResource } from '@/modules/inventory';

export default function BinLocationsPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="inventory.warehouse.read">
      <div className="ui-card">
        <PageHeader title="Bin Locations" description="Manage warehouse zones, aisles, racks, and bin capacity." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Bin Locations' }]} />
        <ListView resource={binLocationResource} onCreate={() => setShowCreate(true)} />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Bin Location">
          <FormView resource={binLocationResource} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </Modal>
      </div>
    </RouteGuard>
  );
}
