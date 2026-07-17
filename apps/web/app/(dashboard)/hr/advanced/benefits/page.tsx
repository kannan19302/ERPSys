'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Plus, ShieldCheck, Users, DollarSign } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface Scheme {
  id: string;
  name: string;
  type: string;
  provider: string;
  description: string | null;
  employeeCostShare: number;
  employerCostShare: number;
  isActive: boolean;
}

interface Enrollment {
  id: string;
  employeeId: string;
  schemeId: string;
  enrollmentDate: string;
  coverageAmount: number | null;
  status: string;
  scheme: Scheme;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

export default function BenefitsPage() {
  const client = useApiClient();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Modals / forms
  const [showSchemeForm, setShowSchemeForm] = useState(false);
  const [schemeForm, setSchemeForm] = useState({ name: '', type: 'HEALTH_INSURANCE', provider: '', description: '', employeeCostShare: 0, employerCostShare: 0 });

  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ employeeId: '', schemeId: '', coverageAmount: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schRes, enrRes, empRes] = await Promise.all([
        client.get<Scheme[]>('/api/v1/advanced-hr/benefits/schemes'),
        client.get<Enrollment[]>('/api/v1/advanced-hr/benefits/enrollments'),
        client.get<Employee[]>('/api/v1/hr/employees')
      ]);
      setSchemes(schRes); setEnrollments(enrRes); setEmployees(empRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/api/v1/advanced-hr/benefits/schemes', schemeForm);
      {
        setMsg('Benefit scheme created successfully.');
        setShowSchemeForm(false);
        setSchemeForm({ name: '', type: 'HEALTH_INSURANCE', provider: '', description: '', employeeCostShare: 0, employerCostShare: 0 });
        fetchData();
      }
    } catch {}
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/api/v1/advanced-hr/benefits/enroll', enrollForm);
      {
        setMsg('Employee enrolled in benefit scheme successfully.');
        setShowEnrollForm(false);
        setEnrollForm({ employeeId: '', schemeId: '', coverageAmount: 0 });
        fetchData();
      }
    } catch {}
  };

  // Helper to find employee name by ID
  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'System User';
  };

  const getEmployeeCode = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.employeeCode : '';
  };

  return (
    <RouteGuard permission="hr.benefits.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Benefits Administration"
        description="Configure healthcare schemes, retirement accounts, and enroll company staff with auto-deductions in payroll."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Benefits' }]}
        actions={
          <div className="ui-flex ui-gap-2">
            <Button variant="outline" onClick={() => setShowSchemeForm(true)} className="ui-flex ui-items-center ui-gap-1">
              <Plus size={14} /> New Scheme
            </Button>
            <Button variant="primary" onClick={() => setShowEnrollForm(true)} className="ui-flex ui-items-center ui-gap-1">
              <Plus size={14} /> Enroll Staff
            </Button>
          </div>
        }
      />

      {msg && (
        <div className={styles.message}>
          {msg}
        </div>
      )}

      {/* Stats row */}
      <div className={styles.stats}>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Active Schemes</span>
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <h4 className={styles.statValue}>{schemes.length}</h4>
        </Card>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Total Enrollments</span>
            <Users size={16} className="text-success" />
          </div>
          <h4 className={styles.statValue}>{enrollments.length}</h4>
        </Card>
        <Card>
          <div className="ui-flex-between">
            <span className="ui-text-xs-muted">Company Contributions</span>
            <DollarSign size={16} className="text-warning" />
          </div>
          <h4 className={styles.statValue}>
            ${enrollments.reduce((sum, e) => sum + Number(e.scheme.employerCostShare), 0).toFixed(2)} /mo
          </h4>
        </Card>
      </div>

      {showSchemeForm && (
        <Card padding="md">
          <h4 className={styles.formTitle}>Add New Benefit Scheme</h4>
          <form onSubmit={handleCreateScheme} className="ui-stack-3">
            <div className="ui-grid-2">
              <input className="ui-input" placeholder="Scheme Name (e.g. Premium Medical)" value={schemeForm.name} onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })} required />
              <select className="ui-input" value={schemeForm.type} onChange={e => setSchemeForm({ ...schemeForm, type: e.target.value })} required>
                <option value="HEALTH_INSURANCE">Health Insurance</option>
                <option value="PENSION">Pension / 401(k)</option>
                <option value="FSA">Flexible Spending Account (FSA)</option>
                <option value="DENTAL">Dental Care</option>
                <option value="VISION">Vision Care</option>
              </select>
            </div>
            <div className={styles.formGrid}>
              <input className="ui-input" placeholder="Provider (e.g. Blue Shield)" value={schemeForm.provider} onChange={e => setSchemeForm({ ...schemeForm, provider: e.target.value })} required />
              <input className="ui-input" type="number" step="0.01" placeholder="Employee Share ($)" value={schemeForm.employeeCostShare || ''} onChange={e => setSchemeForm({ ...schemeForm, employeeCostShare: parseFloat(e.target.value) || 0 })} required />
              <input className="ui-input" type="number" step="0.01" placeholder="Employer Share ($)" value={schemeForm.employerCostShare || ''} onChange={e => setSchemeForm({ ...schemeForm, employerCostShare: parseFloat(e.target.value) || 0 })} required />
            </div>
            <textarea className="ui-input" placeholder="Description" rows={3} value={schemeForm.description} onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })} />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowSchemeForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Create Scheme</Button>
            </div>
          </form>
        </Card>
      )}

      {showEnrollForm && (
        <Card padding="md">
          <h4 className={styles.formTitle}>Enroll Employee in Benefit Plan</h4>
          <form onSubmit={handleEnroll} className="ui-stack-3">
            <div className={styles.formGrid}>
              <select className="ui-input" value={enrollForm.employeeId} onChange={e => setEnrollForm({ ...enrollForm, employeeId: e.target.value })} required>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
              </select>
              <select className="ui-input" value={enrollForm.schemeId} onChange={e => setEnrollForm({ ...enrollForm, schemeId: e.target.value })} required>
                <option value="">Select Plan</option>
                {schemes.map(s => <option key={s.id} value={s.id}>{s.name} ({s.provider})</option>)}
              </select>
              <input className="ui-input" type="number" step="0.01" placeholder="Coverage Amount (Optional)" value={enrollForm.coverageAmount || ''} onChange={e => setEnrollForm({ ...enrollForm, coverageAmount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowEnrollForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Complete Enrollment</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.content}>
          {/* Active schemes lists */}
          <div className="ui-stack-4">
            <h4 className="m-0">Active Benefit Schemes</h4>
            {schemes.length === 0 ? (
              <div className={styles.emptySchemes}>No active schemes.</div>
            ) : (
              schemes.map(s => (
                <Card key={s.id} padding="sm">
                  <div className={styles.schemeHeader}>
                    <span className={styles.schemeName}>{s.name}</span>
                    <span className={styles.schemeType}>{s.type.replace('_', ' ')}</span>
                  </div>
                  <div className="ui-text-xs-muted">Provider: {s.provider}</div>
                  <div className={styles.schemeCosts}>
                    <span>EE: ${Number(s.employeeCostShare).toFixed(2)}/mo</span>
                    <span>ER: ${Number(s.employerCostShare).toFixed(2)}/mo</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Active Enrollments Table */}
          <div className="ui-stack-4">
            <h4 className="m-0">Enrollment Log</h4>
            {(() => {
              const enrollmentColumns: ListColumn[] = [
                { key: 'employeeId', header: 'Employee', render: (v, row) => {
                  const enr = row as unknown as Enrollment;
                  return (
                    <div>
                      <div className="font-semibold">{getEmployeeName(enr.employeeId)}</div>
                      <div className="ui-text-caption">{getEmployeeCode(enr.employeeId)}</div>
                    </div>
                  );
                }},
                { key: 'schemeId', header: 'Scheme Details', render: (_v, row) => {
                  const enr = row as unknown as Enrollment;
                  return (
                    <div>
                      <div className={styles.enrollmentScheme}>{enr.scheme?.name}</div>
                      <div className="ui-text-caption">{enr.scheme?.provider}</div>
                    </div>
                  );
                }},
                { key: 'coverageAmount', header: 'Costs (EE/ER)', render: (_v, row) => {
                  const enr = row as unknown as Enrollment;
                  return (
                    <div>
                      <div>EE: ${Number(enr.scheme?.employeeCostShare).toFixed(2)}/mo</div>
                      <div>ER: ${Number(enr.scheme?.employerCostShare).toFixed(2)}/mo</div>
                    </div>
                  );
                }},
                { key: 'enrollmentDate', header: 'Enrolled Date', render: (v) => new Date(String(v)).toLocaleDateString() },
                { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
              ];
              return (
                <ListPageTemplate
                  title=""
                  columns={enrollmentColumns}
                  data={enrollments as unknown as Record<string, unknown>[]}
                  loading={loading}
                  emptyTitle="No enrollments found."
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
