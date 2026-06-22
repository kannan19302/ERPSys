'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, useToast } from '@unerp/ui';
import { CheckCircle, XCircle, Clock, X, AlertTriangle, Inbox, Search, Filter } from 'lucide-react';

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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/approval-requests/pending', { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : data.requests || MOCK_REQUESTS);
        setApprovedToday(data.approvedToday ?? 0);
        setRejectedToday(data.rejectedToday ?? 0);
      } else { setRequests([]); setApprovedToday(0); setRejectedToday(0); }
    } catch { setRequests([]); setApprovedToday(0); setRejectedToday(0); }
    finally { setLoading(false); }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    const { type, request } = actionModal;
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'approve'
        ? `/api/v1/crm/approval-requests/${request.id}/approve`
        : `/api/v1/crm/approval-requests/${request.id}/reject`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ comments }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
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
    { label: 'Total Pending', value: requests.length, icon: Clock, color: 'var(--color-warning, #f59e0b)' },
    { label: 'Approved Today', value: approvedToday, icon: CheckCircle, color: 'var(--color-success, #10b981)' },
    { label: 'Rejected Today', value: rejectedToday, icon: XCircle, color: 'var(--color-danger, #ef4444)' },
  ];

  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' };
  const headStyle: React.CSSProperties = { ...cellStyle, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader title="Pending Approvals" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Approvals' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={24} style={{ color: kpi.color }} />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{kpi.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{kpi.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Inbox size={18} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Approval Inbox</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input style={{ ...inputStyle, paddingLeft: '32px', width: '200px' }} placeholder="Search by ID or process..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select style={{ ...inputStyle, width: '160px' }} value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="QUOTATION">Quotation</option>
              <option value="DISCOUNT">Discount</option>
              <option value="OPPORTUNITY">Opportunity</option>
              <option value="SALES_ORDER">Sales Order</option>
            </select>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Entity Type', 'Entity ID', 'Process', 'Submitted By', 'Submitted At', 'Step', 'Actions'].map(h => <th key={h} style={headStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {(() => {
              const filteredRequests = requests.filter(r => {
                const matchesSearch = !searchQuery || r.entityId.toLowerCase().includes(searchQuery.toLowerCase()) || r.processName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesEntity = filterEntity === 'ALL' || r.entityType === filterEntity;
                return matchesSearch && matchesEntity;
              });
              if (filteredRequests.length === 0) return (
                <tr><td colSpan={7} style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-tertiary)', padding: '48px' }}>
                  <CheckCircle size={32} style={{ color: 'var(--color-success)', marginBottom: '8px' }} /><br />
                  {requests.length === 0 ? 'All caught up. No pending approvals.' : 'No approvals match the current filters.'}
                </td></tr>
              );
              return filteredRequests.map(r => (
              <tr key={r.id}>
                <td style={cellStyle}><Badge>{r.entityType}</Badge></td>
                <td style={cellStyle}><span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{r.entityId}</span></td>
                <td style={cellStyle}>{r.processName}</td>
                <td style={cellStyle}>{r.submittedBy}</td>
                <td style={cellStyle}>{new Date(r.submittedAt).toLocaleString()}</td>
                <td style={cellStyle}><Badge variant="info">{r.currentStep}/{r.totalSteps}</Badge></td>
                <td style={cellStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setActionModal({ type: 'approve', request: r }); setComments(''); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-success, #10b981)', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => { setActionModal({ type: 'reject', request: r }); setComments(''); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-danger, #ef4444)', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ));
            })()}
          </tbody>
        </table>
      </Card>

      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {actionModal.type === 'approve' ? <CheckCircle size={20} style={{ color: 'var(--color-success)' }} /> : <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />}
                {actionModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h3>
              <button onClick={() => setActionModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              <div><strong>{actionModal.request.processName}</strong></div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{actionModal.request.entityType} - {actionModal.request.entityId}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Comments</label>
              <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={comments} onChange={e => setComments(e.target.value)} placeholder={actionModal.type === 'approve' ? 'Optional approval notes...' : 'Please provide a reason for rejection...'} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button onClick={handleAction} disabled={submitting || (actionModal.type === 'reject' && !comments.trim())}>
                {submitting ? <Spinner size="sm" /> : actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
