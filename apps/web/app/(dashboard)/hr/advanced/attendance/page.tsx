'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button } from '@unerp/ui';
import { Clock, Loader2, LogIn } from 'lucide-react';

interface Record { id: string; date: string; checkIn: string | null; checkOut: string | null; status: string; overtime: number; }
interface Employee { id: string; firstName: string; lastName: string; employeeCode: string; }

export default function AttendancePage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token') || '';
    try {
      const [attRes, empRes] = await Promise.all([
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/v1/advanced-hr/attendance${selectedEmployee ? `?employeeId=${selectedEmployee}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (empRes.ok) { const data = await empRes.json(); setEmployees(data); }
      if (attRes.ok) { const data = await attRes.json(); setRecords(data); }
    } catch { setError('API connection issue'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedEmployee]);

  const handleCheckIn = async () => {
    if (!selectedEmployee) { setMsg('Select an employee first'); return; }
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/advanced-hr/attendance/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ employeeId: selectedEmployee }) });
      if (res.ok) { setMsg('Checked in successfully'); fetchData(); } else { setMsg('Already checked in or error'); }
    } catch { setMsg('Check-in failed'); }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee) { setMsg('Select an employee first'); return; }
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/advanced-hr/attendance/check-out', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ employeeId: selectedEmployee }) });
      if (res.ok) { setMsg('Checked out successfully'); fetchData(); } else { setMsg('Not checked in or error'); }
    } catch { setMsg('Check-out failed'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Attendance" description="Track employee check-ins, check-outs, and attendance records" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Attendance' }]} />
      {error && <div style={{ padding: '8px 16px', background: 'var(--color-danger-light)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{error}</div>}
      {msg && <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{msg}</div>}
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
          <tbody>{records.map(r => (<tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}><td style={{ padding: 'var(--space-4)' }}>{new Date(r.date).toLocaleDateString()}</td><td style={{ padding: 'var(--space-4)' }}>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '--'}</td><td style={{ padding: 'var(--space-4)' }}>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '--'}</td><td style={{ padding: 'var(--space-4)' }}><StatusBadge status={r.status} /></td><td style={{ padding: 'var(--space-4)' }}>{r.overtime}h</td></tr>))}</tbody>
        </table>
        {records.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}><Clock size={48} style={{ marginBottom: 16, opacity: 0.4 }} /><p>Select an employee to view records</p></div>}
        {loading && <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}><Loader2 className="animate-spin" size={24} /></div>}
      </Card>
    </div>
  );
}