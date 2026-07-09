'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { Calendar, Plus, Clock, BookOpen } from 'lucide-react';

interface Timetable {
  id: string;
  room: string;
  weekday: string;
  startTime: string;
  endTime: string;
  course?: { name: string; code: string };
  courseId?: string;
  instructorId?: string;
}

interface Course { id: string; name: string; code: string; }

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 12 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

export default function TimetablePage() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ courseId: '', room: '', weekday: 'Monday', startTime: '09:00', endTime: '10:00', instructorId: '' });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const [tRes, cRes] = await Promise.all([
          fetch('/api/v1/ext/education/timetables', { headers }),
          fetch('/api/v1/ext/education/courses', { headers }),
        ]);
        if (tRes.ok) { const d = await tRes.json(); setTimetables(Array.isArray(d) ? d : d?.data || []); }
        if (cRes.ok) { const d = await cRes.json(); setCourses(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.courseId || !form.room) return;
    setCreating(true);
    try {
      await fetch('/api/v1/ext/education/timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify(form),
      });
      setCreateOpen(false);
      window.location.reload();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const getSlots = (day: string) => timetables.filter(t => t.weekday === day);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Timetable" description="Weekly class schedule and room allocation"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Timetable' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Slot</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Slots" value={timetables.length} icon={<Calendar size={18} />} color="var(--color-primary)" />
        <KPICard title="Rooms Used" value={new Set(timetables.map(t => t.room)).size} icon={<BookOpen size={18} />} color="var(--color-info)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-4)', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)`, gap: 1, minWidth: 800 }}>
            {/* Header */}
            <div style={{ padding: 'var(--space-2)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Time</div>
            {WEEKDAYS.map(day => (
              <div key={day} style={{ padding: 'var(--space-2)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', textAlign: 'center', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-sm)' }}>{day}</div>
            ))}

            {/* Time slots */}
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                <div style={{ padding: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', borderTop: '1px solid var(--color-border-light)' }}>{hour}</div>
                {WEEKDAYS.map(day => {
                  const slots = getSlots(day).filter(s => s.startTime === hour);
                  return (
                    <div key={`${day}-${hour}`} style={{ padding: 'var(--space-1)', minHeight: 40, borderTop: '1px solid var(--color-border-light)' }}>
                      {slots.map(slot => (
                        <div key={slot.id} style={{
                          padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)',
                          fontSize: '10px', lineHeight: 1.3, cursor: 'pointer',
                        }}>
                          <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>{slot.course?.name || slot.courseId}</div>
                          <div style={{ color: 'var(--color-text-secondary)' }}>{slot.room} · {slot.startTime}-{slot.endTime}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Timetable Slot" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add Slot'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Course">
            <Select value={form.courseId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Room" required value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="Room 101" />
            <FormField label="Weekday">
              <Select value={form.weekday} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, weekday: e.target.value })}>
                {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Start Time" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            <TextField label="End Time" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
