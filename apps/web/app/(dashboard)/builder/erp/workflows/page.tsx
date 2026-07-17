'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import {
  GitFork,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  Play,
  Pause,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  docType?: string;
  trigger: string;
  status: string;
  nodes: any[];
  updatedAt: string;
}

export default function WorkflowsPage() {
  const client = useApiClient();

  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await client.get<Workflow[] | { data?: Workflow[] }>('/builder/workflows');
      setWorkflows(Array.isArray(data) ? data : data.data || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    window.addEventListener('unerp_page_registry_updated', fetchWorkflows);
    return () => window.removeEventListener('unerp_page_registry_updated', fetchWorkflows);
  }, [client]);

  const executeDelete = async (id: string) => {
    try {
      await client.delete(`/builder/workflows/${id}`);
      fetchWorkflows();
    } catch { /* ignore */ }
  };

  const handleToggleStatus = async (wf: Workflow) => {
    const newStatus = wf.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await client.patch(`/builder/workflows/${wf.id}`, { status: newStatus });
      fetchWorkflows();
    } catch { /* ignore */ }
  };

  const filtered = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const triggerBadge = (trigger: string) => {
    const colors: Record<string, string> = {
      SUBMIT: '#3b82f6',
      CREATE: '#10b981',
      UPDATE: '#f59e0b',
      MANUAL: '#8b5cf6',
    };
    return (
      <span style={{ background: `${colors[trigger] || '#64748b'}20`, color: colors[trigger] || '#64748b' }} className={styles.s1}>
        {trigger}
      </span>
    );
  };

  return (
    <div className="p-6 ui-stack-5">
      {/* Header */}
      <PageHeader
        title="Workflow Builder"
        description="Design approval chains, automation flows, and business process workflows"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/erp')}>
              ← App Studio
            </button>
            <button className="ui-btn ui-btn-primary" onClick={() => router.push('/builder/erp/workflows/new')}>
              <PlusCircle size={15} />
              <span>New Workflow</span>
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="builder-stats-grid">
        {[
          { label: 'Total Workflows', value: workflows.length.toString(), icon: GitFork, color: '#7c3aed' },
          { label: 'Active', value: workflows.filter(w => w.status === 'ACTIVE').length.toString(), icon: Play, color: '#10b981' },
          { label: 'Paused', value: workflows.filter(w => w.status === 'PAUSED').length.toString(), icon: Pause, color: '#f59e0b' },
          { label: 'Drafts', value: workflows.filter(w => w.status === 'DRAFT').length.toString(), icon: Edit3, color: '#64748b' },
        ].map(stat => (
          <div key={stat.label} className={`ui-card ${styles.s2}`} >
            <div style={{ background: `${stat.color}20` }} className={styles.s3}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p className={styles.s4}>{stat.value}</p>
              <p className="ui-text-xs-muted m-0">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className={styles.s5}>
        <Search size={15} className="ui-input-icon-abs" />
        <input className={`ui-input ${styles.s6}`} type="text" placeholder="Search workflows..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}  />
      </div>

      {/* Workflow Cards */}
      {loading ? (
        <div className={styles.s7}>Loading workflows...</div>
      ) : filtered.length === 0 ? (
        <div className={`ui-card ${styles.s8}`} >
          <GitFork size={40} className={styles.s9} />
          <p className="ui-text-muted">No workflows found. Create your first approval workflow!</p>
        </div>
      ) : (
        <div className={styles.s10}>
          {filtered.map(wf => (
            <div key={wf.id} className={`ui-card ${styles.s11} ${styles.workflowCard}`}>
              <div className={styles.s12}>
                <div className="ui-hstack-2">
                  <div className={styles.s13}>
                    <GitFork size={16} className={styles.s14} />
                  </div>
                  <div>
                    <p className={styles.s15}>{wf.name}</p>
                    {wf.description && <p className="ui-text-xs-muted m-0">{wf.description}</p>}
                  </div>
                </div>
                <button onClick={() => handleToggleStatus(wf)} style={{ color: wf.status === 'ACTIVE' ? '#10b981' : '#94a3b8' }} className={styles.s16}>
                  {wf.status === 'ACTIVE' ? <Play size={16} /> : <Pause size={16} />}
                </button>
              </div>

              <div className={styles.s17}>
                {triggerBadge(wf.trigger)}
                <span style={{ background: wf.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: wf.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s1}>
                  {wf.status}
                </span>
                {wf.docType && (
                  <span className={styles.s18}>
                    {wf.docType}
                  </span>
                )}
              </div>

              <div className={styles.s19}>
                <Clock size={12} className="ui-text-tertiary" />
                <span className="ui-text-xs-tertiary">
                  {wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
                <span className={styles.s20}>
                  {Array.isArray(wf.nodes) ? wf.nodes.length : 0} steps
                </span>
              </div>

              <div className="ui-flex ui-gap-1">
                <button className={`ui-btn ui-btn-secondary ${styles.s21}`}  onClick={() => router.push(`/builder/erp/workflows/${wf.id}`)}>
                  <Edit3 size={13} /> <span>Edit</span>
                </button>
                <button className={`ui-btn ui-btn-secondary ${styles.s22}`}  onClick={() => router.push(`/builder/erp/workflows/${wf.id}?preview=true`)}>
                  <Eye size={13} />
                </button>
                <button className={`ui-btn ${styles.s23}`}  onClick={() => setDeleteTarget(wf.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDelete(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
