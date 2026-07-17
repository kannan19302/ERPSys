'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Coffee, Plus, Calendar, Check, X, Clock, CheckCircle2, Shield } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface LeaveBalance {
  policyId: string;
  policyName: string;
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
}

interface LeavePolicy {
  id: string;
  name: string;
  leaveType: string;
  annualAllocation: number;
  carryForwardLimit?: number;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  policyId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  policy?: LeavePolicy;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function LeavesPage() {
  const client = useApiClient();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Forms
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [policyForm, setPolicyForm] = useState({ name: '', leaveType: 'ANNUAL', annualAllocation: '', carryForwardLimit: '' });

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ employeeId: '', policyId: '', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, polRes, reqRes, empRes] = await Promise.all([
        client.get<LeaveBalance[]>('/api/v1/advanced-hr/leaves/balances'),
        client.get<LeavePolicy[]>('/api/v1/advanced-hr/leaves/policies'),
        client.get<LeaveRequest[]>('/api/v1/advanced-hr/leaves/requests'),
        client.get<Employee[]>('/api/v1/hr/employees'),
      ]);
      setBalances(balRes); setPolicies(polRes); setRequests(reqRes); setEmployees(empRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  const createPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/api/v1/advanced-hr/leaves/policies', {
          ...policyForm,
          annualAllocation: parseInt(policyForm.annualAllocation) || 10,
          carryForwardLimit: parseInt(policyForm.carryForwardLimit) || 0
        });
      {
        setMsg('Leave Policy created successfully.');
        setShowPolicyForm(false);
        setPolicyForm({ name: '', leaveType: 'ANNUAL', annualAllocation: '', carryForwardLimit: '' });
        fetchData();
      }
    } catch {
      setMsg('Error communicating with leave service.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/api/v1/advanced-hr/leaves/requests', requestForm);
      {
        setMsg('Leave Request submitted successfully.');
        setShowRequestForm(false);
        setRequestForm({ employeeId: '', policyId: '', startDate: '', endDate: '', reason: '' });
        fetchData();
      }
    } catch {
      setMsg('Error submitting leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await client.request(`/api/v1/advanced-hr/leaves/requests/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ status: approve ? 'APPROVED' : 'REJECTED' })
      });
      {
        setMsg(approve ? 'Leave request approved.' : 'Leave request rejected.');
        fetchData();
      }
    } catch {
      setMsg('Failed to process approval.');
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  return (
    <RouteGuard permission="hr.leaves.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Leave Management"
        description="Allocate leaves, review requests, and configure company holidays."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Leaves' }]}
        actions={
          <div className="ui-flex ui-gap-2">
            <Button variant="outline" onClick={() => setShowPolicyForm(!showPolicyForm)}>
              <Plus size={14} /> Leave Policy
            </Button>
            <Button variant="primary" onClick={() => setShowRequestForm(!showRequestForm)}>
              <Calendar size={14} /> Request Leave
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className={styles.stats}>
        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={`${styles.statIcon} ${styles.warningIcon}`}>
              <Clock size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">
                {requests.filter(r => r.status === 'PENDING').length}
              </div>
              <div className="ui-text-xs-muted">Pending Requests</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={`${styles.statIcon} ${styles.successIcon}`}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">
                {requests.filter(r => r.status === 'APPROVED').length}
              </div>
              <div className="ui-text-xs-muted">Total Approved Requests</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={`${styles.statIcon} ${styles.primaryIcon}`}>
              <Shield size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">
                {policies.length}
              </div>
              <div className="ui-text-xs-muted">Active Policies</div>
            </div>
          </div>
        </Card>
      </div>

      {msg && (
        <div className={styles.message}>
          {msg}
        </div>
      )}

      {/* Policy Form */}
      {showPolicyForm && (
        <Card padding="md">
          <h4 className={styles.formTitle}>Define Leave Policy</h4>
          <form onSubmit={createPolicy} className="ui-stack-3">
            <input
              className="ui-input"
              placeholder="Policy Name (e.g. Sabbatical Leave)"
              value={policyForm.name}
              onChange={e => setPolicyForm({ ...policyForm, name: e.target.value })}
              required
            />
            <div className={styles.formGrid}>
              <select
                className="ui-input"
                value={policyForm.leaveType}
                onChange={e => setPolicyForm({ ...policyForm, leaveType: e.target.value })}
              >
                <option value="ANNUAL">Annual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="MATERNITY">Maternity/Paternity</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
              <input
                type="number"
                className="ui-input"
                placeholder="Allocation Days (e.g. 15)"
                value={policyForm.annualAllocation}
                onChange={e => setPolicyForm({ ...policyForm, annualAllocation: e.target.value })}
                required
              />
              <input
                type="number"
                className="ui-input"
                placeholder="Carry Limit Days (e.g. 5)"
                value={policyForm.carryForwardLimit}
                onChange={e => setPolicyForm({ ...policyForm, carryForwardLimit: e.target.value })}
              />
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowPolicyForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Create Policy</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <Card padding="md">
          <h4 className={styles.formTitle}>Book a Leave Request</h4>
          <form onSubmit={submitLeaveRequest} className="ui-stack-3">
            <select
              className="ui-input"
              value={requestForm.employeeId}
              onChange={e => setRequestForm({ ...requestForm, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <select
              className="ui-input"
              value={requestForm.policyId}
              onChange={e => setRequestForm({ ...requestForm, policyId: e.target.value })}
              required
            >
              <option value="">Select Leave Policy</option>
              {policies.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.annualAllocation} days)</option>
              ))}
            </select>
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Start Date</label>
                <input
                  type="date"
                  className="ui-input"
                  value={requestForm.startDate}
                  onChange={e => setRequestForm({ ...requestForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">End Date</label>
                <input
                  type="date"
                  className="ui-input"
                  value={requestForm.endDate}
                  onChange={e => setRequestForm({ ...requestForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <textarea
              className="ui-input"
              placeholder="Reason for Leave"
              value={requestForm.reason}
              onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })}
              rows={3}
            />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowRequestForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Submit Request</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="ui-grid-2 ui-gap-6">
          {/* Leave Requests */}
          <div className="ui-stack-4">
            <div className="ui-flex-between">
              <h3 className="m-0">Recent Leave Requests</h3>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filters}>
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`${styles.filterButton} ${statusFilter === tab ? styles.filterButtonActive : ''}`}
                >
                  {tab} ({tab === 'ALL' ? requests.length : requests.filter(r => r.status === tab).length})
                </button>
              ))}
            </div>

            {requests.filter(req => statusFilter === 'ALL' || req.status === statusFilter).length === 0 ? (
              <Card>
                <div className={styles.emptyState}>
                  <Coffee size={32} className={styles.emptyIcon} />
                  <p className="m-0">No leave requests found.</p>
                </div>
              </Card>
            ) : (
              requests
                .filter(req => statusFilter === 'ALL' || req.status === statusFilter)
                .map(req => (
                <Card key={req.id} padding="md">
                  <div className="ui-flex-between mb-2">
                    <div>
                      <span className="font-semibold">{getEmpName(req.employeeId)}</span>
                      <div className={styles.policyName}>
                        {req.policy?.name || 'Leave Policy'} ({req.policy?.leaveType})
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className={styles.reason}>
                    {req.reason || 'No reason provided.'}
                  </p>
                  <div className={styles.requestFooter}>
                    <div>
                      {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                    </div>
                    {req.status === 'PENDING' && (
                      <div className={styles.requestActions}>
                        <Button variant="outline" size="sm" onClick={() => handleApprove(req.id, false)} className="ui-text-danger">
                          <X size={12} /> Reject
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleApprove(req.id, true)}>
                          <Check size={12} /> Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Leave Balances and Policies */}
    <div className="ui-stack-6">
            <div className="ui-stack-3">
              <h3>Leave Allocation Balances</h3>
              <ListPageTemplate
                title=""
                columns={[
                  { key: 'policyName', header: 'Policy', render: (v, row) => {
                    const bal = row as unknown as LeaveBalance;
                    return (
                      <div>
                        <div className="font-semibold">{bal.policyName}</div>
                        <span className="ui-text-micro ui-text-muted">{bal.leaveType}</span>
                      </div>
                    );
                  }},
                  { key: 'allocated', header: 'Allocated', render: (v) => `${v}d` },
                  { key: 'used', header: 'Used', render: (v) => `${v}d` },
                  { key: 'remaining', header: 'Remaining', render: (v) => <span className={styles.remaining}>{String(v)}d</span> },
                ] as ListColumn[]}
                data={balances as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No allocation balances available."
              />
            </div>

            <div className="ui-stack-3">
              <h3>Active Leave Policies</h3>
              <ListPageTemplate
                title=""
                columns={[
                  { key: 'name', header: 'Policy Name' },
                  { key: 'leaveType', header: 'Type', render: (v) => <span className={styles.leaveType}>{String(v)}</span> },
                  { key: 'annualAllocation', header: 'Allocation', render: (v) => `${v} days` },
                  { key: 'carryForwardLimit', header: 'Carry Forward Limit', render: (v) => `${v ?? 0} days` },
                ] as ListColumn[]}
                data={policies as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No active policies found."
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
