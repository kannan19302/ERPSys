'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { DollarSign, Plus, Calculator, ArrowRight } from 'lucide-react';

interface SalaryStructure {
  id: string;
  employeeId: string;
  baseSalary: number | string;
  allowances: Record<string, unknown>;
  deductions: Record<string, unknown>;
}

interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalGross: number | string;
  totalDeductions: number | string;
  totalNet: number | string;
  slips?: Array<{
    id: string;
    employeeId: string;
    grossSalary: number | string;
    deductions: number | string;
    netSalary: number | string;
  }>;
}

interface TaxTable {
  id: string;
  country: string;
  state: string | null;
  incomeBracketMin: number | string;
  incomeBracketMax: number | string | null;
  taxRate: number | string;
  allowanceAmount: number | string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function PayrollPage() {
  const [salaries, setSalaries] = useState<SalaryStructure[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [taxTables, setTaxTables] = useState<TaxTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Forms
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ employeeId: '', baseSalary: '' });
  
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ periodStart: '', periodEnd: '' });

  const [showTaxForm, setShowTaxForm] = useState(false);
  const [taxForm, setTaxForm] = useState({ country: 'US', state: '', incomeBracketMin: '', incomeBracketMax: '', taxRate: '', allowanceAmount: '0' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salRes, payRes, empRes, taxRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/salaries', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/payroll', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/tax-tables', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (salRes.ok) setSalaries(await salRes.json());
      if (payRes.ok) setPayrollRuns(await payRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (taxRes.ok) setTaxTables(await taxRes.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const saveSalaryStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/salaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: salaryForm.employeeId,
          baseSalary: parseFloat(salaryForm.baseSalary)
        })
      });
      if (res.ok) {
        setMsg('Salary structure updated successfully.');
        setShowSalaryForm(false);
        setSalaryForm({ employeeId: '', baseSalary: '' });
        fetchData();
      } else {
        setMsg('Error updating salary structure.');
      }
    } catch {
      setMsg('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const runPayrollProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/payroll/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payrollForm)
      });
      if (res.ok) {
        setMsg('Payroll generated successfully.');
        setShowPayrollForm(false);
        setPayrollForm({ periodStart: '', periodEnd: '' });
        fetchData();
      } else {
        const errorData = await res.json();
        setMsg(errorData.message || 'Error processing payroll.');
      }
    } catch {
      setMsg('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveTaxRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/tax-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          country: taxForm.country,
          state: taxForm.state || null,
          incomeBracketMin: parseFloat(taxForm.incomeBracketMin),
          incomeBracketMax: taxForm.incomeBracketMax ? parseFloat(taxForm.incomeBracketMax) : null,
          taxRate: parseFloat(taxForm.taxRate),
          allowanceAmount: parseFloat(taxForm.allowanceAmount) || 0
        })
      });
      if (res.ok) {
        setMsg('Tax bracket rule saved successfully.');
        setShowTaxForm(false);
        setTaxForm({ country: 'US', state: '', incomeBracketMin: '', incomeBracketMax: '', taxRate: '', allowanceAmount: '0' });
        fetchData();
      } else {
        setMsg('Error saving tax rule.');
      }
    } catch {
      setMsg('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Payroll & Salaries"
        description="Administer employee salary grids, configure allowances, and process pay runs."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Payroll' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={() => setShowTaxForm(!showTaxForm)}>
              <Plus size={14} /> Tax Bracket
            </Button>
            <Button variant="outline" onClick={() => setShowSalaryForm(!showSalaryForm)}>
              <Plus size={14} /> Structure
            </Button>
            <Button variant="primary" onClick={() => setShowPayrollForm(!showPayrollForm)}>
              <Calculator size={14} /> Run Payroll
            </Button>
          </div>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {/* Salary Structure Form */}
      {showSalaryForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Configure Employee Base Salary</h4>
          <form onSubmit={saveSalaryStructure} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
              value={salaryForm.employeeId}
              onChange={e => setSalaryForm({ ...salaryForm, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <input
              type="number"
              className="frappe-input"
              placeholder="Base Salary Monthly (e.g. 6000)"
              value={salaryForm.baseSalary}
              onChange={e => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })}
              required
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowSalaryForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Save Structure</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Run Payroll Form */}
      {showPayrollForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Execute New Payroll Period</h4>
          <form onSubmit={runPayrollProcess} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Period Start</label>
                <input
                  type="date"
                  className="frappe-input"
                  value={payrollForm.periodStart}
                  onChange={e => setPayrollForm({ ...payrollForm, periodStart: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Period End</label>
                <input
                  type="date"
                  className="frappe-input"
                  value={payrollForm.periodEnd}
                  onChange={e => setPayrollForm({ ...payrollForm, periodEnd: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowPayrollForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Run Calculation</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tax Bracket Form */}
      {showTaxForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Define Income Tax Bracket</h4>
          <form onSubmit={saveTaxRule} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Country Code (e.g. US)</label>
                <input
                  className="frappe-input"
                  placeholder="US"
                  value={taxForm.country}
                  onChange={e => setTaxForm({ ...taxForm, country: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>State Code (Optional)</label>
                <input
                  className="frappe-input"
                  placeholder="CA"
                  value={taxForm.state}
                  onChange={e => setTaxForm({ ...taxForm, state: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Bracket Min ($)</label>
                <input
                  type="number"
                  className="frappe-input"
                  placeholder="0"
                  value={taxForm.incomeBracketMin}
                  onChange={e => setTaxForm({ ...taxForm, incomeBracketMin: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Bracket Max ($)</label>
                <input
                  type="number"
                  className="frappe-input"
                  placeholder="No Max"
                  value={taxForm.incomeBracketMax}
                  onChange={e => setTaxForm({ ...taxForm, incomeBracketMax: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="frappe-input"
                  placeholder="15"
                  value={taxForm.taxRate}
                  onChange={e => setTaxForm({ ...taxForm, taxRate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Standard Allowance ($)</label>
                <input
                  type="number"
                  className="frappe-input"
                  placeholder="0"
                  value={taxForm.allowanceAmount}
                  onChange={e => setTaxForm({ ...taxForm, allowanceAmount: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowTaxForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Save Tax Rule</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          {/* Payroll Runs List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3>Payroll History</h3>
            {payrollRuns.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <DollarSign size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No payroll runs processed yet.</p>
                </div>
              </Card>
            ) : (
              payrollRuns.map(run => (
                <Card key={run.id} padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>
                        Period: {new Date(run.periodStart).toLocaleDateString()} <ArrowRight size={12} style={{ display: 'inline' }} /> {new Date(run.periodEnd).toLocaleDateString()}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ID: {run.id}</span>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>Gross Distributed</div>
                      <span style={{ fontWeight: 600 }}>${Number(run.totalGross).toLocaleString()}</span>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>Deductions</div>
                      <span style={{ fontWeight: 600 }}>-${Number(run.totalDeductions).toLocaleString()}</span>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>Net Paid</div>
                      <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>${Number(run.totalNet).toLocaleString()}</span>
                    </div>
                  </div>
                  {run.slips && run.slips.length > 0 && (
                    <div style={{ marginTop: 'var(--space-4)', borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--space-4)' }}>
                      <h5 style={{ margin: '0 0 var(--space-2)', fontSize: '12px' }}>Payslips Summary (Calculated Deductions)</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {run.slips.map(slip => (
                          <div key={slip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: 'var(--color-bg-sunken)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontWeight: 600 }}>{getEmpName(slip.employeeId)}</span>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <span>Gross: <strong>${Number(slip.grossSalary).toLocaleString()}</strong></span>
                              <span style={{ color: 'var(--color-danger)' }}>Tax: <strong>-${Number(slip.deductions).toLocaleString()}</strong></span>
                              <span style={{ color: 'var(--color-success)' }}>Net: <strong>${Number(slip.netSalary).toLocaleString()}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Salaries Structure List & Tax Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3>Salary Registry</h3>
              <Card padding="none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Employee</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Base Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.length === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No custom structures defined.</td>
                      </tr>
                    ) : (
                      salaries.map(sal => (
                        <tr key={sal.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)' }}>{getEmpName(sal.employeeId)}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600 }}>
                            ${Number(sal.baseSalary).toLocaleString()}/mo
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3>Tax Brackets Configuration</h3>
              <Card padding="none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Region</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Range</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Tax Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxTables.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No tax brackets configured.</td>
                      </tr>
                    ) : (
                      taxTables.map(tax => (
                        <tr key={tax.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)' }}>
                            <div style={{ fontWeight: 600 }}>{tax.country}</div>
                            {tax.state && <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{tax.state}</span>}
                          </td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                            ${Number(tax.incomeBracketMin).toLocaleString()} - {tax.incomeBracketMax ? `$${Number(tax.incomeBracketMax).toLocaleString()}` : '∞'}
                          </td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600 }}>
                            {Number(tax.taxRate)}%
                          </td>
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
