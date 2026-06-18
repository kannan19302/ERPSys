'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Plus, ShieldCheck, Users, DollarSign } from 'lucide-react';

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schRes, enrRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/benefits/schemes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/benefits/enrollments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (schRes.ok) setSchemes(await schRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (enrRes.ok) setEnrollments(await enrRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (empRes.ok) setEmployees(await empRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
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
      const res = await fetch('/api/v1/advanced-hr/benefits/schemes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(schemeForm)
      });
      if (res.ok) {
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
      const res = await fetch('/api/v1/advanced-hr/benefits/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(enrollForm)
      });
      if (res.ok) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Benefits Administration"
        description="Configure healthcare schemes, retirement accounts, and enroll company staff with auto-deductions in payroll."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Benefits' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={() => setShowSchemeForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> New Scheme
            </Button>
            <Button variant="primary" onClick={() => setShowEnrollForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Enroll Staff
            </Button>
          </div>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Active Schemes</span>
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0' }}>{schemes.length}</h4>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Enrollments</span>
            <Users size={16} className="text-success" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0' }}>{enrollments.length}</h4>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Company Contributions</span>
            <DollarSign size={16} className="text-warning" />
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: '8px 0 0' }}>
            ${enrollments.reduce((sum, e) => sum + Number(e.scheme.employerCostShare), 0).toFixed(2)} /mo
          </h4>
        </Card>
      </div>

      {showSchemeForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4)' }}>Add New Benefit Scheme</h4>
          <form onSubmit={handleCreateScheme} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <input className="frappe-input" placeholder="Scheme Name (e.g. Premium Medical)" value={schemeForm.name} onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })} required />
              <select className="frappe-input" value={schemeForm.type} onChange={e => setSchemeForm({ ...schemeForm, type: e.target.value })} required>
                <option value="HEALTH_INSURANCE">Health Insurance</option>
                <option value="PENSION">Pension / 401(k)</option>
                <option value="FSA">Flexible Spending Account (FSA)</option>
                <option value="DENTAL">Dental Care</option>
                <option value="VISION">Vision Care</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <input className="frappe-input" placeholder="Provider (e.g. Blue Shield)" value={schemeForm.provider} onChange={e => setSchemeForm({ ...schemeForm, provider: e.target.value })} required />
              <input className="frappe-input" type="number" step="0.01" placeholder="Employee Share ($)" value={schemeForm.employeeCostShare || ''} onChange={e => setSchemeForm({ ...schemeForm, employeeCostShare: parseFloat(e.target.value) || 0 })} required />
              <input className="frappe-input" type="number" step="0.01" placeholder="Employer Share ($)" value={schemeForm.employerCostShare || ''} onChange={e => setSchemeForm({ ...schemeForm, employerCostShare: parseFloat(e.target.value) || 0 })} required />
            </div>
            <textarea className="frappe-input" placeholder="Description" rows={3} value={schemeForm.description} onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="outline" type="button" onClick={() => setShowSchemeForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Create Scheme</Button>
            </div>
          </form>
        </Card>
      )}

      {showEnrollForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4)' }}>Enroll Employee in Benefit Plan</h4>
          <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <select className="frappe-input" value={enrollForm.employeeId} onChange={e => setEnrollForm({ ...enrollForm, employeeId: e.target.value })} required>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
              </select>
              <select className="frappe-input" value={enrollForm.schemeId} onChange={e => setEnrollForm({ ...enrollForm, schemeId: e.target.value })} required>
                <option value="">Select Plan</option>
                {schemes.map(s => <option key={s.id} value={s.id}>{s.name} ({s.provider})</option>)}
              </select>
              <input className="frappe-input" type="number" step="0.01" placeholder="Coverage Amount (Optional)" value={enrollForm.coverageAmount || ''} onChange={e => setEnrollForm({ ...enrollForm, coverageAmount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="outline" type="button" onClick={() => setShowEnrollForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Complete Enrollment</Button>
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
          {/* Active schemes lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h4 style={{ margin: 0 }}>Active Benefit Schemes</h4>
            {schemes.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)', textAlign: 'center', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>No active schemes.</div>
            ) : (
              schemes.map(s => (
                <Card key={s.id} padding="sm">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{s.name}</span>
                    <span style={{ fontSize: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: 10, fontWeight: 'bold' }}>{s.type.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Provider: {s.provider}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '11px', borderTop: '1px solid var(--color-border)', paddingTop: 6 }}>
                    <span>EE: ${Number(s.employeeCostShare).toFixed(2)}/mo</span>
                    <span>ER: ${Number(s.employerCostShare).toFixed(2)}/mo</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Active Enrollments Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h4 style={{ margin: 0 }}>Enrollment Log</h4>
            <Card padding="none" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4)' }}>Employee</th>
                    <th style={{ padding: 'var(--space-4)' }}>Scheme Details</th>
                    <th style={{ padding: 'var(--space-4)' }}>Costs (EE/ER)</th>
                    <th style={{ padding: 'var(--space-4)' }}>Enrolled Date</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No enrollments found.</td>
                    </tr>
                  ) : (
                    enrollments.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: 600 }}>{getEmployeeName(e.employeeId)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{getEmployeeCode(e.employeeId)}</div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: 500 }}>{e.scheme?.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{e.scheme?.provider}</div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div>EE: ${Number(e.scheme?.employeeCostShare).toFixed(2)}/mo</div>
                          <div>ER: ${Number(e.scheme?.employerCostShare).toFixed(2)}/mo</div>
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>{new Date(e.enrollmentDate).toLocaleDateString()}</td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                          <StatusBadge status={e.status} />
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
