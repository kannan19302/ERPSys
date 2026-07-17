'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Card, PageHeader, Spinner, Button, Badge, useToast, DataTable, type Column, type SortOrder } from '@unerp/ui';
import { CheckCircle, XCircle, Clock, X, AlertTriangle, Inbox, Search, Filter } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string;
  processName: string;
  submittedBy: string;
  submittedAt: string;
  currentStep: number;
  totalSteps: number;
}

const MOCK_REQUESTS: ApprovalRequest[] = [
  { id: '1', entityType: 'QUOTATION', entityId: 'QUO-2026-0042', processName: 'Quote Sign-off', submittedBy: 'jane.smith@company.com', submittedAt: '2026-06-21T08:30:00Z', currentStep: 1, totalSteps: 2 },
  { id: '2', entityType: 'DISCOUNT', entityId: 'DSC-2026-0015', processName: 'Discount Approval', submittedBy: 'mike.jones@company.com', submittedAt: '2026-06-20T14:15:00Z', currentStep: 2, totalSteps: 2 },
  { id: '3', entityType: 'OPPORTUNITY', entityId: 'OPP-2026-0089', processName: 'Large Deal Approval', submittedBy: 'sarah.lee@company.com', submittedAt: '2026-06-21T10:00:00Z', currentStep: 1, totalSteps: 1 },
  { id: '4', entityType: 'SALES_ORDER', entityId: 'SO-2026-0033', processName: 'Order Approval', submittedBy: 'tom.chen@company.com', submittedAt: '2026-06-19T16:45:00Z', currentStep: 1, totalSteps: 3 },
];

