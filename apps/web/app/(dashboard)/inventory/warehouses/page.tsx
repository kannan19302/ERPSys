'use client';
import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { warehouseResource } from '@/modules/inventory';

export default function WarehousesPage() {
  const [editorId, setEditorId] = useState<string | null | undefined>(undefined); // undefined = closed, null = create

  return (
    <RouteGuard permission="inventory.warehouse.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Warehouse Directory"
          description="Manage storage locations, transit hubs, and stock distribution sites."
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Inventory', href: '/inventory' },
            { label: 'Warehouses' },
          ]}
        />

        <ListView
          resource={warehouseResource}
          onRowClick={(row) => setEditorId(String(row.id))}
          onCreate={() => setEditorId(null)}
        />

        <Modal
          open={editorId !== undefined}
          onClose={() => setEditorId(undefined)}
          title={editorId ? 'Edit Warehouse' : 'New Warehouse'}
        >
          <FormView
            resource={warehouseResource}
            id={editorId ?? undefined}
            onSuccess={() => setEditorId(undefined)}
            onCancel={() => setEditorId(undefined)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
