'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader, StatusBadge, Button, Spinner, Badge, DashboardKPICard, DashboardChart, ViewSwitcher, type ViewMode } from '@unerp/ui';
import { useEmployees, useDepartments } from '../../../src/lib/hooks/useModuleData';
import { apiPost, apiPatch } from '../../../src/lib/api';
import {
  Users,
  Search,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Edit2
} from 'lucide-react';

interface EmployeeData {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  designation: string | null;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'INVITED' | 'TERMINATED' | 'LEAVE';
  dateOfJoining: string;
  departmentName: string;
  departmentId?: string | null;
}

interface DepartmentData {
  id: string;
  name: string;
}

export default function HrPage() {
  const { data: employeesRaw = [], isLoading: loading, refetch: refetchEmployees } = useEmployees();
  const { data: departmentsRaw = [] } = useDepartments();
  const employees = employeesRaw as EmployeeData[];
  const departments = departmentsRaw as DepartmentData[];
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('chart');

  // Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);

  // Form States
  const [employeeCode, setEmployeeCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employmentType, setEmploymentType] = useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'>('FULL_TIME');
  const [status, setStatus] = useState<'ACTIVE' | 'INVITED' | 'TERMINATED' | 'LEAVE'>('ACTIVE');

  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSaveStatus, setModalSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const refetch = () => { refetchEmployees(); };

  // ── KPI computed values ──
  const fullTimeCount = employees.filter(emp => emp.employmentType === 'FULL_TIME').length;
  const onLeaveCount = employees.filter(emp => emp.status === 'LEAVE').length;
  const deptCount = departments.length;

  // ── Chart data from real API data ──
  const departmentChartData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    employees.forEach(emp => {
      const dept = emp.departmentName || 'Unassigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    return Object.entries(deptCounts).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const employmentTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    employees.forEach(emp => {
      const type = emp.employmentType.replace('_', ' ');
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, count]) => ({ name, count }));
  }, [employees]);

  const hiringTrendData = useMemo(() => {
    const months: Record<string, number> = {};
    employees.forEach(emp => {
      const month = emp.dateOfJoining ? emp.dateOfJoining.substring(0, 7) : 'Unknown';
      months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, hires]) => ({ name, hires }));
  }, [employees]);

  // ── Handlers ──
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode || !firstName || !lastName || !email) {
      setModalError('Please supply all required profile parameters');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      await apiPost('/hr/employees', {
        employeeCode, firstName, lastName, email,
        phone: phone || undefined,
        designation: designation || undefined,
        departmentId: departmentId || undefined,
        employmentType, status
      });
      setModalSuccess(true);
      setTimeout(() => { setIsCreateModalOpen(false); resetForm(); refetch(); }, 1500);
    } catch {
      setError('Action could not be completed. Please try again.');
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (emp: EmployeeData) => {
    setSelectedEmployee(emp);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setDesignation(emp.designation || '');
    setDepartmentId(emp.departmentId || '');
    setEmploymentType(emp.employmentType);
    setStatus(emp.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (updatedFields?: Partial<EmployeeData>) => {
    if (!selectedEmployee) return;

    setModalSaveStatus('saving');
    setModalError(null);

    const payload = {
      firstName: (updatedFields?.hasOwnProperty('firstName') ? updatedFields.firstName : firstName) as string,
      lastName: (updatedFields?.hasOwnProperty('lastName') ? updatedFields.lastName : lastName) as string,
      designation: (updatedFields?.hasOwnProperty('designation') ? updatedFields.designation : designation) as string | null,
      departmentId: (updatedFields?.hasOwnProperty('departmentId') ? updatedFields.departmentId : departmentId) as string | null,
      employmentType: (updatedFields?.hasOwnProperty('employmentType') ? updatedFields.employmentType : employmentType) as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN',
      status: (updatedFields?.hasOwnProperty('status') ? updatedFields.status : status) as 'ACTIVE' | 'INVITED' | 'TERMINATED' | 'LEAVE'
    };

    try {
      await apiPatch(`/hr/employees/${selectedEmployee.id}`, {
        firstName: payload.firstName, lastName: payload.lastName,
        designation: payload.designation || undefined,
        departmentId: payload.departmentId || undefined,
        employmentType: payload.employmentType, status: payload.status
      });
      setModalSaveStatus('saved');
      refetch();
    } catch {
      setModalSaveStatus('saved');
    }
  };

  const resetForm = () => {
    setEmployeeCode(''); setFirstName(''); setLastName(''); setEmail('');
    setPhone(''); setDesignation(''); setDepartmentId('');
    setEmploymentType('FULL_TIME'); setStatus('ACTIVE');
    setModalSuccess(false); setModalError(null); setSelectedEmployee(null);
  };

  const filteredEmployees = employees.filter(emp => {
    const query = searchQuery.toLowerCase();
    return (
      emp.employeeCode.toLowerCase().includes(query) ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      (emp.designation && emp.designation.toLowerCase().includes(query)) ||
      emp.departmentName.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Human Resources"
        description="Administer employee listings, register contract details, map org departments, and manage onboarding statuses."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR Management' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Onboard Employee
            </Button>
          </div>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* KPI Cards with drill-down */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <DashboardKPICard
          title="Total Headcount"
          value={String(employees.length)}
          icon={<Users size={18} />}
          color="#4f46e5"
          loading={loading}
          drillDown={{
            modalTitle: 'All Employees',
            columns: [
              { key: 'employeeCode', label: 'Code' },
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'departmentName', label: 'Department' },
              { key: 'status', label: 'Status' },
            ],
            rows: employees.map(e => ({ ...e, name: `${e.firstName} ${e.lastName}` })),
          }}
        />
        <DashboardKPICard
          title="Full Time Staff"
          value={String(fullTimeCount)}
          icon={<Briefcase size={18} />}
          color="#22c55e"
          loading={loading}
          drillDown={{
            modalTitle: 'Full-Time Employees',
            columns: [
              { key: 'employeeCode', label: 'Code' },
              { key: 'name', label: 'Name' },
              { key: 'departmentName', label: 'Department' },
            ],
            rows: employees.filter(e => e.employmentType === 'FULL_TIME').map(e => ({ ...e, name: `${e.firstName} ${e.lastName}` })),
          }}
        />
        <DashboardKPICard
          title="On Leave"
          value={String(onLeaveCount)}
          icon={<AlertCircle size={18} />}
          color="#f59e0b"
          loading={loading}
          drillDown={{
            modalTitle: 'Employees on Leave',
            columns: [
              { key: 'employeeCode', label: 'Code' },
              { key: 'name', label: 'Name' },
              { key: 'departmentName', label: 'Department' },
            ],
            rows: employees.filter(e => e.status === 'LEAVE').map(e => ({ ...e, name: `${e.firstName} ${e.lastName}` })),
          }}
        />
        <DashboardKPICard
          title="Departments"
          value={String(deptCount)}
          icon={<Briefcase size={18} />}
          color="#8b5cf6"
          loading={loading}
          drillDown={{
            modalTitle: 'Departments',
            columns: [
              { key: 'name', label: 'Department Name' },
              { key: 'code', label: 'Code' },
            ],
            rows: departments.map(d => ({ ...d })),
          }}
        />
      </div>

      {/* Charts Section */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart
            title="Department Distribution"
            subtitle="Employee count by department"
            data={departmentChartData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Employees' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut"
            allowedChartTypes={['donut', 'pie', 'bar']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Employment Type Breakdown"
            subtitle="Staff categorized by contract type"
            data={employmentTypeData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'count', name: 'Count' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'pie', 'donut']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Hiring Trend"
            subtitle="New hires by joining month"
            data={hiringTrendData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'hires', name: 'New Hires', color: '#8b5cf6' }] }}
            defaultChartType="line"
            allowedChartTypes={['line', 'area', 'bar']}
            height={280}
            loading={loading}
          />
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
        <>
          {/* Search Panel */}
          <div className="frappe-card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input type="text" className="frappe-input" placeholder="Search by code, name, designation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-9)' }} />
            </div>
          </div>

          {/* Employee List Table */}
          <div className="frappe-card" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <Spinner size="lg" />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <Users size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
                <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>No Employees Onboarded</h4>
                <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  Onboard a new employee to manage corporate departments.
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Code</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Employee</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Department</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Employment</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Joined Date</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)' }}>{emp.employeeCode}</td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'var(--weight-semibold)' }}>{emp.firstName} {emp.lastName}</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{emp.designation || 'Specialist'}</span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text)' }}>{emp.departmentName}</td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <Badge variant="info">{emp.employmentType.replace('_', ' ')}</Badge>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {emp.dateOfJoining}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <StatusBadge status={emp.status} />
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(emp)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Edit2 size={12} /> Modify
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Onboard Employee Modal */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>Onboard Team Member</h3>
              <button onClick={() => { setIsCreateModalOpen(false); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateEmployee} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle size={40} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
                  <p style={{ fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-1)' }}>Employee Registered</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Profile cataloged and contract active.</p>
                </div>
              ) : (
                <>
                  {modalError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: 'var(--text-xs)' }}>
                      <AlertCircle size={15} /><span>{modalError}</span>
                    </div>
                  )}
                  <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group"><label className="frappe-label">Employee Code *</label><input type="text" required className="frappe-input" placeholder="EMP-005" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} /></div>
                    <div className="frappe-form-group"><label className="frappe-label">Email Address *</label><input type="email" required className="frappe-input" placeholder="clint@stark.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  </div>
                  <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group"><label className="frappe-label">First Name *</label><input type="text" required className="frappe-input" placeholder="Clint" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                    <div className="frappe-form-group"><label className="frappe-label">Last Name *</label><input type="text" required className="frappe-input" placeholder="Barton" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                  </div>
                  <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group"><label className="frappe-label">Phone Number</label><input type="text" className="frappe-input" placeholder="+1 (555) 019-9922" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                    <div className="frappe-form-group"><label className="frappe-label">Designation</label><input type="text" className="frappe-input" placeholder="Tactical Marksman" value={designation} onChange={(e) => setDesignation(e.target.value)} /></div>
                  </div>
                  <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group"><label className="frappe-label">Department</label>
                      <select className="frappe-input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                        <option value="">-- Choose --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="frappe-form-group"><label className="frappe-label">Employment Type</label>
                      <select className="frappe-input" value={employmentType} onChange={(e) => setEmploymentType(e.target.value as typeof employmentType)}>
                        <option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="CONTRACT">Contractor</option><option value="INTERN">Internship</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                    <Button variant="outline" type="button" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : 'Register Employee'}</Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && selectedEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>Modify Profile Settings</h3>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal' }}>
                  {modalSaveStatus === 'saving' && <span style={{ color: 'var(--color-warning-text)' }}>Saving...</span>}
                  {modalSaveStatus === 'saved' && <span style={{ color: 'var(--color-success)' }}>Saved</span>}
                  {modalSaveStatus === 'error' && <span style={{ color: 'var(--color-danger)' }}>Error</span>}
                </span>
              </div>
              <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => e.preventDefault()} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="frappe-form-group"><label className="frappe-label">First Name</label><input type="text" required className="frappe-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={() => handleUpdateEmployee()} /></div>
                <div className="frappe-form-group"><label className="frappe-label">Last Name</label><input type="text" required className="frappe-input" value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={() => handleUpdateEmployee()} /></div>
              </div>
              <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="frappe-form-group"><label className="frappe-label">Designation</label><input type="text" className="frappe-input" value={designation} onChange={(e) => setDesignation(e.target.value)} onBlur={() => handleUpdateEmployee()} /></div>
                <div className="frappe-form-group"><label className="frappe-label">Department</label>
                  <select className="frappe-input" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); handleUpdateEmployee({ departmentId: e.target.value }); }}>
                    <option value="">-- Choose --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="frappe-form-group"><label className="frappe-label">Employment Type</label>
                  <select className="frappe-input" value={employmentType} onChange={(e) => { const val = e.target.value as typeof employmentType; setEmploymentType(val); handleUpdateEmployee({ employmentType: val }); }}>
                    <option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="CONTRACT">Contractor</option><option value="INTERN">Internship</option>
                  </select>
                </div>
                <div className="frappe-form-group"><label className="frappe-label">HR Status</label>
                  <select className="frappe-input" value={status} onChange={(e) => { const val = e.target.value as typeof status; setStatus(val); handleUpdateEmployee({ status: val }); }}>
                    <option value="ACTIVE">Active Employee</option><option value="INVITED">Invited Onboarding</option><option value="LEAVE">On Leave of Absence</option><option value="TERMINATED">Terminated</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <Button variant="primary" type="button" onClick={() => { setIsEditModalOpen(false); resetForm(); }}>Close</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
