'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button, Badge, DataTable, type Column, KPICard, Spinner } from '@unerp/ui';
import { ArrowLeftRight, DollarSign, Package, Truck } from 'lucide-react';

interface VendorReturn {
  id: string;
  shipmentNumber: string;
  carrier: string | null;
  trackingNumber: string | null;
  status: string;
  creditAmount: number | null;
  creditMemoRef: string | null;
  notes: string | null;
  createdAt: string;
}

interface VendorReturnStats {
  totalReturns: number;
  totalCreditAmount: number;
  statusCounts: Record<string, number>;
}

export default function VendorReturnsTab() {
  const [returns, setReturns] = useState<VendorReturn[]>([]);
  const [stats, setStats] = useState<VendorReturnStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, resStats] = await Promise.all([
        fetch('/api/supply-chain/vendor-returns?limit=50'),
        fetch('/api/supply-chain/vendor-returns/stats'),
      ]);
      if (resData.ok) {
        const body = await resData.json();
        setReturns(body.items || []);
      }
      if (resStats.ok) {
        setStats(await resStats.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<VendorReturn>[] = [
    { key: 'shipmentNumber', header: 'Shipment #', render: (r) => <span className="font-mono">{r.shipmentNumber}</span> },
    { key: 'carrier', header: 'Carrier', render: (r) => r.carrier || '—' },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'DELIVERED' ? 'success' : r.status === 'SHIPPED' ? 'info' : 'warning'}>{r.status}</Badge> },
    { key: 'creditAmount', header: 'Credit', align: 'right', render: (r) => r.creditAmount ? `$${Number(r.creditAmount).toLocaleString()}` : '—' },
    { key: 'createdAt', header: 'Created', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (loading) return <div className="ui-p-8 ui-text-center"><Spinner size="lg" /></div>;

  return (
    <div className="ui-stack-4">
      {stats && (
        <div className="ui-grid-auto">
          <KPICard title="Total Returns" value={String(stats.totalReturns)} icon={<ArrowLeftRight size={18} />} color="var(--color-primary)" />
          <KPICard title="Total Credit" value={`$${stats.totalCreditAmount.toLocaleString()}`} icon={<DollarSign size={18} />} color="var(--color-success)" />
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <KPICard key={status} title={status} value={String(count)} icon={status === 'DELIVERED' ? <Package size={18} /> : <Truck size={18} />}
              color={status === 'DELIVERED' ? 'var(--color-success)' : status === 'LOST' ? 'var(--color-danger)' : 'var(--color-info)'} />
          ))}
        </div>
      )}

      <Card title="Vendor Returns">
        <DataTable columns={columns} data={returns} rowKey={(r: VendorReturn) => r.id} />
      </Card>
    </div>
  );
}