export default function ApprovalsPage() {
  const client = useApiClient();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; request: ApprovalRequest } | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approvedToday, setApprovedToday] = useState(0);
  const [rejectedToday, setRejectedToday] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const toast = useToast();

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await client.get<{ requests?: ApprovalRequest[]; approvedToday?: number; rejectedToday?: number } | ApprovalRequest[]>('/api/v1/crm/approval-requests/pending');
      {
        setRequests(Array.isArray(data) ? data : data.requests || MOCK_REQUESTS);
        setApprovedToday(Array.isArray(data) ? 0 : data.approvedToday ?? 0);
        setRejectedToday(Array.isArray(data) ? 0 : data.rejectedToday ?? 0);
      }
    } catch { setRequests([]); setApprovedToday(0); setRejectedToday(0); }
    finally { setLoading(false); }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    const { type, request } = actionModal;
    try {
      const endpoint = type === 'approve'
        ? `/api/v1/crm/approval-requests/${request.id}/approve`
        : `/api/v1/crm/approval-requests/${request.id}/reject`;
      await client.request(endpoint, {
        method: 'POST',
        body: JSON.stringify({ comments }),
      });
      setRequests(prev => prev.filter(r => r.id !== request.id));
      if (type === 'approve') setApprovedToday(p => p + 1);
      else setRejectedToday(p => p + 1);
      toast.success(type === 'approve' ? 'Request approved' : 'Request rejected');
      setActionModal(null);
      setComments('');
    } catch (err) {
      toast.error('Action failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const urgentCount = requests.filter(r => {
    const submitted = new Date(r.submittedAt);
    const hoursAgo = (Date.now() - submitted.getTime()) / (1000 * 60 * 60);
    return hoursAgo > 24;
  }).length;

  const kpis = [
    { label: 'Total Pending', value: requests.length, icon: Clock, color: 'var(--color-warning)' },
    { label: 'Approved Today', value: approvedToday, icon: CheckCircle, color: 'var(--color-success)' },
    { label: 'Rejected Today', value: rejectedToday, icon: XCircle, color: 'var(--color-danger)' },
  ];

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' };

  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredRequests = requests.filter(r => {
    const matchesSearch = !searchQuery || r.entityId.toLowerCase().includes(searchQuery.toLowerCase()) || r.processName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntity = filterEntity === 'ALL' || r.entityType === filterEntity;
    return matchesSearch && matchesEntity;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'submittedAt') cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    else if (sortBy === 'processName') cmp = a.processName.localeCompare(b.processName);
    else if (sortBy === 'entityType') cmp = a.entityType.localeCompare(b.entityType);
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const columns: Column<ApprovalRequest>[] = [
    { key: 'entityType', header: 'Entity Type', sortable: true, render: (r) => <Badge>{r.entityType}</Badge> },
    { key: 'entityId', header: 'Entity ID', render: (r) => <span className={styles.p20}>{r.entityId}</span> },
    { key: 'processName', header: 'Process', sortable: true, render: (r) => r.processName },
    { key: 'submittedBy', header: 'Submitted By', render: (r) => r.submittedBy },
    { key: 'submittedAt', header: 'Submitted At', sortable: true, render: (r) => new Date(r.submittedAt).toLocaleString() },
    { key: 'step', header: 'Step', align: 'center', render: (r) => <Badge variant="info">{r.currentStep}/{r.totalSteps}</Badge> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className={styles.p21}>
          <button onClick={(e) => { e.stopPropagation(); setActionModal({ type: 'approve', request: r }); setComments(''); }} className={styles.p22}>
            <CheckCircle size={14} /> Approve
          </button>
          <button onClick={(e) => { e.stopPropagation(); setActionModal({ type: 'reject', request: r }); setComments(''); }} className={styles.p23}>
            <XCircle size={14} /> Reject
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div className={styles.p24}><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="crm.approvals.read">
    <div className={styles.p25}>
      <PageHeader title="Pending Approvals" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Approvals' }]} />

      <div className={styles.p26}>
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <div className={styles.p27}>
              <div className={styles.kpiIcon} style={{ backgroundColor: `${kpi.color}15` }}>
                <kpi.icon size={24} style={{ color: kpi.color }} />
              </div>
              <div>
                <div className={styles.p28}>{kpi.value}</div>
                <div className={styles.p29}>{kpi.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className={styles.p210}>
          <div className={styles.p211}>
            <Inbox size={18} className={styles.p212} />
            <span className={styles.p213}>Approval Inbox</span>
          </div>
          <div className={styles.p214}>
            <div className="relative">
              <Search size={14} className={styles.p215} />
              <input className={`ui-input ${styles.searchInput}`} placeholder="Search by ID or process..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className={`ui-input ${styles.filter}`} value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="QUOTATION">Quotation</option>
              <option value="DISCOUNT">Discount</option>
              <option value="OPPORTUNITY">Opportunity</option>
              <option value="SALES_ORDER">Sales Order</option>
            </select>
          </div>
        </div>
        <DataTable<ApprovalRequest>
          columns={columns}
          data={filteredRequests}
          rowKey={(r) => r.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(key, order) => { setSortBy(key); setSortOrder(order); }}
          emptyIcon={<CheckCircle size={32} className="ui-text-success" />}
          emptyTitle={requests.length === 0 ? 'All caught up' : 'No matches'}
          emptyMessage={requests.length === 0 ? 'No pending approvals.' : 'No approvals match the current filters.'}
        />
      </Card>

      {actionModal && (
        <div className={styles.p216}>
          <div className={styles.p217}>
            <div className={styles.p218}>
              <h3 className={styles.p219}>
                {actionModal.type === 'approve' ? <CheckCircle size={20} className="ui-text-success" /> : <AlertTriangle size={20} className="ui-text-danger" />}
                {actionModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h3>
              <button onClick={() => setActionModal(null)} className={styles.p220}><X size={20} /></button>
            </div>
            <div className={styles.p221}>
              <div><strong>{actionModal.request.processName}</strong></div>
              <div className={styles.p222}>{actionModal.request.entityType} - {actionModal.request.entityId}</div>
            </div>
            <div className={styles.p223}>
              <label className={styles.p224}>Comments</label>
              <textarea className={`ui-input ${styles.commentArea}`} value={comments} onChange={e => setComments(e.target.value)} placeholder={actionModal.type === 'approve' ? 'Optional approval notes...' : 'Please provide a reason for rejection...'} />
            </div>
            <div className={styles.p225}>
              <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button onClick={handleAction} disabled={submitting || (actionModal.type === 'reject' && !comments.trim())}>
                {submitting ? <Spinner size="sm" /> : actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
