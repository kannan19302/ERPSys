'use client';

import { PageHeader } from '@unerp/ui';
import { ListView, RouteGuard } from '@unerp/framework';
import { adminUserResource } from '@/modules/super-admin';

export default function AdminUsersListPage() {
  return (
    <RouteGuard permission="system.superadmin.access">
      <div className="ui-card">
        <PageHeader title="Admin Users" description="All administrator and super-admin users across tenants." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Settings', href: '/settings' }, { label: 'Super Admin' }, { label: 'Admins' }]} />
        <ListView resource={adminUserResource} />
      </div>
    </RouteGuard>
  );
}
