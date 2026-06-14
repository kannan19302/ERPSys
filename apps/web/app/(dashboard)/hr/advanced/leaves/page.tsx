'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Coffee, Plus, Calendar, Check, X, Clock, CheckCircle2, Shield } from 'lucide-react';

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, polRes, reqRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/leaves/balances', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/leaves/policies', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/leaves/requests', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (balRes.ok) setBalances(await balRes.json());
      if (polRes.ok) setPolicies(await polRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const createPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/leaves/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...policyForm,
          annualAllocation: parseInt(policyForm.annualAllocation) || 10,
          carryForwardLimit: parseInt(policyForm.carryForwardLimit) || 0
        })
      });
      if (res.ok) {
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
      const res = await fetch('/api/v1/advanced-hr/leaves/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestForm)
      });
      if (res.ok) {
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
      const res = await fetch(`/api/v1/advanced-hr/leaves/requests/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: approve ? 'APPROVED' : 'REJECTED' })
      });
      if (res.ok) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Leave Management"
        description="Allocate leaves, review requests, and configure company holidays."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Leaves' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                {requests.filter(r => r.status === 'PENDING').length}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Pending Requests</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                {requests.filter(r => r.status === 'APPROVED').length}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Approved Requests</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                {policies.length}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Active Policies</div>
            </div>
          </div>
        </Card>
      </div>

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {/* Policy Form */}
      {showPolicyForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Define Leave Policy</h4>
          <form onSubmit={createPolicy} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              className="frappe-input"
              placeholder="Policy Name (e.g. Sabbatical Leave)"
              value={policyForm.name}
              onChange={e => setPolicyForm({ ...policyForm, name: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <select
                className="frappe-input"
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
                className="frappe-input"
                placeholder="Allocation Days (e.g. 15)"
                value={policyForm.annualAllocation}
                onChange={e => setPolicyForm({ ...policyForm, annualAllocation: e.target.value })}
                required
              />
              <input
                type="number"
                className="frappe-input"
                placeholder="Carry Limit Days (e.g. 5)"
                value={policyForm.carryForwardLimit}
                onChange={e => setPolicyForm({ ...policyForm, carryForwardLimit: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowPolicyForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Create Policy</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Book a Leave Request</h4>
          <form onSubmit={submitLeaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
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
              className="frappe-input"
              value={requestForm.policyId}
              onChange={e => setRequestForm({ ...requestForm, policyId: e.target.value })}
              required
            >
              <option value="">Select Leave Policy</option>
              {policies.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.annualAllocation} days)</option>
              ))}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Start Date</label>
                <input
                  type="date"
                  className="frappe-input"
                  value={requestForm.startDate}
                  onChange={e => setRequestForm({ ...requestForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>End Date</label>
                <input
                  type="date"
                  className="frappe-input"
                  value={requestForm.endDate}
                  onChange={e => setRequestForm({ ...requestForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <textarea
              className="frappe-input"
              placeholder="Reason for Leave"
              value={requestForm.reason}
              onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })}
              rows={3}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowRequestForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Submit Request</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Leave Requests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Recent Leave Requests</h3>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-sunken)', padding: '2px', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  style={{
                    background: statusFilter === tab ? 'var(--color-bg-card)' : 'transparent',
                    color: statusFilter === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: statusFilter === tab ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  {tab} ({tab === 'ALL' ? requests.length : requests.filter(r => r.status === tab).length})
                </button>
              ))}
            </div>

            {requests.filter(req => statusFilter === 'ALL' || req.status === statusFilter).length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <Coffee size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No leave requests found.</p>
                </div>
              </Card>
            ) : (
              requests
                .filter(req => statusFilter === 'ALL' || req.status === statusFilter)
                .map(req => (
                <Card key={req.id} padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{getEmpName(req.employeeId)}</span>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {req.policy?.name || 'Leave Policy'} ({req.policy?.leaveType})
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <p style={{ fontSize: '13px', margin: 'var(--space-2) 0', color: 'var(--color-text-secondary)' }}>
                    {req.reason || 'No reason provided.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                    <div>
                      {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                    </div>
                    {req.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button variant="outline" size="sm" onClick={() => handleApprove(req.id, false)} style={{ color: 'var(--color-danger)' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h3>Leave Allocation Balances</h3>
              <Card padding="none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Policy</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Allocated</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Used</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No allocation balances available.</td>
                      </tr>
                    ) : (
                      balances.map(bal => (
                        <tr key={bal.policyId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)' }}>
                            <div style={{ fontWeight: 600 }}>{bal.policyName}</div>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{bal.leaveType}</span>
                          </td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>{bal.allocated}d</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>{bal.used}d</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>{bal.remaining}d</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h3>Active Leave Policies</h3>
              <Card padding="none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Policy Name</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Type</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Allocation</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Carry Forward Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No active policies found.</td>
                      </tr>
                    ) : (
                      policies.map(policy => (
                        <tr key={policy.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{policy.name}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', background: 'var(--color-bg-sunken)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{policy.leaveType}</span>
                          </td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>{policy.annualAllocation} days</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{policy.carryForwardLimit ?? 0} days</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
