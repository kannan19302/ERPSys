'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Clock, LogIn, Cpu } from 'lucide-react';

interface Record { id: string; date: string; checkIn: string | null; checkOut: string | null; status: string; overtime: number; }
interface Employee { id: string; firstName: string; lastName: string; employeeCode: string; }

export default function AttendancePage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [msg, setMsg] = useState('');

  // Biometric/RFID simulator states
  const [simCode, setSimCode] = useState('');
  const [simAction, setSimAction] = useState('CHECK_IN');
  const [simulating, setSimulating] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/v1/advanced-hr/attendance${selectedEmployee ? `?employeeId=${selectedEmployee}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (empRes.ok) { const data = await empRes.json(); setEmployees(data); }
      if (attRes.ok) { const data = await attRes.json(); setRecords(Array.isArray(data) ? data : (data?.data || [])); }
    } catch { setError('API connection issue'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedEmployee]);

  const handleCheckIn = async () => {
    if (!selectedEmployee) { setMsg('Select an employee first'); return; }
    try {
      const res = await fetch('/api/v1/advanced-hr/attendance/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ employeeId: selectedEmployee }) });
      if (res.ok) { setMsg('Checked in successfully'); fetchData(); } else { setMsg('Already checked in or error'); }
    } catch { setMsg('Check-in failed'); }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee) { setMsg('Select an employee first'); return; }
    try {
      const res = await fetch('/api/v1/advanced-hr/attendance/check-out', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ employeeId: selectedEmployee }) });
      if (res.ok) { setMsg('Checked out successfully'); fetchData(); } else { setMsg('Not checked in or error'); }
    } catch { setMsg('Check-out failed'); }
  };

  const handleSimulateRFID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCode) { setMsg('Enter an employee code'); return; }
    setSimulating(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/attendance/biometric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ employeeCode: simCode, actionType: simAction })
      });
      if (res.ok) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader title="Attendance" description="Track employee check-ins, check-outs, and overtime records" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Attendance' }]} />
      {error && <div style={{ padding: '8px 16px', background: 'var(--color-danger-light)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{error}</div>}
      {msg && <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{msg}</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Check in panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card padding="md" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="frappe-input" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} style={{ maxWidth: 300 }}>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
            </select>
            <Button variant="primary" onClick={handleCheckIn} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><LogIn size={14} /> Check In</Button>
            <Button variant="outline" onClick={handleCheckOut}>Check Out</Button>
          </Card>
          
          <Card padding="none" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}><th style={{ padding: 'var(--space-4)' }}>Date</th><th style={{ padding: 'var(--space-4)' }}>Check In</th><th style={{ padding: 'var(--space-4)' }}>Check Out</th><th style={{ padding: 'var(--space-4)' }}>Status</th><th style={{ padding: 'var(--space-4)' }}>Overtime</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)' }}>{new Date(r.date).toLocaleDateString()}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '--'}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '--'}</td>
                    <td style={{ padding: 'var(--space-4)' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: 'var(--space-4)', color: r.overtime > 0 ? 'var(--color-danger-text)' : 'inherit', fontWeight: r.overtime > 0 ? 'bold' : 'normal' }}>{Number(r.overtime).toFixed(2)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}><Clock size={48} style={{ marginBottom: 16, opacity: 0.4 }} /><p>Select an employee to view records</p></div>}
            {loading && <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}><Spinner size="md" /></div>}
          </Card>
        </div>

        {/* Biometric RFID Simulator */}
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)', display: 'flex', alignItems: 'center', gap: 6 }}><Cpu size={16} /> Biometric/RFID Simulator</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Simulate a physical RFID terminal scanner tap. This calls the backend integration webhook `/attendance/biometric`.
          </p>
          <form onSubmit={handleSimulateRFID} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="frappe-form-group">
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Employee Code</label>
              <input
                className="frappe-input"
                placeholder="e.g. EMP-001"
                value={simCode}
                onChange={e => setSimCode(e.target.value)}
                required
              />
            </div>
            <div className="frappe-form-group">
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Scanner Action</label>
              <select className="frappe-input" value={simAction} onChange={e => setSimAction(e.target.value)}>
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
  );
}