'use client';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, Tabs,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Plus, TrendingUp, Target, Star, BarChart3 } from 'lucide-react';

interface KpiDefinition {
  id: string;
  name: string;
  category: string;
  target: number;
  weight: number;
  unit: string;
}

interface Scorecard {
  id: string;
  vendor: string;
  period: string;
  overallScore: number;
  rating: string;
  date: string;
}

const ratingVariant = (r: string) => {
  if (r === 'EXCELLENT') return 'success';
  if (r === 'GOOD') return 'info';
  if (r === 'AVERAGE') return 'warning';
  return 'danger';
};

export default function SupplierPerformancePage() {
  const client = useApiClient();
  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [vendorTrend, setVendorTrend] = useState('');
  const [kpiForm, setKpiForm] = useState({ name: '', category: 'QUALITY', target: 0, weight: 0, unit: '%' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [kpiData, scoreData] = await Promise.all([
          client.get<KpiDefinition[]>('/supply-chain/supplier-performance/kpis'),
          client.get<Scorecard[]>('/supply-chain/supplier-performance/scorecards'),
        ]);
        setKpis(kpiData ?? []);
        setScorecards(scoreData ?? []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreateKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiForm.name) return;
    setSaving(true);
    try {
      const created = await client.post<KpiDefinition>('/supply-chain/supplier-performance/kpis', kpiForm);
      setKpis((prev) => [...prev, created]);
      setShowKpiForm(false);
      setKpiForm({ name: '', category: 'QUALITY', target: 0, weight: 0, unit: '%' });
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const handleCalculateScorecard = async () => {
    setSaving(true);
    try {
      const created = await client.post<Scorecard>('/supply-chain/supplier-performance/calculate', {});
      setScorecards((prev) => [created, ...prev]);
      setShowScoreModal(false);
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const kpiColumns: Column<KpiDefinition>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'category', header: 'Category', sortable: true, render: (row) => <Badge variant="info">{row.category}</Badge> },
    { key: 'target', header: 'Target', sortable: true, render: (row) => `${row.target}${row.unit}` },
    { key: 'weight', header: 'Weight', sortable: true, render: (row) => `${row.weight}%` },
    {
      key: 'actions', header: 'Actions', align: 'right',
      render: (row) => (
        <div className="ui-flex ui-gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="ui-btn-icon" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button className="ui-btn-icon ui-text-danger" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      ),
    },
  ];

  const scoreColumns: Column<Scorecard>[] = [
    { key: 'vendor', header: 'Vendor', sortable: true },
    { key: 'period', header: 'Period', sortable: true },
    { key: 'overallScore', header: 'Overall Score', sortable: true, render: (row) => <span className="ui-text-bold">{row.overallScore}%</span> },
    { key: 'rating', header: 'Rating', render: (row) => <Badge variant={ratingVariant(row.rating)}>{row.rating}</Badge> },
    { key: 'date', header: 'Date', sortable: true, render: (row) => new Date(row.date).toLocaleDateString() },
  ];

  const filteredScorecards = vendorTrend ? scorecards.filter((s) => s.vendor === vendorTrend) : scorecards;
  const vendors = [...new Set(scorecards.map((s) => s.vendor))];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="supply-chain.supplier-performance.read">
    <div className="ui-stack-6">
      <PageHeader title="Supplier Performance" description="KPI definitions, scorecards, and vendor performance tracking"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Supplier Performance' }]}
        actions={
          <div className="ui-flex ui-gap-2">
            <Button variant="secondary" onClick={() => setShowKpiForm(true)}><Plus size={14} /> Add KPI</Button>
            <Button variant="primary" onClick={() => setShowScoreModal(true)}><TrendingUp size={14} /> Calculate Scorecard</Button>
          </div>
        }
      />

      <Card>
        <div className="ui-flex ui-gap-3 ui-items-center" style={{ marginBottom: '0.5rem' }}>
          <Target size={18} className="ui-text-secondary" />
          <h3 className="ui-heading-sm" style={{ margin: 0 }}>KPI Definitions</h3>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={kpiColumns} data={kpis} rowKey={r => r.id}
          emptyTitle="No KPIs defined" emptyMessage="Add KPIs to start tracking supplier performance." emptyIcon={<Target size={48} />} />
      </Card>

      <Card>
        <div className="ui-flex ui-gap-3 ui-items-center" style={{ marginBottom: '0.5rem' }}>
          <BarChart3 size={18} className="ui-text-secondary" />
          <h3 className="ui-heading-sm" style={{ margin: 0 }}>Scorecard History</h3>
          <div className="ui-flex-1" />
          {vendors.length > 0 && (
            <Select value={vendorTrend} onChange={(e) => setVendorTrend(e.target.value)}>
              <option value="">All Vendors</option>
              {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          )}
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={scoreColumns} data={filteredScorecards} rowKey={r => r.id}
          emptyTitle="No scorecards" emptyMessage="Calculate a scorecard to begin tracking performance." emptyIcon={<Star size={48} />} />
      </Card>

      <Modal open={showKpiForm} onClose={() => setShowKpiForm(false)} title="Add KPI Definition" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowKpiForm(false)}>Cancel</Button><Button variant="primary" onClick={handleCreateKpi as any} disabled={saving}>{saving ? 'Saving...' : 'Add KPI'}</Button></>}>
        <form onSubmit={handleCreateKpi} className="ui-stack-4">
          <TextField label="KPI Name" required placeholder="On-Time Delivery" value={kpiForm.name} onChange={e => setKpiForm({ ...kpiForm, name: e.target.value })} />
          <FormField label="Category"><Select value={kpiForm.category} onChange={e => setKpiForm({ ...kpiForm, category: e.target.value })}>
            <option value="QUALITY">Quality</option><option value="DELIVERY">Delivery</option><option value="COST">Cost</option><option value="COMPLIANCE">Compliance</option>
          </Select></FormField>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Target" type="number" min={0} step={0.1} value={kpiForm.target || ''} onChange={e => setKpiForm({ ...kpiForm, target: parseFloat(e.target.value) || 0 })} />
            <TextField label="Weight (%)" type="number" min={0} max={100} value={kpiForm.weight || ''} onChange={e => setKpiForm({ ...kpiForm, weight: parseFloat(e.target.value) || 0 })} />
          </div>
          <FormField label="Unit"><Select value={kpiForm.unit} onChange={e => setKpiForm({ ...kpiForm, unit: e.target.value })}>
            <option value="%">Percentage (%)</option><option value="days">Days</option><option value="points">Points</option><option value="$">Currency ($)</option>
          </Select></FormField>
        </form>
      </Modal>

      <Modal open={showScoreModal} onClose={() => setShowScoreModal(false)} title="Calculate Scorecard" size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowScoreModal(false)}>Cancel</Button><Button variant="primary" onClick={handleCalculateScorecard} disabled={saving}>{saving ? 'Calculating...' : 'Calculate'}</Button></>}>
        <p className="ui-text-sm-muted">This will calculate performance scorecards for all active vendors based on current KPI definitions and their latest data.</p>
      </Modal>
    </div>
    </RouteGuard>
  );
}
