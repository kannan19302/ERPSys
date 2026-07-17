'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, PageHeader, KPICard } from '@unerp/ui';
import { CheckCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { ListView, FormView, RouteGuard, useApiClient } from '@unerp/framework';
import { contractResource } from '@/modules/crm';

interface ContractStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  totalActiveValue: number;
}

export default function ContractsPage() {
  const router = useRouter();
  const client = useApiClient();
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState<ContractStats | null>(null);

  const fetchStats = () => {
    client.get('/crm/contracts/stats')
      .then((data: any) => setStats(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
  }, [client]);

  return (
    <RouteGuard permission="crm.contracts.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Contracts"
          description="Manage customer and vendor contracts, track renewals, and monitor contract value."
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Contracts' }]}
        />

        <div className="ui-grid-auto">
          <KPICard title="Active Contracts" value={stats?.active ?? 0} icon={<CheckCircle size={18} />} color="var(--color-success)" />
          <KPICard title="Expiring Soon" value={stats?.expiringSoon ?? 0} icon={<Clock size={18} />} color="var(--color-warning)" />
          <KPICard title="Total Contract Value" value={`$${(stats?.totalActiveValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<DollarSign size={18} />} color="var(--color-primary)" />
          <KPICard title="Expired" value={stats?.expired ?? 0} icon={<AlertCircle size={18} />} color="var(--color-danger)" />
        </div>

        <ListView
          resource={contractResource}
          onRowClick={(row) => router.push(`/crm/contracts/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Contract">
          <FormView
            resource={contractResource}
            onSuccess={() => {
              setShowCreate(false);
              fetchStats();
            }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
