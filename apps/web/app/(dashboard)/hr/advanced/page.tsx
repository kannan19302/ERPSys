'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  FileSliders, 
  Loader2, 
  Check
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

interface LeavePolicy {
  id: string;
  name: string;
  leaveType: string;
  annualAllocation: number;
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
  employeeCode: string;
}

interface Appraisal {
  id: string;
  employeeId: string;
  reviewerId: string;
  appraisalPeriod: string;
  score: number;
  feedback?: string;
  status: string;
  employeeName: string;
  reviewerName: string;
}

interface Training {
  id: string;
  name: string;
  description?: string;
  instructor?: string;
  startDate: string;
  endDate: string;
}

function AdvancedHRContent() {
  const [loading, setLoading] = useState(true);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  
  const [activeTab, setActiveTab] = useState<'payroll' | 'leaves' | 'shifts' | 'appraisals' | 'trainings'>('payroll');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Form states - Payroll & Salary
  const [selectedEmp, setSelectedEmp] = useState('');
  const [baseSalary, setBaseSalary] = useState(4000);

  // Form states - Shifts
  const [shiftEmp, setShiftEmp] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [shiftNote, setShiftNote] = useState('');

  // Form states - Leave Policy
  const [policyName, setPolicyName] = useState('');
  const [policyType, setPolicyType] = useState('SICK');
  const [policyAlloc, setPolicyAlloc] = useState(10);

  // Form states - Leave Request
  const [leaveEmp, setLeaveEmp] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Form states - Appraisals
  const [appraisalEmp, setAppraisalEmp] = useState('');
  const [appraisalPeriod, setAppraisalPeriod] = useState('');
  const [appraisalScore, setAppraisalScore] = useState(4.0);
  const [appraisalFeedback, setAppraisalFeedback] = useState('');

  // Form states - Trainings
  const [trainingName, setTrainingName] = useState('');
  const [trainingDesc, setTrainingDesc] = useState('');
  const [trainingInst, setTrainingInst] = useState('');
  const [trainingStart, setTrainingStart] = useState('');
  const [trainingEnd, setTrainingEnd] = useState('');

  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['payroll', 'leaves', 'shifts', 'appraisals', 'trainings'].includes(tab)) {
      setActiveTab(tab as 'payroll' | 'leaves' | 'shifts' | 'appraisals' | 'trainings');
    }
  }, [searchParams]);


  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token || ''}` };

      const [payRes, reqRes, policyRes, shiftRes, empRes, appRes, trainRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/payroll', { headers }),
        fetch('/api/v1/advanced-hr/leaves/requests', { headers }),
        fetch('/api/v1/advanced-hr/leaves/policies', { headers }),
        fetch('/api/v1/advanced-hr/shifts', { headers }),
        fetch('/api/v1/hr/employees', { headers }),
        fetch('/api/v1/advanced-hr/appraisals', { headers }),
        fetch('/api/v1/advanced-hr/trainings', { headers }),
      ]);

      const [pays, reqs, policies, shfts, emps, apps, trains] = await Promise.all([
        payRes.json().catch(() => []),
        reqRes.json().catch(() => []),
        policyRes.json().catch(() => []),
        shiftRes.json().catch(() => []),
        empRes.json().catch(() => []),
        appRes.json().catch(() => []),
        trainRes.json().catch(() => []),
      ]);

      setPayrollRuns(Array.isArray(pays) ? pays : []);
      setLeaveRequests(Array.isArray(reqs) ? reqs : []);
      setLeavePolicies(Array.isArray(policies) ? policies : []);
      setShifts(Array.isArray(shfts) ? shfts : []);
      setEmployees(Array.isArray(emps) ? emps : []);
      setAppraisals(Array.isArray(apps) ? apps : []);
      setTrainings(Array.isArray(trains) ? trains : []);

      if (Array.isArray(emps) && emps.length > 0) {
        setSelectedEmp(emps[0].id);
        setShiftEmp(emps[0].id);
        setLeaveEmp(emps[0].id);
        setAppraisalEmp(emps[0].id);
      }
      if (Array.isArray(policies) && policies.length > 0) {
        setSelectedPolicy(policies[0].id);
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSalary = async (empId: string, salAmount: number) => {
    if (!empId) return;
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/advanced-hr/salaries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId: empId, baseSalary: salAmount })
      });
      if (res.ok) {
        setSaveStatus('saved');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleRunPayroll = async () => {
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/advanced-hr/payroll/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ periodStart: '2026-06-01', periodEnd: '2026-06-30' })
      });
      if (res.ok) {
        setSaveStatus('saved');
        loadData();
      } else {
        setSaveStatus('error');
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Error running payroll');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCreateLeavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName || !policyType || !policyAlloc) return;
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/advanced-hr/leaves/policies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: policyName, leaveType: policyType, annualAllocation: policyAlloc })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setPolicyName('');
        setPolicyAlloc(10);
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCreateLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmp || !selectedPolicy || !leaveStart || !leaveEnd) return;
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/advanced-hr/leaves/requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: leaveEmp,
          policyId: selectedPolicy,
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason
        })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setLeaveStart('');
        setLeaveEnd('');
        setLeaveReason('');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleApproveLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/advanced-hr/leaves/requests/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSaveStatus('saved');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftEmp || !shiftStart || !shiftEnd) return;
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/advanced-hr/shifts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId: shiftEmp, startTime: shiftStart, endTime: shiftEnd, note: shiftNote })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setShiftStart('');
        setShiftEnd('');
        setShiftNote('');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCreateAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appraisalEmp || !appraisalPeriod || !appraisalScore) return;
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/advanced-hr/appraisals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: appraisalEmp,
          appraisalPeriod,
          score: appraisalScore,
          feedback: appraisalFeedback
        })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setAppraisalPeriod('');
        setAppraisalScore(4.0);
        setAppraisalFeedback('');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingName || !trainingStart || !trainingEnd) return;
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/advanced-hr/trainings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: trainingName,
          description: trainingDesc,
          instructor: trainingInst,
          startDate: trainingStart,
          endDate: trainingEnd
        })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTrainingName('');
        setTrainingDesc('');
        setTrainingInst('');
        setTrainingStart('');
        setTrainingEnd('');
        loadData();
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 text-muted-foreground gap-2">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span>Loading Advanced HR Modules...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileSliders className="text-primary" />
            Advanced HR & Payroll Engine
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage employee salary structures, execute payroll periods, approve leave policies, review appraisals, and organize trainings.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
          {saveStatus === 'saving' && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <Loader2 size={12} className="animate-spin text-warning" />
              Saving Changes...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-success flex items-center gap-1 font-medium">
              <Check size={14} className="text-success" />
              Sync Active
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-danger font-medium">
              Error Saving
            </span>
          )}
        </div>
      </div>


      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column (Lists) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeTab === 'payroll' && (
            <div className="frappe-card">
              <div className="frappe-card-header flex justify-between items-center">
                <span>Payroll Audit Log</span>
                <button onClick={handleRunPayroll} className="frappe-btn frappe-btn-primary text-xs py-1 px-3">
                  Execute Payroll Run
                </button>
              </div>
              <div className="frappe-card-body flex flex-col gap-4">
                {payrollRuns.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No payroll runs found in this period.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {payrollRuns.map(run => (
                      <div key={run.id} className="p-4 border border-border rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                          <span className="font-semibold text-sm">Period: {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success font-medium uppercase">{run.status}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Gross Alloc</p>
                            <p className="font-semibold text-sm mt-0.5">${parseFloat(run.totalGross).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deductions</p>
                            <p className="font-semibold text-sm mt-0.5 text-danger">${parseFloat(run.totalDeductions).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Net Payout</p>
                            <p className="font-bold text-sm mt-0.5 text-primary">${parseFloat(run.totalNet).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <>
              {/* Leave Requests */}
              <div className="frappe-card">
                <div className="frappe-card-header">
                  <span>Leave Requests Register</span>
                </div>
                <div className="frappe-card-body">
                  {leaveRequests.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No active leave requests filed.</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {leaveRequests.map(req => (
                        <div key={req.id} className="p-4 border border-border rounded-xl flex justify-between items-center bg-muted/10">
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold text-sm">Category: {req.policy?.name || 'Standard Leave'}</p>
                            <p className="text-xs text-muted-foreground">Reason: {req.reason || 'Not specified'}</p>
                            <p className="text-xs text-muted-foreground">Duration: {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            {req.status === 'PENDING' ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleApproveLeave(req.id, 'APPROVED')} className="frappe-btn frappe-btn-primary text-xs py-1 px-3 bg-success hover:bg-success/80">
                                  Approve
                                </button>
                                <button onClick={() => handleApproveLeave(req.id, 'REJECTED')} className="frappe-btn frappe-btn-secondary text-xs py-1 px-3 border-danger/20 text-danger hover:bg-danger/10">
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className={`text-xs px-2.5 py-1 rounded font-semibold uppercase ${req.status === 'APPROVED' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                {req.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Leave Policies */}
              <div className="frappe-card">
                <div className="frappe-card-header">
                  <span>Active Leave Policies</span>
                </div>
                <div className="frappe-card-body p-0">
                  {leavePolicies.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No leave policies registered.</div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-2.5 font-medium text-muted-foreground">Policy Name</th>
                          <th className="px-4 py-2.5 font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-2.5 font-medium text-muted-foreground text-right">Annual Allocation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leavePolicies.map(p => (
                          <tr key={p.id} className="border-b border-border hover:bg-muted/10">
                            <td className="px-4 py-3 font-semibold">{p.name}</td>
                            <td className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">{p.leaveType}</td>
                            <td className="px-4 py-3 text-right font-medium">{p.annualAllocation} Days</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'shifts' && (
            <div className="frappe-card">
              <div className="frappe-card-header">
                <span>Roster Shift Schedule</span>
              </div>
              <div className="frappe-card-body p-0">
                {shifts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No assigned shift rotations.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Employee</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Start Time</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">End Time</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map(s => {
                        const matchedEmp = employees.find(e => e.id === s.employeeId);
                        const empName = matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : s.employeeId;
                        return (
                          <tr key={s.id} className="border-b border-border hover:bg-muted/10">
                            <td className="px-4 py-3 font-semibold">{empName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(s.startTime).toLocaleString()}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(s.endTime).toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs italic text-muted-foreground">{s.note || 'Regular Shift Rotation'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appraisals' && (
            <div className="frappe-card">
              <div className="frappe-card-header">
                <span>Performance Appraisal Register</span>
              </div>
              <div className="frappe-card-body p-0">
                {appraisals.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No appraisal logs recorded.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Employee</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Period</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground text-center">Score</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Reviewer</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appraisals.map(a => (
                        <tr key={a.id} className="border-b border-border hover:bg-muted/10">
                          <td className="px-4 py-3 font-semibold">{a.employeeName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{a.appraisalPeriod}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs">
                              {a.score.toFixed(1)} / 5.0
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{a.reviewerName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{a.feedback || 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'trainings' && (
            <div className="frappe-card">
              <div className="frappe-card-header">
                <span>Training & Seminar Calendar</span>
              </div>
              <div className="frappe-card-body p-0">
                {trainings.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No scheduled trainings found.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Program Name</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Instructor</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Start Date</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">End Date</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainings.map(t => (
                        <tr key={t.id} className="border-b border-border hover:bg-muted/10">
                          <td className="px-4 py-3 font-semibold text-primary">{t.name}</td>
                          <td className="px-4 py-3 font-medium text-muted-foreground">{t.instructor || 'Unassigned'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(t.startDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(t.endDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{t.description || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Configuration Forms) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {activeTab === 'payroll' && (
            <div className="frappe-card">
              <div className="frappe-card-header">
                <span>Salary Management</span>
              </div>
              <div className="frappe-card-body">
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-muted-foreground">
                    Define the base monthly compensation structures. Changes to the fields will automatically sync to the directory database.
                  </p>
                  
                  <div className="frappe-form-group">
                    <label className="frappe-label">Selected Employee</label>
                    <select 
                      value={selectedEmp} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedEmp(val);
                        handleCreateSalary(val, baseSalary);
                      }} 
                      className="frappe-input"
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Base Monthly Salary ($)</label>
                    <input 
                      type="number" 
                      value={baseSalary} 
                      onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)} 
                      onBlur={() => handleCreateSalary(selectedEmp, baseSalary)}
                      className="frappe-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="flex flex-col gap-6">
              {/* Leave Policy Form */}
              <div className="frappe-card">
                <div className="frappe-card-header">
                  <span>Define Leave Policy</span>
                </div>
                <div className="frappe-card-body">
                  <form onSubmit={handleCreateLeavePolicy} className="flex flex-col gap-4">
                    <div className="frappe-form-group">
                      <label className="frappe-label">Policy Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Parental Leave" 
                        value={policyName} 
                        onChange={(e) => setPolicyName(e.target.value)}
                        className="frappe-input"
                      />
                    </div>
                    
                    <div className="frappe-form-group">
                      <label className="frappe-label">Leave Type Category</label>
                      <select 
                        value={policyType} 
                        onChange={(e) => setPolicyType(e.target.value)}
                        className="frappe-input"
                      >
                        <option value="SICK">Sick Leave</option>
                        <option value="CASUAL">Casual Leave</option>
                        <option value="ANNUAL">Annual Leave</option>
                        <option value="MATERNITY">Maternity/Paternity</option>
                      </select>
                    </div>

                    <div className="frappe-form-group">
                      <label className="frappe-label">Annual Allocation (Days)</label>
                      <input 
                        type="number" 
                        required
                        value={policyAlloc} 
                        onChange={(e) => setPolicyAlloc(parseInt(e.target.value) || 0)}
                        className="frappe-input"
                      />
                    </div>

                    <button type="submit" className="frappe-btn frappe-btn-primary w-full text-xs font-semibold">
                      Create Policy
                    </button>
                  </form>
                </div>
              </div>

              {/* Leave Request Form */}
              <div className="frappe-card">
                <div className="frappe-card-header">
                  <span>File Leave Request</span>
                </div>
                <div className="frappe-card-body">
                  <form onSubmit={handleCreateLeaveRequest} className="flex flex-col gap-4">
                    <div className="frappe-form-group">
                      <label className="frappe-label">Requesting Employee</label>
                      <select 
                        value={leaveEmp} 
                        onChange={(e) => setLeaveEmp(e.target.value)}
                        className="frappe-input"
                        required
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="frappe-form-group">
                      <label className="frappe-label">Applicable Policy</label>
                      <select 
                        value={selectedPolicy} 
                        onChange={(e) => setSelectedPolicy(e.target.value)}
                        className="frappe-input"
                        required
                      >
                        <option value="">-- Choose Policy --</option>
                        {leavePolicies.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.annualAllocation}d)</option>
                        ))}
                      </select>
                    </div>

                    <div className="frappe-grid-2">
                      <div className="frappe-form-group">
                        <label className="frappe-label">Start Date</label>
                        <input 
                          type="date" 
                          required
                          value={leaveStart} 
                          onChange={(e) => setLeaveStart(e.target.value)}
                          className="frappe-input"
                        />
                      </div>
                      <div className="frappe-form-group">
                        <label className="frappe-label">End Date</label>
                        <input 
                          type="date" 
                          required
                          value={leaveEnd} 
                          onChange={(e) => setLeaveEnd(e.target.value)}
                          className="frappe-input"
                        />
                      </div>
                    </div>

                    <div className="frappe-form-group">
                      <label className="frappe-label">Reason / Notes</label>
                      <input 
                        type="text" 
                        placeholder="Brief description" 
                        value={leaveReason} 
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="frappe-input"
                      />
                    </div>

                    <button type="submit" className="frappe-btn frappe-btn-primary w-full text-xs font-semibold">
                      Submit Request
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="frappe-card">
              <div className="frappe-card-header">
                <span>Assign Shift Rotation</span>
              </div>
              <div className="frappe-card-body">
                <form onSubmit={handleCreateShift} className="flex flex-col gap-4">
                  <div className="frappe-form-group">
                    <label className="frappe-label">Assignee Employee</label>
                    <select 
                      value={shiftEmp} 
                      onChange={(e) => setShiftEmp(e.target.value)}
                      className="frappe-input"
                      required
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Start Date/Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={shiftStart} 
                      onChange={(e) => setShiftStart(e.target.value)}
                      className="frappe-input"
                    />
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">End Date/Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={shiftEnd} 
                      onChange={(e) => setShiftEnd(e.target.value)}
                      className="frappe-input"
                    />
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Shift Note</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Night shift schedule" 
                      value={shiftNote} 
                      onChange={(e) => setShiftNote(e.target.value)}
                      className="frappe-input"
                    />
                  </div>

                  <button type="submit" className="frappe-btn frappe-btn-primary w-full text-xs font-semibold">
                    Allocate Shift
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'appraisals' && (
            <div className="frappe-card">
              <div className="frappe-card-header">
                <span>Record Performance Score</span>
              </div>
              <div className="frappe-card-body">
                <form onSubmit={handleCreateAppraisal} className="flex flex-col gap-4">
                  <div className="frappe-form-group">
                    <label className="frappe-label">Employee</label>
                    <select 
                      value={appraisalEmp} 
                      onChange={(e) => setAppraisalEmp(e.target.value)}
                      className="frappe-input"
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Appraisal Period</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. FY 2026 Q1" 
                      value={appraisalPeriod} 
                      onChange={(e) => setAppraisalPeriod(e.target.value)}
                      className="frappe-input"
                    />
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Rating Score (1.0 - 5.0)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      required
                      value={appraisalScore} 
                      onChange={(e) => setAppraisalScore(parseFloat(e.target.value) || 0)}
                      className="frappe-input"
                    />
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Reviewer Feedback</label>
                    <textarea 
                      placeholder="Enter performance feedback comments..." 
                      value={appraisalFeedback} 
                      onChange={(e) => setAppraisalFeedback(e.target.value)}
                      className="frappe-input min-h-[80px]"
                    />
                  </div>

                  <button type="submit" className="frappe-btn frappe-btn-primary w-full text-xs font-semibold">
                    Submit Appraisal
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'trainings' && (
            <div className="frappe-card">
              <div className="frappe-card-header">
                <span>Schedule Training Program</span>
              </div>
              <div className="frappe-card-body">
                <form onSubmit={handleCreateTraining} className="flex flex-col gap-4">
                  <div className="frappe-form-group">
                    <label className="frappe-label">Program Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. ISO 27001 Seminar" 
                      value={trainingName} 
                      onChange={(e) => setTrainingName(e.target.value)}
                      className="frappe-input"
                    />
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Program Description</label>
                    <input 
                      type="text" 
                      placeholder="Enter program description details" 
                      value={trainingDesc} 
                      onChange={(e) => setTrainingDesc(e.target.value)}
                      className="frappe-input"
                    />
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Instructor Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. Robert" 
                      value={trainingInst} 
                      onChange={(e) => setTrainingInst(e.target.value)}
                      className="frappe-input"
                    />
                  </div>

                  <div className="frappe-grid-2">
                    <div className="frappe-form-group">
                      <label className="frappe-label">Start Date</label>
                      <input 
                        type="date" 
                        required
                        value={trainingStart} 
                        onChange={(e) => setTrainingStart(e.target.value)}
                        className="frappe-input"
                      />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">End Date</label>
                      <input 
                        type="date" 
                        required
                        value={trainingEnd} 
                        onChange={(e) => setTrainingEnd(e.target.value)}
                        className="frappe-input"
                      />
                    </div>
                  </div>

                  <button type="submit" className="frappe-btn frappe-btn-primary w-full text-xs font-semibold">
                    Schedule Program
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function AdvancedHRPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center p-12 text-muted-foreground gap-2">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span>Loading Advanced HR Modules...</span>
      </div>
    }>
      <AdvancedHRContent />
    </Suspense>
  );
}
