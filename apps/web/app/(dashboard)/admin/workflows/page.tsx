'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Badge, Spinner, Button, DataTable, type Column,
  Tabs, EmptyState, KPICard,
} from '@unerp/ui';
import {
  GitFork, Plus, CheckCircle, XCircle, Clock, ArrowRight,
  Workflow, FileText, Users, BarChart3, Zap,
} from 'lucide-react';
import Link from 'next/link';

interface WorkflowStep {
  id: string;
  stepOrder: number;
  actionType: string;
  assigneeRole: string;
  slaLimitHours?: number;
}

interface WorkflowData {
  id: string;
  name: string;
  triggerType: string;
  isActive?: boolean;
  steps?: WorkflowStep[];
}

interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  comments?: string;
  createdAt?: string;
  step?: { actionType: string; assigneeRole: string };
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows');

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const [wfRes, appRes] = await Promise.all([
          fetch('/api/v1/workflows', { headers }),
          fetch('/api/v1/workflows/approvals', { headers }),
        ]);
        const [wfs, apps] = await Promise.all([wfRes.json(), appRes.json()]);
        setWorkflows(Array.isArray(wfs) ? wfs : wfs?.data || []);
        setApprovals(Array.isArray(apps) ? apps : apps?.data || []);
      } catch { /* use empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length;

  const workflowColumns: Column<WorkflowData>[] = [
    {
      key: 'name', header: 'Workflow',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-light)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <GitFork size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              Trigger: {row.triggerType}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'steps', header: 'Steps',
      render: (row) => <Badge variant="info">{row.steps?.length || 0} steps</Badge>,
    },
    {
      key: 'status', header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive !== false ? 'success' : 'default'}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '40px',
      render: () => <ArrowRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />,
    },
  ];

  const approvalColumns: Column<ApprovalRequest>[] = [
    {
      key: 'entity', header: 'Request',
      render: (row) => (
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{row.entityType}</div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{row.entityId}</div>
        </div>
      ),
    },
    {
      key: 'step', header: 'Step',
      render: (row) => row.step ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          {row.step.actionType} ({row.step.assigneeRole})
        </span>
      ) : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '120px',
      render: (row) => row.status === 'PENDING' ? (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={() => {}}>Approve</Button>
          <Button variant="danger" onClick={() => {}}>Reject</Button>
        </div>
      ) : null,
    },
  ];

  const subPages = [
    { title: 'Templates', href: '/admin/workflows/templates', desc: 'Pre-built workflow templates' },
    { title: 'Approvals', href: '/admin/workflows/approvals', desc: 'Approval queue management' },
    { title: 'Routing Rules', href: '/admin/workflows/routing', desc: 'Dynamic routing configuration' },
    { title: 'Escalations', href: '/admin/workflows/escalations', desc: 'SLA and escalation policies' },
    { title: 'Email Actions', href: '/admin/workflows/email', desc: 'Email-triggered workflows' },
    { title: 'Analytics', href: '/admin/workflows/analytics', desc: 'Workflow performance metrics' },
    { title: 'Simulation', href: '/admin/workflows/simulation', desc: 'Test workflows before deploying' },
    { title: 'Bulk Operations', href: '/admin/workflows/bulk', desc: 'Mass workflow operations' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Workflow Engine"
        description="Design approval chains, automate routing, and manage workflow processes"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Workflows' },
        ]}
        actions={
          <Button variant="primary" onClick={() => {}}>
            <Plus size={14} style={{ marginRight: 6 }} /> Create Workflow
          </Button>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Active Workflows" value={workflows.length} icon={<Workflow size={20} />} color="var(--color-primary)" />
        <KPICard title="Pending Approvals" value={pendingCount} icon={<Clock size={20} />} color="var(--color-warning)" />
        <KPICard title="Approved (30d)" value={approvedCount} icon={<CheckCircle size={20} />} color="var(--color-success)" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { key: 'workflows', label: 'Workflows', icon: <GitFork size={14} /> },
          { key: 'approvals', label: `Pending Approvals (${pendingCount})`, icon: <Clock size={14} /> },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'workflows' ? (
        <Card padding="none">
          <DataTable
            columns={workflowColumns}
            data={workflows}
            loading={loading}
            rowKey={(row) => row.id}
            emptyTitle="No workflows configured"
            emptyMessage="Create your first approval workflow to automate business processes."
            emptyIcon={<GitFork size={48} />}
          />
        </Card>
      ) : (
        <Card padding="none">
          <DataTable
            columns={approvalColumns}
            data={approvals.filter(a => a.status === 'PENDING')}
            loading={loading}
            rowKey={(row) => row.id}
            emptyTitle="No pending approvals"
            emptyMessage="All approval requests have been processed."
            emptyIcon={<CheckCircle size={48} />}
          />
        </Card>
      )}

      {/* Sub-pages Grid */}
      <div>
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
          Workflow Configuration
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {subPages.map((page) => (
            <Link href={page.href} key={page.title} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)',
                  cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-default)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 2 }}>{page.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{page.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
