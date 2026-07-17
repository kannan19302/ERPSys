'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { DollarSign, Plus, Calculator, ArrowRight } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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
  const client = useApiClient();
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salRes, payRes, empRes, taxRes] = await Promise.all([
        client.get<SalaryStructure[]>('/api/v1/advanced-hr/salaries'),
        client.get<PayrollRun[]>('/api/v1/advanced-hr/payroll'),
        client.get<Employee[]>('/api/v1/hr/employees'),
        client.get<TaxTable[]>('/api/v1/advanced-hr/tax-tables'),
      ]);
      setSalaries(salRes); setPayrollRuns(payRes); setEmployees(empRes); setTaxTables(taxRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  const saveSalaryStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await client.post('/api/v1/advanced-hr/salaries', {
          employeeId: salaryForm.employeeId,
          baseSalary: parseFloat(salaryForm.baseSalary)
        });
      if (res) {
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
      const res = await client.post('/api/v1/advanced-hr/payroll/run', payrollForm);
      if (res) {
        setMsg('Payroll generated successfully.');
        setShowPayrollForm(false);
        setPayrollForm({ periodStart: '', periodEnd: '' });
        fetchData();
      } else {
        setMsg('Error processing payroll.');
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
      const res = await client.post('/api/v1/advanced-hr/tax-tables', {
          country: taxForm.country,
          state: taxForm.state || null,
          incomeBracketMin: parseFloat(taxForm.incomeBracketMin),
          incomeBracketMax: taxForm.incomeBracketMax ? parseFloat(taxForm.incomeBracketMax) : null,
          taxRate: parseFloat(taxForm.taxRate),
          allowanceAmount: parseFloat(taxForm.allowanceAmount) || 0
        });
      if (res) {
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
    <RouteGuard permission="hr.payroll.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Payroll & Salaries"
        description="Administer employee salary grids, configure allowances, and process pay runs."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Payroll' }]}
        actions={
          <div className="ui-flex ui-gap-2">
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
        <div className={styles.s0}>
          {msg}
        </div>
      )}

      {/* Salary Structure Form */}
      {showSalaryForm && (
        <Card padding="md">
          <h4 className={styles.s1}>Configure Employee Base Salary</h4>
          <form onSubmit={saveSalaryStructure} className="ui-stack-3">
            <select
              className="ui-input"
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
              className="ui-input"
              placeholder="Base Salary Monthly (e.g. 6000)"
              value={salaryForm.baseSalary}
              onChange={e => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })}
              required
            />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowSalaryForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Save Structure</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Run Payroll Form */}
      {showPayrollForm && (
        <Card padding="md">
          <h4 className={styles.s2}>Execute New Payroll Period</h4>
          <form onSubmit={runPayrollProcess} className="ui-stack-3">
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Period Start</label>
                <input
                  type="date"
                  className="ui-input"
                  value={payrollForm.periodStart}
                  onChange={e => setPayrollForm({ ...payrollForm, periodStart: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">Period End</label>
                <input
                  type="date"
                  className="ui-input"
                  value={payrollForm.periodEnd}
                  onChange={e => setPayrollForm({ ...payrollForm, periodEnd: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowPayrollForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Run Calculation</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tax Bracket Form */}
      {showTaxForm && (
        <Card padding="md">
          <h4 className={styles.s3}>Define Income Tax Bracket</h4>
          <form onSubmit={saveTaxRule} className="ui-stack-3">
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Country Code (e.g. US)</label>
                <input
                  className="ui-input"
                  placeholder="US"
                  value={taxForm.country}
                  onChange={e => setTaxForm({ ...taxForm, country: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">State Code (Optional)</label>
                <input
                  className="ui-input"
                  placeholder="CA"
                  value={taxForm.state}
                  onChange={e => setTaxForm({ ...taxForm, state: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.s4}>
              <div>
                <label className="ui-text-caption">Bracket Min ($)</label>
                <input
                  type="number"
                  className="ui-input"
                  placeholder="0"
                  value={taxForm.incomeBracketMin}
                  onChange={e => setTaxForm({ ...taxForm, incomeBracketMin: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">Bracket Max ($)</label>
                <input
                  type="number"
                  className="ui-input"
                  placeholder="No Max"
                  value={taxForm.incomeBracketMax}
                  onChange={e => setTaxForm({ ...taxForm, incomeBracketMax: e.target.value })}
                />
              </div>
              <div>
                <label className="ui-text-caption">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="ui-input"
                  placeholder="15"
                  value={taxForm.taxRate}
                  onChange={e => setTaxForm({ ...taxForm, taxRate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">Standard Allowance ($)</label>
                <input
                  type="number"
                  className="ui-input"
                  placeholder="0"
                  value={taxForm.allowanceAmount}
                  onChange={e => setTaxForm({ ...taxForm, allowanceAmount: e.target.value })}
                />
              </div>
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowTaxForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Save Tax Rule</Button>
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
          {/* Payroll Runs List */}
          <div className="ui-stack-4">
            <h3>Payroll History</h3>
            {payrollRuns.length === 0 ? (
              <Card>
                <div className={styles.s6}>
                  <DollarSign size={32} className={styles.s7} />
                  <p className="m-0">No payroll runs processed yet.</p>
                </div>
              </Card>
            ) : (
              payrollRuns.map(run => (
                <Card key={run.id} padding="md">
                  <div className={styles.s8}>
                    <div>
                      <h4 className="m-0">
                        Period: {new Date(run.periodStart).toLocaleDateString()} <ArrowRight size={12} className={styles.s9} /> {new Date(run.periodEnd).toLocaleDateString()}
                      </h4>
                      <span className="ui-text-caption">ID: {run.id}</span>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                  <div className={styles.s10}>
                    <div>
                      <div className={styles.s11}>Gross Distributed</div>
                      <span className="font-semibold">${Number(run.totalGross).toLocaleString()}</span>
                    </div>
                    <div>
                      <div className={styles.s12}>Deductions</div>
                      <span className="font-semibold">-${Number(run.totalDeductions).toLocaleString()}</span>
                    </div>
                    <div>
                      <div className={styles.s13}>Net Paid</div>
                      <span className={styles.s14}>${Number(run.totalNet).toLocaleString()}</span>
                    </div>
                  </div>
                  {run.slips && run.slips.length > 0 && (
                    <div className={styles.s15}>
                      <h5 className={styles.s16}>Payslips Summary (Calculated Deductions)</h5>
                      <div className="ui-stack-2">
                        {run.slips.map(slip => (
                          <div key={slip.id} className={styles.s17}>
                            <span className="font-semibold">{getEmpName(slip.employeeId)}</span>
                            <div className={styles.s18}>
                              <span>Gross: <strong>${Number(slip.grossSalary).toLocaleString()}</strong></span>
                              <span className="ui-text-danger">Tax: <strong>-${Number(slip.deductions).toLocaleString()}</strong></span>
                              <span className="ui-text-success">Net: <strong>${Number(slip.netSalary).toLocaleString()}</strong></span>
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
          <div className="ui-stack-6">
            <div className="ui-stack-4">
              <h3>Salary Registry</h3>
              <ListPageTemplate
                title=""
                columns={[
                  { key: 'employeeId', header: 'Employee', render: (v) => getEmpName(String(v)) },
                  { key: 'baseSalary', header: 'Base Salary', render: (v) => <span className="font-semibold">${Number(v).toLocaleString()}/mo</span> },
                ] as ListColumn[]}
                data={salaries as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No custom structures defined."
              />
            </div>

            <div className="ui-stack-4">
              <h3>Tax Brackets Configuration</h3>
              <ListPageTemplate
                title=""
                columns={[
                  { key: 'country', header: 'Region', render: (v, row) => {
                    const tax = row as unknown as TaxTable;
                    return (
                      <div>
                        <div className="font-semibold">{tax.country}</div>
                        {tax.state && <span className="ui-text-micro ui-text-muted">{tax.state}</span>}
                      </div>
                    );
                  }},
                  { key: 'incomeBracketMin', header: 'Range', render: (v, row) => {
                    const tax = row as unknown as TaxTable;
                    return `$${Number(tax.incomeBracketMin).toLocaleString()} - ${tax.incomeBracketMax ? `$${Number(tax.incomeBracketMax).toLocaleString()}` : '∞'}`;
                  }},
                  { key: 'taxRate', header: 'Tax Rate', render: (v) => <span className="font-semibold">{Number(v)}%</span> },
                ] as ListColumn[]}
                data={taxTables as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No tax brackets configured."
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}

