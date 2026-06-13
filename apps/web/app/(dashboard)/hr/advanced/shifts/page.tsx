'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { CalendarDays, Plus, Clock, Search, Sun, Moon } from 'lucide-react';

interface ShiftSchedule {
  id: string;
  employeeId: string;
  startTime: string;
  endTime: string;
  note: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', startTime: '', endTime: '', note: '' });
  const [filterType, setFilterType] = useState<'ALL' | 'TODAY' | 'UPCOMING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) > new Date();
  };

  const isNightShift = (note: string | null, startStr: string) => {
    if (note && note.toLowerCase().includes('night')) return true;
    const hour = new Date(startStr).getHours();
    return hour >= 18 || hour <= 6;
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/shifts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (shiftRes.ok) setShifts(await shiftRes.ok ? await shiftRes.json() : []);
      if (empRes.ok) setEmployees(await empRes.ok ? await empRes.json() : []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const createShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Shift scheduled successfully.');
        setShowForm(false);
        setForm({ employeeId: '', startTime: '', endTime: '', note: '' });
        fetchData();
      }
    } catch {
      setMsg('Error scheduling shift.');
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
        title="Shift Scheduling"
        description="Roster employees into working shift segments, map timing slots, and coordinate hourly coverage."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Shifts' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Schedule Shift
          </Button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <CalendarDays size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{shifts.length}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Scheduled Shifts</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <Sun size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                {shifts.filter(s => isToday(s.startTime) || isToday(s.endTime)).length}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Today's Shifts</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <Moon size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                {shifts.filter(s => isNightShift(s.note, s.startTime)).length}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Night Shifts</div>
            </div>
          </div>
        </Card>
      </div>

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Schedule Employee Shift</h4>
          <form onSubmit={createShift} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Shift Start Time</label>
                <input
                  type="datetime-local"
                  className="frappe-input"
                  value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Shift End Time</label>
                <input
                  type="datetime-local"
                  className="frappe-input"
                  value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <input
              type="text"
              className="frappe-input"
              placeholder="Note/Designation (e.g. Night Support Duty)"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Schedule</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filter / Search Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-sunken)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
              {(['ALL', 'TODAY', 'UPCOMING'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  style={{
                    background: filterType === tab ? 'var(--color-bg-card)' : 'transparent',
                    color: filterType === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: filterType === tab ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px 10px', minWidth: '240px' }}>
              <Search size={14} style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '100%', color: 'var(--color-text)' }}
              />
            </div>
          </div>

          <Card padding="none">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Employee</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Shift Timing</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {shifts.filter(s => {
                  if (filterType === 'TODAY' && !isToday(s.startTime) && !isToday(s.endTime)) return false;
                  if (filterType === 'UPCOMING' && !isUpcoming(s.startTime)) return false;
                  if (searchQuery.trim()) {
                    const empName = getEmpName(s.employeeId).toLowerCase();
                    if (!empName.includes(searchQuery.toLowerCase())) return false;
                  }
                  return true;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                      <CalendarDays size={24} style={{ marginBottom: 8 }} />
                      <p style={{ margin: 0 }}>No shifts scheduled for this period.</p>
                    </td>
                  </tr>
                ) : (
                  shifts
                    .filter(s => {
                      if (filterType === 'TODAY' && !isToday(s.startTime) && !isToday(s.endTime)) return false;
                      if (filterType === 'UPCOMING' && !isUpcoming(s.startTime)) return false;
                      if (searchQuery.trim()) {
                        const empName = getEmpName(s.employeeId).toLowerCase();
                        if (!empName.includes(searchQuery.toLowerCase())) return false;
                      }
                      return true;
                    })
                    .map(shift => (
                  <tr key={shift.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{getEmpName(shift.employeeId)}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} className="text-muted-foreground" />
                        <span>
                          {new Date(shift.startTime).toLocaleString()} - {new Date(shift.endTime).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {shift.note || '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
        </div>
      )}
    </div>
  );
}
