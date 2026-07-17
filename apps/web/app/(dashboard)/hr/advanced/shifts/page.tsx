'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { CalendarDays, Plus, Clock, Search, Sun, Moon } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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
  const client = useApiClient();
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

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftData, employeeData] = await Promise.all([
        client.get<ShiftSchedule[]>('/advanced-hr/shifts'),
        client.get<Employee[]>('/hr/employees'),
      ]);
      setShifts(shiftData);
      setEmployees(employeeData);
    } catch {} finally {
      setLoading(false);
    }
  };

  const createShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/advanced-hr/shifts', form);
      setMsg('Shift scheduled successfully.');
      setShowForm(false);
      setForm({ employeeId: '', startTime: '', endTime: '', note: '' });
      fetchData();
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
    <div className="ui-stack-6 ui-animate-in">
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
      <div className={styles.auto0}>
        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={styles.s0}>
              <CalendarDays size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">{shifts.length}</div>
              <div className="ui-text-xs-muted">Total Scheduled Shifts</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={styles.s1}>
              <Sun size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">
                {shifts.filter(s => isToday(s.startTime) || isToday(s.endTime)).length}
              </div>
              <div className="ui-text-xs-muted">Today's Shifts</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={styles.s2}>
              <Moon size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">
                {shifts.filter(s => isNightShift(s.note, s.startTime)).length}
              </div>
              <div className="ui-text-xs-muted">Night Shifts</div>
            </div>
          </div>
        </Card>
      </div>

      {msg && (
        <div className={styles.s3}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 className={styles.s4}>Schedule Employee Shift</h4>
          <form onSubmit={createShift} className="ui-stack-3">
            <select
              className="ui-input"
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Shift Start Time</label>
                <input
                  type="datetime-local"
                  className="ui-input"
                  value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">Shift End Time</label>
                <input
                  type="datetime-local"
                  className="ui-input"
                  value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <input
              type="text"
              className="ui-input"
              placeholder="Note/Designation (e.g. Night Support Duty)"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Schedule</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="ui-stack-4">
          {/* Filter / Search Bar */}
          <div className={styles.s5}>
            <div className={styles.s6}>
              {(['ALL', 'TODAY', 'UPCOMING'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  className={styles.dyn0} style={{ background: filterType === tab ? 'var(--color-bg-card)' : 'transparent', color: filterType === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)', boxShadow: filterType === tab ? 'var(--shadow-sm)' : 'none' }}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className={styles.s7}>
              <Search size={14} className="ui-text-tertiary" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.s8}
              />
            </div>
          </div>

          {(() => {
            const filteredShifts = shifts.filter(s => {
              if (filterType === 'TODAY' && !isToday(s.startTime) && !isToday(s.endTime)) return false;
              if (filterType === 'UPCOMING' && !isUpcoming(s.startTime)) return false;
              if (searchQuery.trim() && !getEmpName(s.employeeId).toLowerCase().includes(searchQuery.toLowerCase())) return false;
              return true;
            });
            const shiftColumns: ListColumn[] = [
              { key: 'employeeId', header: 'Employee', render: (v) => <span className="font-semibold">{getEmpName(String(v))}</span> },
              { key: 'startTime', header: 'Shift Timing', render: (v, row) => {
                const s = row as unknown as ShiftSchedule;
                return (
                  <div className={styles.s9}>
                    <Clock size={14} className="text-muted-foreground" />
                    <span>{new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleString()}</span>
                  </div>
                );
              }},
              { key: 'note', header: 'Note', render: (v) => <span className="ui-text-muted">{v ? String(v) : '--'}</span> },
            ];
            return (
              <ListPageTemplate
                title=""
                columns={shiftColumns}
                data={filteredShifts as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No shifts scheduled for this period."
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}



