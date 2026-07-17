'use client';

import { PageHeader } from '@unerp/ui';
import { ListView, RouteGuard } from '@unerp/framework';
import { financeAuditResource } from '@/modules/finance-audit';

export default function FinanceAuditTrailPage() {
  return (
    <RouteGuard permission="finance.audit.read">
      <div className="ui-card">
        <PageHeader title="Finance Audit Trail" description="Track changes to financial records for compliance and auditing." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Audit Trail' }]} />
        <ListView resource={financeAuditResource} />
      </div>
    </RouteGuard>
  );
}
