'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, PageHeader } from '@unerp/ui';
import { FormView, ListView, RouteGuard } from '@unerp/framework';
import { employeeResource } from '@/modules/hr';

export default function HrPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="hr.employee.read">
      <div className="ui-card">
        <PageHeader
          title="Human Resources"
          description="Manage employee records, departments, employment types, and workforce status."
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Human Resources' }]}
        />
        <ListView
          resource={employeeResource}
          onRowClick={(row) => router.push(`/hr/employees/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Onboard Employee">
          <FormView resource={employeeResource} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </Modal>
      </div>
    </RouteGuard>
  );
}
