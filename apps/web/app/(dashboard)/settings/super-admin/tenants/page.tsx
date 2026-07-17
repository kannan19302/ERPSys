'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { FormView, ListView, RouteGuard } from '@unerp/framework';
import { tenantResource } from '@/modules/super-admin';

export default function TenantsPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="system.tenant.read">
      <div className="ui-card">
        <PageHeader title="Tenants" description="Manage platform tenant organizations and their subscription plans." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Settings', href: '/settings' }, { label: 'Super Admin' }, { label: 'Tenants' }]} />
        <ListView resource={tenantResource} onCreate={() => setShowCreate(true)} />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Provision Tenant">
          <FormView resource={tenantResource} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </Modal>
      </div>
    </RouteGuard>
  );
}
