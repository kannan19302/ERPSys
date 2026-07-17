'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import {
  PageHeader, Card, Button, Badge, KPICard, DashboardChart,
} from '@unerp/ui';
import { ClipboardCheck, Users, Calendar, CheckCircle, X } from 'lucide-react';

const STUDENTS_MOCK = [
  { id: '1', name: 'Alice Johnson', roll: 'STU-001' },
  { id: '2', name: 'Bob Smith', roll: 'STU-002' },
  { id: '3', name: 'Carol Williams', roll: 'STU-003' },
  { id: '4', name: 'David Brown', roll: 'STU-004' },
  { id: '5', name: 'Eva Davis', roll: 'STU-005' },
  { id: '6', name: 'Frank Wilson', roll: 'STU-006' },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    Object.fromEntries(STUDENTS_MOCK.map(s => [s.id, true]))
  );

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = STUDENTS_MOCK.length - presentCount;
  const attendanceRate = Math.round((presentCount / STUDENTS_MOCK.length) * 100);

  const weeklyData = WEEKDAYS.map(day => ({
    name: day,
    present: Math.floor(Math.random() * 3) + STUDENTS_MOCK.length - 2,
    absent: Math.floor(Math.random() * 3),
  }));

  return (
    <div className="ui-stack-6">
      <PageHeader title="Attendance" description="Daily attendance marking and reports"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Attendance' }]}
        actions={<Button variant="primary">Save Attendance</Button>}
      />

      <div className="ui-grid-auto-sm">
        <KPICard title="Present Today" value={presentCount} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        <KPICard title="Absent Today" value={absentCount} icon={<X size={18} />} color="var(--color-danger)" />
        <KPICard title="Attendance Rate" value={`${attendanceRate}%`} icon={<ClipboardCheck size={18} />} color="var(--color-primary)" />
        <KPICard title="Total Students" value={STUDENTS_MOCK.length} icon={<Users size={18} />} color="var(--color-info)" />
      </div>

      <Card>
        <div className={styles.s1}>
          <Calendar size={18} className="ui-text-tertiary" />
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className={styles.s2} />
          <span className="ui-text-sm-muted">
            {new Date(selectedDate || '').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="ui-heading-base mb-4">Mark Attendance</h3>
          <div className="ui-stack-2">
            {STUDENTS_MOCK.map(student => (
              <div key={student.id} style={{ background: attendance[student.id] ? 'var(--color-success-light)' : 'var(--color-danger-light)', border: `1px solid ${attendance[student.id] ? 'var(--color-success)' : 'var(--color-danger)'}` }} className={styles.s3}>
                <div className="ui-hstack-3">
                  <div className={styles.s4}>
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className={styles.s5}>{student.name}</div>
                    <div className="ui-text-xs-tertiary">{student.roll}</div>
                  </div>
                </div>
                <div className="ui-flex ui-gap-2">
                  <button onClick={() => setAttendance(p => ({ ...p, [student.id]: true }))}
                    style={{ borderColor: attendance[student.id] ? 'var(--color-success)' : 'var(--color-border)', background: attendance[student.id] ? 'var(--color-success)' : 'var(--color-bg)', color: attendance[student.id] ? 'white' : 'var(--color-text)' }} className={styles.s6}>
                    Present
                  </button>
                  <button onClick={() => setAttendance(p => ({ ...p, [student.id]: false }))}
                    style={{ borderColor: !attendance[student.id] ? 'var(--color-danger)' : 'var(--color-border)', background: !attendance[student.id] ? 'var(--color-danger)' : 'var(--color-bg)', color: !attendance[student.id] ? 'white' : 'var(--color-text)' }} className={styles.s6}>
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <DashboardChart title="Weekly Attendance" subtitle="Attendance pattern this week"
        data={weeklyData}
        config={{ xAxisKey: 'name', series: [
          { dataKey: 'present', name: 'Present', color: '#22c55e' },
          { dataKey: 'absent', name: 'Absent', color: '#ef4444' },
        ] }}
        defaultChartType="bar" allowedChartTypes={['bar', 'area']} height={260} />
    </div>
  );
}
