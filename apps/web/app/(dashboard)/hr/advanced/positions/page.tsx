'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Plus, BarChart3, Users, DollarSign, Briefcase } from 'lucide-react';

interface Position {
  id: string;
  title: string;
  code: string;
  budgetedSalary: number;
  status: string;
  employeeId: string | null;
  departmentId: string;
  department: { name: string };
}

interface BudgetVariance {
  departmentName: string;
  budgeted: number;
  actual: number;
  variance: number;
}

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [variances, setVariances] = useState<BudgetVariance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ departmentId: '', title: '', code: '', budgetedSalary: 0 });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, varRes, deptRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/positions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/positions/budget-variance', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/org-chart', { headers: { Authorization: `Bearer ${token}` } }), // maps departments
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (posRes.ok) setPositions(await posRes.ok ? await posRes.json() : []);
      if (varRes.ok) setVariances(await varRes.ok ? await varRes.json() : []);
      if (empRes.ok) setEmployees(await empRes.json());
      
      // Parse departments from org chart structure
      if (deptRes.ok) {
        const chartData = await deptRes.json();
        setDepartments(chartData.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })));
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/advanced-hr/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Position registered successfully.');
        setShowForm(false);
        setForm({ departmentId: '', title: '', code: '', budgetedSalary: 0 });
        fetchData();
      }
    } catch {}
  };

  const handleUpdateStatus = async (id: string, status: string, employeeId?: string | null) => {
    try {
      const res = await fetch(`/api/v1/advanced-hr/positions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, employeeId })
      });
      if (res.ok) {
        setMsg('Position updated successfully.');
        fetchData();
      }
    } catch {}
  };

  const getEmployeeName = (id: string | null) => {
    if (!id) return '--';
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'System User';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Position Control"
        description="Verify authorized headcounts vs filled vacancies, control departmental budgets, and log variances."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Positions' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> Create Position
          </Button>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Budgeted Headcount</span>
            <Briefcase size={16} className="text-primary" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0' }}>{positions.length}</h4>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Vacant Positions</span>
            <Users size={16} className="text-danger" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0' }}>{positions.filter(p => p.status === 'VACANT').length}</h4>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Monthly Budget Cap</span>
            <DollarSign size={16} className="text-success" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0' }}>
            ${positions.reduce((s, p) => s + Number(p.budgetedSalary), 0).toFixed(2)}
          </h4>
        </Card>
      </div>

      {showForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4)' }}>Register Headcount Position</h4>
          <form onSubmit={handleCreatePosition} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <select className="frappe-input" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input className="frappe-input" placeholder="Job Title (e.g. Senior QA)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <input className="frappe-input" placeholder="Position Code (e.g. POS-QA-01)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
              <input className="frappe-input" type="number" step="0.01" placeholder="Budgeted Salary Monthly ($)" value={form.budgetedSalary || ''} onChange={e => setForm({ ...form, budgetedSalary: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Publish Position</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Department cost variance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={16} /> Budget Variance</h4>
            {variances.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)', textAlign: 'center', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>No cost figures compiled.</div>
            ) : (
              variances.map(v => (
                <Card key={v.departmentName} padding="sm">
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{v.departmentName}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 8 }}>
                    <span>Budget: ${v.budgeted.toFixed(2)}</span>
                    <span>Actual: ${v.actual.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 'bold', marginTop: 4, color: v.variance >= 0 ? 'var(--color-success)' : 'var(--color-danger-text)' }}>
                    <span>Variance:</span>
                    <span>{v.variance >= 0 ? `+$${v.variance.toFixed(2)}` : `-$${Math.abs(v.variance).toFixed(2)}`}</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Positions listing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h4 style={{ margin: 0 }}>Registered Headcount Positions</h4>
            <Card padding="none" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4)' }}>Code & Title</th>
                    <th style={{ padding: 'var(--space-4)' }}>Department</th>
                    <th style={{ padding: 'var(--space-4)' }}>Budgeted Salary</th>
                    <th style={{ padding: 'var(--space-4)' }}>Employee Assigned</th>
                    <th style={{ padding: 'var(--space-4)' }}>Status</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No positions logged yet.</td>
                    </tr>
                  ) : (
                    positions.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: 600 }}>{p.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{p.code}</div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>{p.department?.name}</td>
                        <td style={{ padding: 'var(--space-4)' }}>${Number(p.budgetedSalary).toFixed(2)}/mo</td>
                        <td style={{ padding: 'var(--space-4)' }}>{getEmployeeName(p.employeeId)}</td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <StatusBadge status={p.status} />
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                          <select
                            className="frappe-input"
                            style={{ fontSize: 11, padding: '2px 4px', maxWidth: 100, display: 'inline-block' }}
                            value={p.status}
                            onChange={e => {
                              const nextStatus = e.target.value;
                              let nextEmp: string | null = p.employeeId;
                              if (nextStatus === 'VACANT') nextEmp = null;
                              handleUpdateStatus(p.id, nextStatus, nextEmp);
                            }}
                          >
                            <option value="VACANT">Vacant</option>
                            <option value="FILLED">Filled</option>
                            <option value="FROZEN">Frozen</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
