'use client';
import { PageHeader } from '@unerp/ui';
import { useRouter } from 'next/navigation';
import { ListView, RouteGuard } from '@unerp/framework';
import { customerResource } from '@/modules/crm';

export default function FieldServiceCustomersPage() {
  const router = useRouter();
  return (
    <RouteGuard permission="crm.customer.read">
      <div className="ui-card">
        <PageHeader title="Field Service Customers" description="Use the shared customer master for field-service accounts and support activity." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Field Service', href: '/field-service' }, { label: 'Customers' }]} />
        <ListView resource={customerResource} onRowClick={(row) => router.push(`/crm/customers/${row.id}`)} />
      </div>
    </RouteGuard>
  );
}
