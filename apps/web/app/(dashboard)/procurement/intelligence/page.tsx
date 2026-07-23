'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Badge, KPICard, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface Intelligence {
  id: string; category: string; reportName: string; reportPeriod: string;
  totalSpend: number | null; totalSavings: number | null; savingsPct: number | null;
  poCount: number | null; supplierCount: number | null; createdAt: string;
}

export default function IntelligencePage() {
  const client = useApiClient();
  const [data, setData] = useState<Intelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await client.get('/procurement/procurement-intelligence')); }
    catch { /* empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateSpendAnalysis = async () => {
    setGenerating(true);
    try { await client.post('/procurement/procurement-intelligence/spend-analysis'); fetchData(); }
    catch { /* empty */ }
    finally { setGenerating(false); }
  };

  const generateConcentration = async () => {
    setGenerating(true);
    try { await client.post('/procurement/procurement-intelligence/supplier-concentration'); fetchData(); }
    catch { /* empty */ }
    finally { setGenerating(false); }
  };

  const totalSpend = data.reduce((s, r) => s + Number(r.totalSpend || 0), 0);
  const totalSavings = data.reduce((s, r) => s + Number(r.totalSavings || 0), 0);

  const columns: Column<Intelligence>[] = [
    { key: 'reportName', header: 'Report' },
    { key: 'category', header: 'Category', render: (r) => <Badge>{r.category.replace(/_/g, ' ')}</Badge> },
    { key: 'reportPeriod', header: 'Period' },
    { key: 'totalSpend', header: 'Total Spend', render: (r) => r.totalSpend ? `$${Number(r.totalSpend).toLocaleString()}` : '—' },
    { key: 'totalSavings', header: 'Savings', render: (r) => r.totalSavings ? `$${Number(r.totalSavings).toLocaleString()}` : '—' },
    { key: 'savingsPct', header: 'Savings %', render: (r) => r.savingsPct ? `${r.savingsPct}%` : '—' },
    { key: 'poCount', header: 'POs' },
    { key: 'supplierCount', header: 'Suppliers' },
    { key: 'createdAt', header: 'Generated', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (loading) return <div className="ui-page"><PageHeader title="Procurement Intelligence" /><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div></div>;

  return (
    <div className="ui-page">
      <PageHeader title="Procurement Intelligence" description="Spend analysis, supplier concentration, and savings tracking"
        actions={<div className="ui-flex ui-gap-2"><Button variant="secondary" onClick={generateSpendAnalysis} disabled={generating}><TrendingUp size={14} /> Generate Spend Analysis</Button><Button variant="secondary" onClick={generateConcentration} disabled={generating}><Activity size={14} /> Supplier Concentration</Button></div>} />
      <div className="ui-grid-4" style={{ marginBottom: '1.5rem' }}>
        <KPICard title="Total Spend (All Reports)" value={`$${totalSpend.toLocaleString()}`} icon={<DollarSign size={20} />} color="var(--primary-600)" />
        <KPICard title="Total Identified Savings" value={`$${totalSavings.toLocaleString()}`} icon={<TrendingUp size={20} />} color="var(--success-600)" />
        <KPICard title="Reports Generated" value={data.length} icon={<BarChart3 size={20} />} color="var(--info-600)" />
      </div>
      <Card>
        <DataTable columns={columns} data={data} rowKey={r => r.id}
          emptyTitle="No intelligence reports" emptyMessage="Generate your first spend analysis or supplier concentration report."
          emptyIcon={<BarChart3 size={48} />} />
      </Card>
    </div>
  );
}
