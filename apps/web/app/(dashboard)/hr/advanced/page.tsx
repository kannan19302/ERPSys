'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSliders, 
  RefreshCw, 
  Coffee, 
  DollarSign, 
  CalendarDays,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalGross: string;
  totalDeductions: string;
  totalNet: string;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  policy?: {
    name: string;
  };
}

interface Shift {
  id: string;
  employeeId: string;
  startTime: string;
  endTime: string;
  note?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function AdvancedHRPage() {
  const [loading, setLoading] = useState(true);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTab, setActiveTab] = useState<'payroll' | 'leaves' | 'shifts'>('payroll');

  // Form states
  const [selectedEmp, setSelectedEmp] = useState('');
  const [baseSalary, setBaseSalary] = useState(4000);
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [payRes, reqRes, shiftRes, empRes] = await Promise.all([
        fetch('http://localhost:3001/advanced-hr/payroll', { headers }),
        fetch('http://localhost:3001/advanced-hr/leaves/requests', { headers }),
        fetch('http://localhost:3001/advanced-hr/shifts', { headers }),
        fetch('http://localhost:3001/hr/employees', { headers }),
      ]);

      const [pays, reqs, shfts, emps] = await Promise.all([
        payRes.json(), reqRes.json(), shiftRes.json(), empRes.json()
      ]);

      setPayrollRuns(Array.isArray(pays) ? pays : []);
      setLeaveRequests(Array.isArray(reqs) ? reqs : []);
      setShifts(Array.isArray(shfts) ? shfts : []);
      setEmployees(Array.isArray(emps) ? emps : []);

      if (emps.length > 0) setSelectedEmp(emps[0].id);

      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/advanced-hr/salaries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId: selectedEmp, baseSalary })
      });
      loadData();
      alert('Salary Structure updated.');
    } catch {
      alert('Error updating salary structure.');
    }
  };

  const handleRunPayroll = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/advanced-hr/payroll/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ periodStart: '2026-06-01', periodEnd: '2026-06-30' })
      });
      if (res.ok) {
        loadData();
        alert('Payroll run completed successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Error running payroll');
      }
    } catch {
      alert('Error running payroll.');
    }
  };

  const handleApproveLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/advanced-hr/leaves/requests/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      loadData();
    } catch {
      alert('Error actioning leave approval.');
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !shiftStart || !shiftEnd) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/advanced-hr/shifts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId: selectedEmp, startTime: shiftStart, endTime: shiftEnd })
      });
      setShiftStart('');
      setShiftEnd('');
      loadData();
      alert('Shift assigned successfully.');
    } catch {
      alert('Error assigning shift.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading HR Management...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <FileSliders style={{ color: 'var(--color-primary)' }} />
          Advanced HR & Payroll Engine
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Manage employee salary structures, execute payroll periods, approve leaves, and allocate shift rotations.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('payroll')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'payroll' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'payroll' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <DollarSign size={16} /> Payroll & Salaries
        </button>
        <button 
          onClick={() => setActiveTab('leaves')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'leaves' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'leaves' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Coffee size={16} /> Leave Management
        </button>
        <button 
          onClick={() => setActiveTab('shifts')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'shifts' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'shifts' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <CalendarDays size={16} /> Shifts Scheduling
        </button>
      </div>

      {/* Main layout grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Lists Container */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'payroll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Payroll History</h2>
                <button onClick={handleRunPayroll} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-xs)' }}>
                  Execute Payroll Run
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {payrollRuns.map(run => (
                  <div key={run.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'bold' }}>Period: {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 'bold' }}>{run.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span>Gross: ${(parseFloat(run.totalGross)).toFixed(2)}</span>
                      <span>Deductions: ${(parseFloat(run.totalDeductions)).toFixed(2)}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Net Pay: ${(parseFloat(run.totalNet)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Leave Requests</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {leaveRequests.map(req => (
                  <div key={req.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Type: {req.policy?.name}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Reason: {req.reason || 'N/A'}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Dates: {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {req.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleApproveLeave(req.id, 'APPROVED')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)' }}><CheckCircle size={20} /></button>
                          <button onClick={() => handleApproveLeave(req.id, 'REJECTED')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><XCircle size={20} /></button>
                        </>
                      ) : (
                        <span style={{
                          fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                          background: req.status === 'APPROVED' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                          color: req.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>{req.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Shift Calendar Roster</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Employee ID</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Start Time</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>End Time</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{s.employeeId}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{new Date(s.startTime).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{new Date(s.endTime).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{s.note || 'Regular Shift'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Panel: Configuration Forms */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'payroll' && (
            <form onSubmit={handleCreateSalary} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Configure Salaries</h3>
              
              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Select Employee</label>
                <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }}>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Base Monthly Salary ($)</label>
                <input type="number" value={baseSalary} onChange={(e) => setBaseSalary(parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', padding: 'var(--space-2.5)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                Set Structure
              </button>
            </form>
          )}

          {activeTab === 'shifts' && (
            <form onSubmit={handleCreateShift} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Assign Shift</h3>
              
              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Select Employee</label>
                <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }}>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Start Date/Time</label>
                <input type="datetime-local" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>End Date/Time</label>
                <input type="datetime-local" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginTop: 'var(--space-1.5)', fontSize: 'var(--text-sm)' }} />
              </div>

              <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', padding: 'var(--space-2.5)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                Allocate Shift
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
