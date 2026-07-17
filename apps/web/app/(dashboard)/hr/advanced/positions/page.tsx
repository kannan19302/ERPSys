'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Plus, BarChart3, Users, DollarSign, Briefcase } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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
  const client = useApiClient();
  const [positions, setPositions] = useState<Position[]>([]);
  const [variances, setVariances] = useState<BudgetVariance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ departmentId: '', title: '', code: '', budgetedSalary: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, varRes, deptRes, empRes] = await Promise.all([
        client.get<Position[]>('/api/v1/advanced-hr/positions'),
        client.get<BudgetVariance[]>('/api/v1/advanced-hr/positions/budget-variance'),
        client.get<Department[]>('/api/v1/hr/org-chart'),
        client.get<Employee[] | { data?: Employee[] }>('/api/v1/hr/employees')
      ]);
      setPositions(posRes);
      setVariances(varRes);
      setEmployees(Array.isArray(empRes) ? empRes : empRes.data || []);
      setDepartments(deptRes.map((d) => ({ id: d.id, name: d.name })));
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
      await client.post('/api/v1/advanced-hr/positions', form);
      {
        setMsg('Position registered successfully.');
        setShowForm(false);
        setForm({ departmentId: '', title: '', code: '', budgetedSalary: 0 });
        fetchData();
      }
    } catch {}
  };

  const handleUpdateStatus = async (id: string, status: string, employeeId?: string | null) => {
    try {
      await client.request(`/api/v1/advanced-hr/positions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, employeeId })
      });
      {
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
    <RouteGuard permission="hr.positions.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Position Control"
        description="Verify authorized headcounts vs filled vacancies, control departmental budgets, and log variances."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Positions' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(true)} className="ui-flex ui-items-center ui-gap-1">
            <Plus size={14} /> Create Position
          </Button>
        }
      />

      {msg && (
        <div className={styles.s0}>
          {msg}
        </div>
      )}

      {/* Overview stats */}
      <div className={styles.auto0}>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Budgeted Headcount</span>
            <Briefcase size={16} className="text-primary" />
          </div>
          <h4 className={styles.s1}>{positions.length}</h4>
        </Card>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Vacant Positions</span>
            <Users size={16} className="text-danger" />
          </div>
          <h4 className={styles.s2}>{positions.filter(p => p.status === 'VACANT').length}</h4>
        </Card>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Monthly Budget Cap</span>
            <DollarSign size={16} className="text-success" />
          </div>
          <h4 className={styles.s3}>
            ${positions.reduce((s, p) => s + Number(p.budgetedSalary), 0).toFixed(2)}
          </h4>
        </Card>
      </div>

      {showForm && (
        <Card padding="md">
          <h4 className={styles.s4}>Register Headcount Position</h4>
          <form onSubmit={handleCreatePosition} className="ui-stack-3">
            <div className="ui-grid-2">
              <select className="ui-input" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input className="ui-input" placeholder="Job Title (e.g. Senior QA)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="ui-grid-2">
              <input className="ui-input" placeholder="Position Code (e.g. POS-QA-01)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
              <input className="ui-input" type="number" step="0.01" placeholder="Budgeted Salary Monthly ($)" value={form.budgetedSalary || ''} onChange={e => setForm({ ...form, budgetedSalary: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Publish Position</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.s5}>
          {/* Department cost variance */}
          <div className="ui-stack-4">
            <h4 className={styles.s6}><BarChart3 size={16} /> Budget Variance</h4>
            {variances.length === 0 ? (
              <div className={styles.s7}>No cost figures compiled.</div>
            ) : (
              variances.map(v => (
                <Card key={v.departmentName} padding="sm">
                  <div className={styles.s8}>{v.departmentName}</div>
                  <div className={styles.s9}>
                    <span>Budget: ${v.budgeted.toFixed(2)}</span>
                    <span>Actual: ${v.actual.toFixed(2)}</span>
                  </div>
                  <div className={styles.dyn0} style={{ color: v.variance >= 0 ? 'var(--color-success)' : 'var(--color-danger-text)' }}>
                    <span>Variance:</span>
                    <span>{v.variance >= 0 ? `+$${v.variance.toFixed(2)}` : `-$${Math.abs(v.variance).toFixed(2)}`}</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Positions listing */}
          <div className="ui-stack-4">
            <h4 className="m-0">Registered Headcount Positions</h4>
            <ListPageTemplate
              title=""
              columns={[
                { key: 'title', header: 'Code & Title', render: (v, row) => {
                  const pos = row as unknown as Position;
                  return (
                    <div>
                      <div className="font-semibold">{pos.title}</div>
                      <div className="ui-text-caption">{pos.code}</div>
                    </div>
                  );
                }},
                { key: 'department', header: 'Department', render: (v) => (v as { name: string })?.name },
                { key: 'budgetedSalary', header: 'Budgeted Salary', render: (v) => `$${Number(v).toFixed(2)}/mo` },
                { key: 'employeeId', header: 'Employee Assigned', render: (v) => getEmployeeName(v as string | null) },
                { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
                { key: 'id', header: 'Actions', render: (_v, row) => {
                  const pos = row as unknown as Position;
                  return (
                    <select
                      className={`ui-input ${styles.s10}`}
                      value={pos.status}
                      onChange={e => {
                        const nextStatus = e.target.value;
                        const nextEmp = nextStatus === 'VACANT' ? null : pos.employeeId;
                        handleUpdateStatus(pos.id, nextStatus, nextEmp);
                      }}
                    >
                      <option value="VACANT">Vacant</option>
                      <option value="FILLED">Filled</option>
                      <option value="FROZEN">Frozen</option>
                    </select>
                  );
                }},
              ] as ListColumn[]}
              data={positions as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No positions logged yet."
            />
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}




