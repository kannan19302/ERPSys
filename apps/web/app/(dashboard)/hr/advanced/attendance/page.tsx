'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Clock, LogIn, Cpu } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface AttendanceRecord { id: string; date: string; checkIn: string | null; checkOut: string | null; status: string; overtime: number; }
interface Employee { id: string; firstName: string; lastName: string; employeeCode: string; }

export default function AttendancePage() {
  const client = useApiClient();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [msg, setMsg] = useState('');

  // Biometric/RFID simulator states
  const [simCode, setSimCode] = useState('');
  const [simAction, setSimAction] = useState('CHECK_IN');
  const [simulating, setSimulating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, attRes] = await Promise.all([
        client.get<Employee[]>('/api/v1/hr/employees'),
        client.get<AttendanceRecord[]>(`/api/v1/advanced-hr/attendance${selectedEmployee ? `?employeeId=${selectedEmployee}` : ''}`),
      ]);
      setEmployees(empRes); setRecords(attRes);
    } catch { setError('API connection issue'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedEmployee]);

  const handleCheckIn = async () => {
    if (!selectedEmployee) { setMsg('Select an employee first'); return; }
    try {
      await client.post('/api/v1/advanced-hr/attendance/check-in', { employeeId: selectedEmployee }); setMsg('Checked in successfully'); fetchData();
    } catch { setMsg('Check-in failed'); }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee) { setMsg('Select an employee first'); return; }
    try {
      await client.post('/api/v1/advanced-hr/attendance/check-out', { employeeId: selectedEmployee }); setMsg('Checked out successfully'); fetchData();
    } catch { setMsg('Check-out failed'); }
  };

  const handleSimulateRFID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCode) { setMsg('Enter an employee code'); return; }
    setSimulating(true);
    try {
      const res = await client.post('/api/v1/advanced-hr/attendance/biometric', { employeeCode: simCode, actionType: simAction });
      if (res) {
        setMsg(`RFID Scan simulated successfully: Card logged as ${simAction}`);
        fetchData();
      } else {
        setMsg('Invalid Employee RFID card or checkin error.');
      }
    } catch {
      setMsg('RFID connection error.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <RouteGuard permission="hr.attendance.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader title="Attendance" description="Track employee check-ins, check-outs, and overtime records" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Attendance' }]} />
      {error && <div className={styles.errorMessage}>{error}</div>}
      {msg && <div className={styles.message}>{msg}</div>}
      
      <div className={styles.layout}>
        {/* Check in panel */}
        <div className="ui-stack-6">
          <Card padding="md" className={styles.actions}>
            <select className={`ui-input ${styles.employeeSelect}`} value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
            </select>
            <Button variant="primary" onClick={handleCheckIn} className="ui-flex ui-items-center ui-gap-1"><LogIn size={14} /> Check In</Button>
            <Button variant="outline" onClick={handleCheckOut}>Check Out</Button>
          </Card>
          
          <ListPageTemplate
            title=""
            columns={[
              { key: 'date', header: 'Date', render: (v) => new Date(String(v)).toLocaleDateString() },
              { key: 'checkIn', header: 'Check In', render: (v) => v ? new Date(String(v)).toLocaleTimeString() : '--' },
              { key: 'checkOut', header: 'Check Out', render: (v) => v ? new Date(String(v)).toLocaleTimeString() : '--' },
              { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
              { key: 'overtime', header: 'Overtime', render: (v) => <span className={Number(v) > 0 ? styles.overtime : undefined}>{Number(v).toFixed(2)}h</span> },
            ] as ListColumn[]}
            data={records as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyTitle="No records found"
            emptyDescription="Select an employee to view records"
          />
        </div>

        {/* Biometric RFID Simulator */}
        <Card padding="md">
          <h4 className={styles.simulatorTitle}><Cpu size={16} /> Biometric/RFID Simulator</h4>
          <p className={styles.simulatorDescription}>
            Simulate a physical RFID terminal scanner tap. This calls the backend integration webhook `/attendance/biometric`.
          </p>
          <form onSubmit={handleSimulateRFID} className="ui-stack-3">
            <div className="ui-form-group">
              <label className={styles.label}>Employee Code</label>
              <input
                className="ui-input"
                placeholder="e.g. EMP-001"
                value={simCode}
                onChange={e => setSimCode(e.target.value)}
                required
              />
            </div>
            <div className="ui-form-group">
              <label className={styles.label}>Scanner Action</label>
              <select className="ui-input" value={simAction} onChange={e => setSimAction(e.target.value)}>
                <option value="CHECK_IN">Card Tap Check-In</option>
                <option value="CHECK_OUT">Card Tap Check-Out</option>
              </select>
            </div>
            <Button variant="primary" type="submit" disabled={simulating}>
              {simulating ? 'Processing RFID...' : 'Simulate RFID Card Tap'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
    </RouteGuard>
  );
}
