'use client';

import { useState } from 'react';
import { Modal, PageHeader } from '@unerp/ui';
import { ListView, FormView, RouteGuard } from '@unerp/framework';
import { activityResource } from '@/modules/crm';

export default function ActivitiesPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="crm.activity.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Activities"
          description="Track all customer communications, meetings, calls, and tasks"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Activities' }]}
        />

        <ListView
          resource={activityResource}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Log Activity">
          <FormView
            resource={activityResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}