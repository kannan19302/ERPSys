'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Modal, TextField, StatusBadge } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Plus, Search, FileText } from 'lucide-react';
import Link from 'next/link';

interface Contract {
  id: string; contractNumber: string; contractName: string; contractType: string | null;
  status: string; vendorName: string | null; contractValue: number | null; currency: string;
  startDate: string | null; endDate: string | null; autoRenew: boolean; createdAt: string;
}

export default function ProcurementContractsPage() {
  const client = useApiClient();
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await client.get('/procurement/contracts')); }
    catch { /* empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(c => !search || c.contractName.toLowerCase().includes(search.toLowerCase()) || c.contractNumber.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Contract>[] = [
    { key: 'contractNumber', header: 'Contract #', render: (r) => <Link href={`/procurement/contracts/${r.id}`} className="ui-link">{r.contractNumber}</Link> },
    { key: 'contractName', header: 'Name' },
    { key: 'vendorName', header: 'Vendor' },
    { key: 'contractValue', header: 'Value', render: (r) => r.contractValue ? `${r.currency} ${Number(r.contractValue).toLocaleString()}` : '—' },
    { key: 'startDate', header: 'Start', render: (r) => r.startDate ? new Date(r.startDate).toLocaleDateString() : '—' },
    { key: 'endDate', header: 'End', render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString() : '—' },
    { key: 'autoRenew', header: 'Auto-Renew', render: (r) => r.autoRenew ? 'Yes' : 'No' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="ui-page">
      <PageHeader title="Procurement Contracts" description="Manage supplier contracts, price schedules, and volume commitments" />
      <Card>
        <TextField placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '1rem' }} />
        <DataTable columns={columns} data={filtered} loading={loading} rowKey={r => r.id}
          emptyTitle="No contracts" emptyMessage="Create your first procurement contract." emptyIcon={<FileText size={48} />} />
      </Card>
    </div>
  );
}
