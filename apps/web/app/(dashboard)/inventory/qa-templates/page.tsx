'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Plus, AlertCircle, ShieldAlert } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface Template {
  id: string;
  name: string;
  isActive: boolean;
  checklist: Array<{ parameter: string; criteria: string }>;
}

const columns: ListColumn[] = [
  { key: 'name', header: 'Name' },
  {
    key: 'checklist',
    header: 'Checklist Items',
    render: (v) => String((v as unknown[])?.length ?? 0),
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Badge>,
  },
];

export default function QaTemplatesPage() {
  const client = useApiClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [inspectionId, setInspectionId] = useState('');
  const [routeResult, setRouteResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.get<Template[] | { data?: Template[] }>('/inventory/qa-inspection-templates');
      setTemplates(Array.isArray(data) ? data : data.data || []);
    } catch {
      setError('Could not load QA templates. Please try again.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/inventory/qa-inspection-templates', { name, checklist: [], isActive: true });
      setIsCreateModalOpen(false);
      loadData();
    } catch {
      setError('Could not create QA template.');
      setIsCreateModalOpen(false);
    }
  };

  const handleRouteDisposition = async () => {
    try {
      setRouteResult(await client.post(`/inventory/qa-inspections/${inspectionId}/route-disposition`));
    } catch {
      setError('Could not route inspection disposition.');
    }
  };

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="QA Inspection Templates & Disposition Routing"
        description="Reusable inspection checklists, plus routing a resolved inspection's disposition to a real downstream action (e.g. batch quarantine)."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'QA Templates' }]}
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="ui-hstack-2">
            <Plus size={14} /> New Template
          </Button>
        }
      />

      {error && (
        <div className={styles.s1}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      <Card className="p-5">
        <div className={styles.s2}>
          <ShieldAlert size={16} /> Route Disposition
        </div>
        <div className="ui-flex ui-gap-2">
          <input className="ui-input flex-1" placeholder="QA Inspection ID" value={inspectionId} onChange={(e) => setInspectionId(e.target.value)} />
          <Button variant="primary" onClick={handleRouteDisposition}>Route</Button>
        </div>
        {routeResult && <div className={styles.s3}>Action: {routeResult.action}</div>}
      </Card>

      <ListPageTemplate
        columns={columns}
        data={templates as unknown as Record<string, unknown>[]}
        loading={loading}
        searchable
      />

      {isCreateModalOpen && (
        <div className={styles.s4}>
          <div className={`ui-card modal-card ${styles.s5}`} >
            <div className={styles.s6}>
              <span className="ui-heading-base">New QA Template</span>
              <button onClick={() => setIsCreateModalOpen(false)} className="ui-btn-icon ui-text-muted">Close</button>
            </div>
            <div className="ui-card-body p-5">
              <form onSubmit={handleCreate} className="ui-stack-4">
                <div className="ui-form-group">
                  <label className="ui-label">Template Name *</label>
                  <input type="text" className="ui-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className={styles.s7}>
                  <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Create template</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
