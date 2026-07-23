'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Badge, KPICard, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Globe, RefreshCw, Search } from 'lucide-react';

interface GlobalInventoryView {
  id: string; productId: string; productSku: string; productName: string;
  totalOnHand: number; totalAvailable: number; totalReserved: number;
  warehouseCount: number; lastUpdated: string;
}

export default function GlobalInventoryPage() {
  const client = useApiClient();
  const [data, setData] = useState<GlobalInventoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<GlobalInventoryView[]>('/inventory/global-inventory');
      setData(res);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await client.get<GlobalInventoryView[]>('/inventory/global-inventory');
      setData(res);
    } catch { /* empty */ }
    finally { setRefreshing(false); }
  };

  const totalOnHand = data.reduce((s, i) => s + i.totalOnHand, 0);
  const totalWarehouses = [...new Set(data.map(i => i.warehouseCount))].reduce((a, b) => a + b, 0);

  const filtered = data.filter(i => !search || i.productName.toLowerCase().includes(search.toLowerCase()) || i.productSku.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<GlobalInventoryView>[] = [
    { key: 'productSku', header: 'SKU' },
    { key: 'productName', header: 'Product' },
    { key: 'totalOnHand', header: 'On Hand' },
    { key: 'totalAvailable', header: 'Available' },
    { key: 'totalReserved', header: 'Reserved' },
    { key: 'warehouseCount', header: 'Warehouses' },
    { key: 'lastUpdated', header: 'Last Updated', render: (r) => new Date(r.lastUpdated).toLocaleString() },
  ];

  return (
    <div className="ui-page">
      <PageHeader title="Global Inventory" description="Multi-warehouse inventory visibility"
        actions={<Button variant="secondary" onClick={refresh} disabled={refreshing}><RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh</Button>} />
      <div className="ui-grid-4" style={{ marginBottom: '1.5rem' }}>
        <KPICard title="Total Products" value={data.length} icon={<Globe size={20} />} color="var(--primary-600)" />
        <KPICard title="Total On Hand" value={totalOnHand.toLocaleString()} icon={<Globe size={20} />} color="var(--success-600)" />
        <KPICard title="Total Warehouses" value={totalWarehouses} icon={<Globe size={20} />} color="var(--info-600)" />
      </div>
      <Card>
        <div className="ui-flex ui-gap-2" style={{ marginBottom: '1rem' }}>
          <div className="ui-flex-1"><input type="text" placeholder="Search by SKU or name..." value={search} onChange={e => setSearch(e.target.value)} className="ui-input" /></div>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} rowKey={r => r.id}
          emptyTitle="No inventory data" emptyMessage="Global inventory view will populate as products and stock are created."
          emptyIcon={<Globe size={48} />} />
      </Card>
    </div>
  );
}
