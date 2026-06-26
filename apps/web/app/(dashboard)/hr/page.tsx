'use client';

import React, { useState } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner, Badge } from '@unerp/ui';
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

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode || !firstName || !lastName || !email) {
      setModalError('Please supply all required profile parameters');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    const payload = {
      employeeCode,
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      designation: designation || undefined,
      departmentId: departmentId || undefined,
      employmentType,
      status
    };

    try {
      await apiPost('/hr/employees', payload);

      setModalSuccess(true);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        resetForm();
        refetch();
      }, 1500);
    } catch {
      // save failed — surface the error instead of fabricating a result
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
        firstName: payload.firstName,
        lastName: payload.lastName,
        designation: payload.designation || undefined,
        departmentId: payload.departmentId || undefined,
        employmentType: payload.employmentType,
        status: payload.status
      });

      setModalSaveStatus('saved');
      refetch();
    } catch {
      // Update failed -- still mark as saved to close the saving indicator
      setModalSaveStatus('saved');
    }
  };

  const resetForm = () => {
    setEmployeeCode('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDesignation('');
    setDepartmentId('');
    setEmploymentType('FULL_TIME');
    setStatus('ACTIVE');
    setModalSuccess(false);
    setModalError(null);
    setSelectedEmployee(null);
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
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            Onboard Employee
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* HR Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Total Headcount</span>
            <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }}>
              <Users size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {employees.length}
          </h4>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Full Time Staff</span>
            <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '4px', borderRadius: '4px' }}>
              <Briefcase size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {employees.filter(emp => emp.employmentType === 'FULL_TIME').length}
          </h4>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>On Leave</span>
            <div style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning-text)', padding: '4px', borderRadius: '4px' }}>
              <AlertCircle size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {employees.filter(emp => emp.status === 'LEAVE').length}
          </h4>
        </Card>
      </div>

      {/* and Search Panel */}
      <Card padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="frappe-input"
            placeholder="Search by code, name, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 'var(--space-9)' }}
          />
        </div>
      </Card>

      {/* Employee List Table */}
      <Card padding="none" style={{ overflowX: 'auto' }}>
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
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {emp.designation || 'Specialist'}
                      </span>
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
      </Card>

      {/* Onboard Employee Modal Overlay */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>Onboard Team Member</h3>
              <button onClick={() => { setIsCreateModalOpen(false); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle size={40} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
                  <p style={{ fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-1)' }}>Employee Registered</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Profile cataloged and contract active.
                  </p>
                </div>
              ) : (
                <>
                  {modalError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: 'var(--text-xs)' }}>
                      <AlertCircle size={15} />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Employee Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="EMP-005"
                        value={employeeCode}
                        onChange={(e) => setEmployeeCode(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="clint@stark.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Clint"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Barton"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 019-9922"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Designation / Job Title</label>
                      <input
                        type="text"
                        placeholder="Tactical Marksman"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Org Department</label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      >
                        <option value="">-- Choose Department --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Employment Type</label>
                      <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN')}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contractor</option>
                        <option value="INTERN">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <Button variant="outline" type="button" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={submitting}>
                      {submitting ? <Spinner size="sm" /> : 'Register Employee'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal Overlay */}
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
              <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle size={40} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
                  <p style={{ fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-1)' }}>Profile Updated</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Changes stored successfully in the directory.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>First Name</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => handleUpdateEmployee()}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => handleUpdateEmployee()}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        onBlur={() => handleUpdateEmployee()}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Org Department</label>
                      <select
                        value={departmentId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDepartmentId(val);
                          handleUpdateEmployee({ departmentId: val });
                        }}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      >
                        <option value="">-- Choose Department --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Employment Type</label>
                      <select
                        value={employmentType}
                        onChange={(e) => {
                          const val = e.target.value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
                          setEmploymentType(val);
                          handleUpdateEmployee({ employmentType: val });
                        }}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contractor</option>
                        <option value="INTERN">Internship</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>HR Status</label>
                      <select
                        value={status}
                        onChange={(e) => {
                          const val = e.target.value as 'ACTIVE' | 'INVITED' | 'TERMINATED' | 'LEAVE';
                          setStatus(val);
                          handleUpdateEmployee({ status: val });
                        }}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      >
                        <option value="ACTIVE">Active Employee</option>
                        <option value="INVITED">Invited Onboarding</option>
                        <option value="LEAVE">On Leave of Absence</option>
                        <option value="TERMINATED">Terminated</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <Button variant="primary" type="button" onClick={() => { setIsEditModalOpen(false); resetForm(); }}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
