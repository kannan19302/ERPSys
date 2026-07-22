'use client';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, Disclosure,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Plus, Search, ClipboardCheck, ChevronDown } from 'lucide-react';

interface AssessmentFinding {
  area: string;
  finding: string;
  severity: string;
}

interface Assessment {
  id: string;
  vendor: string;
  assessmentType: string;
  status: string;
  score: number;
  rating: string;
  assessor: string;
  date: string;
  findings: AssessmentFinding[];
  recommendations: string;
}

const ratingVariant = (r: string) => {
  if (r === 'EXCELLENT') return 'success';
  if (r === 'GOOD') return 'info';
  if (r === 'AVERAGE') return 'warning';
  if (r === 'POOR') return 'danger';
  return 'default';
};

export default function SupplierAssessmentsPage() {
  const client = useApiClient();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorFilter, setVendorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ vendor: '', assessmentType: 'AUDIT', status: 'DRAFT', score: 0, assessor: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await client.get<Assessment[]>('/supply-chain/supplier-assessments');
        setAssessments(data ?? []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor || !form.assessor) return;
    setSaving(true);
    try {
      const created = await client.post<Assessment>('/supply-chain/supplier-assessments', form);
      setAssessments((prev) => [created, ...prev]);
      setCreateOpen(false);
      setForm({ vendor: '', assessmentType: 'AUDIT', status: 'DRAFT', score: 0, assessor: '' });
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const filtered = assessments.filter((a) => {
    const matchVendor = !vendorFilter || a.vendor.toLowerCase().includes(vendorFilter.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchVendor && matchStatus;
  });

  const vendors = [...new Set(assessments.map((a) => a.vendor))];

  const columns: Column<Assessment>[] = [
    { key: 'vendor', header: 'Vendor', sortable: true },
    { key: 'assessmentType', header: 'Assessment Type', sortable: true, render: (row) => <Badge variant="info">{row.assessmentType.replace(/_/g, ' ')}</Badge> },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'score', header: 'Score', sortable: true, render: (row) => <span className="ui-text-bold">{row.score}%</span> },
    { key: 'rating', header: 'Rating', render: (row) => <Badge variant={ratingVariant(row.rating)}>{row.rating}</Badge> },
    { key: 'assessor', header: 'Assessor' },
    { key: 'date', header: 'Date', sortable: true, render: (row) => new Date(row.date).toLocaleDateString() },
  ];

  const severityColor = (s: string) => {
    if (s === 'HIGH') return 'var(--danger-600)';
    if (s === 'MEDIUM') return 'var(--warning-600)';
    return 'var(--neutral-500)';
  };

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="supply-chain.supplier-assessments.read">
    <div className="ui-stack-6">
      <PageHeader title="Supplier Assessments" description="Audit and evaluation records for supplier compliance and quality"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Supplier Assessments' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Assessment</Button>}
      />

      <Card>
        <div className="ui-flex ui-gap-3 ui-items-center">
          <div className="ui-search-wrapper">
            <Search size={16} className="ui-search-icon" />
            <input type="text" placeholder="Filter by vendor..." value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="ui-input" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
          emptyTitle="No assessments" emptyMessage="Create your first supplier assessment." emptyIcon={<ClipboardCheck size={48} />} />
      </Card>

      {expandedId && (() => {
        const a = assessments.find((x) => x.id === expandedId);
        if (!a) return null;
        return (
          <Card key={a.id}>
            <div className="ui-stack-3">
              <h4 className="ui-heading-sm">Assessment Details — {a.vendor}</h4>
              {a.findings && a.findings.length > 0 && (
                <div>
                  <div className="ui-text-xs-tertiary ui-uppercase" style={{ marginBottom: '0.5rem' }}>Findings</div>
                  {a.findings.map((f, i) => (
                    <div key={i} className="ui-flex ui-gap-2" style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor(f.severity), marginTop: '0.35rem', flexShrink: 0 }} />
                      <div className="ui-flex-1">
                        <div className="ui-text-sm-bold">{f.area}</div>
                        <div className="ui-text-xs-muted">{f.finding}</div>
                      </div>
                      <Badge variant={f.severity === 'HIGH' ? 'danger' : f.severity === 'MEDIUM' ? 'warning' : 'default'}>{f.severity}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {a.recommendations && (
                <div>
                  <div className="ui-text-xs-tertiary ui-uppercase" style={{ marginBottom: '0.25rem' }}>Recommendations</div>
                  <p className="ui-text-sm-muted">{a.recommendations}</p>
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Assessment" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={saving}>{saving ? 'Saving...' : 'Create Assessment'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField label="Vendor" required placeholder="Acme Corp" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
          <div className="ui-grid-2 ui-gap-3">
            <FormField label="Assessment Type"><Select value={form.assessmentType} onChange={e => setForm({ ...form, assessmentType: e.target.value })}>
              <option value="AUDIT">Audit</option><option value="QUALITY_REVIEW">Quality Review</option><option value="COMPLIANCE_CHECK">Compliance Check</option><option value="PERFORMANCE_REVIEW">Performance Review</option>
            </Select></FormField>
            <TextField label="Score (%)" type="number" min={0} max={100} value={form.score || ''} onChange={e => setForm({ ...form, score: parseInt(e.target.value) || 0 })} />
          </div>
          <TextField label="Assessor" required placeholder="John Doe" value={form.assessor} onChange={e => setForm({ ...form, assessor: e.target.value })} />
        </form>
      </Modal>
    </div>
    </RouteGuard>
  );
}
