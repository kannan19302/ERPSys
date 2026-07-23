'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Modal, TextField, Select, FormField, Badge, StatusBadge, KPICard, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Plus, Shield, Search, AlertTriangle } from 'lucide-react';

interface RiskProfile {
  id: string; vendorId: string; vendorName: string | null; overallRiskScore: number;
  riskCategory: string; financialHealth: number | null; geopoliticalRisk: number | null;
  operationalRisk: number | null; complianceRisk: number | null; qualityRisk: number | null;
  concentrationRisk: number | null; factors: any[]; alerts: any[]; diversity: any;
}

export default function SupplierRiskPage() {
  const client = useApiClient();
  const [data, setData] = useState<RiskProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [heatmap, setHeatmap] = useState<any>(null);

  const limit = 20;
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profiles, hm] = await Promise.all([
        client.get<{ data: RiskProfile[]; total: number }>(`/supply-chain/supplier-risk-profiles?page=${page}&limit=${limit}`),
        client.get('/supply-chain/supplier-risk-heatmap').catch(() => null),
      ]);
      setData(profiles.data); setTotal(profiles.total); setHeatmap(hm);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [client, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const riskVariant = (score: number): 'danger' | 'warning' | 'success' => {
    if (score >= 70) return 'danger'; if (score >= 40) return 'warning'; return 'success';
  };

  const columns: Column<RiskProfile>[] = [
    { key: 'vendorName', header: 'Vendor', render: (r) => r.vendorName || r.vendorId },
    { key: 'overallRiskScore', header: 'Risk Score', render: (r) => <Badge variant={riskVariant(r.overallRiskScore)}>{r.overallRiskScore}</Badge> },
    { key: 'riskCategory', header: 'Category', render: (r) => <StatusBadge status={r.riskCategory} /> },
    { key: 'financialHealth', header: 'Financial', render: (r) => r.financialHealth != null ? `${r.financialHealth}/100` : '—' },
    { key: 'qualityRisk', header: 'Quality', render: (r) => r.qualityRisk != null ? `${r.qualityRisk}/100` : '—' },
    { key: 'operationalRisk', header: 'Operational', render: (r) => r.operationalRisk != null ? `${r.operationalRisk}/100` : '—' },
    { key: 'alerts', header: 'Open Alerts', render: (r) => r.alerts?.length || 0 },
  ];

  return (
    <div className="ui-page">
      <PageHeader title="Supplier Risk Management" description="Assess and monitor supplier risk profiles, alerts, and diversity" />
      {heatmap && (
        <div className="ui-grid-4" style={{ marginBottom: '1.5rem' }}>
          <KPICard title="Total Suppliers" value={heatmap.summary?.total ?? 0} icon={<Shield size={20} />} color="var(--primary-600)" />
          <KPICard title="High Risk" value={heatmap.summary?.high ?? 0} icon={<AlertTriangle size={20} />} color="var(--danger-600)" />
          <KPICard title="Medium Risk" value={heatmap.summary?.medium ?? 0} icon={<AlertTriangle size={20} />} color="var(--warning-600)" />
          <KPICard title="Avg Score" value={heatmap.summary?.averageScore ?? 0} icon={<Shield size={20} />} color="var(--info-600)" />
        </div>
      )}
      <Card>
        <TextField placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '1rem' }} />
        <DataTable columns={columns} data={data} loading={loading} rowKey={r => r.id}
          pagination={{ page, total, limit, onPageChange: setPage }}
          emptyTitle="No risk profiles" emptyMessage="Create supplier risk profiles to start monitoring." emptyIcon={<Shield size={48} />} />
      </Card>
    </div>
  );
}
