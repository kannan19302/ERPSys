'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/builder/workflows', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(Array.isArray(data) ? data : data.data || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    window.addEventListener('unerp_page_registry_updated', fetchWorkflows);
    return () => window.removeEventListener('unerp_page_registry_updated', fetchWorkflows);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/v1/builder/workflows/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWorkflows();
    } catch { /* ignore */ }
  };

  const handleToggleStatus = async (wf: Workflow) => {
    const newStatus = wf.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/v1/builder/workflows/${wf.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
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
      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: `${colors[trigger] || '#64748b'}20`, color: colors[trigger] || '#64748b', fontWeight: 600 }}>
        {trigger}
      </span>
    );
  };

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="builder-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <GitFork size={20} style={{ color: '#7c3aed' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Workflow Builder
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Design approval chains, automation flows, and business process workflows
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>
            ← ERP Builder
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => router.push('/builder/erp/workflows/new')}>
            <PlusCircle size={15} />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="builder-stats-grid">
        {[
          { label: 'Total Workflows', value: workflows.length.toString(), icon: GitFork, color: '#7c3aed' },
          { label: 'Active', value: workflows.filter(w => w.status === 'ACTIVE').length.toString(), icon: Play, color: '#10b981' },
          { label: 'Paused', value: workflows.filter(w => w.status === 'PAUSED').length.toString(), icon: Pause, color: '#f59e0b' },
          { label: 'Drafts', value: workflows.filter(w => w.status === 'DRAFT').length.toString(), icon: Edit3, color: '#64748b' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{stat.value}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '28rem' }}>
        <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
        <input className="frappe-input" type="text" placeholder="Search workflows..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
      </div>

      {/* Workflow Cards */}
      {loading ? (
        <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading workflows...</div>
      ) : filtered.length === 0 ? (
        <div className="frappe-card" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
          <GitFork size={40} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto var(--space-3)', display: 'block', opacity: 0.3 }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>No workflows found. Create your first approval workflow!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map(wf => (
            <div key={wf.id} className="frappe-card" style={{ padding: 'var(--space-4)', transition: 'all var(--duration-fast)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: '#7c3aed20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GitFork size={16} style={{ color: '#7c3aed' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{wf.name}</p>
                    {wf.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{wf.description}</p>}
                  </div>
                </div>
                <button onClick={() => handleToggleStatus(wf)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: wf.status === 'ACTIVE' ? '#10b981' : '#94a3b8' }}>
                  {wf.status === 'ACTIVE' ? <Play size={16} /> : <Pause size={16} />}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                {triggerBadge(wf.trigger)}
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: wf.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: wf.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
                  {wf.status}
                </span>
                {wf.docType && (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: '#3b82f620', color: '#3b82f6', fontWeight: 600 }}>
                    {wf.docType}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                <Clock size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  {wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
                  {Array.isArray(wf.nodes) ? wf.nodes.length : 0} steps
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <button className="frappe-btn frappe-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1.5)' }} onClick={() => router.push(`/builder/erp/workflows/${wf.id}`)}>
                  <Edit3 size={13} /> <span>Edit</span>
                </button>
                <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }} onClick={() => router.push(`/builder/erp/workflows/${wf.id}?preview=true`)}>
                  <Eye size={13} />
                </button>
                <button className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }} onClick={() => handleDelete(wf.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}