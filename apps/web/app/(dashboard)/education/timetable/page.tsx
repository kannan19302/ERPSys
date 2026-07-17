'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { Calendar, Plus, Clock, BookOpen } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 12 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

export default function TimetablePage() {
  const client = useApiClient();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ courseId: '', room: '', weekday: 'Monday', startTime: '09:00', endTime: '10:00', instructorId: '' });

  useEffect(() => {
    (async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          client.get<Timetable[] | { data?: Timetable[] }>('/ext/education/timetables'),
          client.get<Course[] | { data?: Course[] }>('/ext/education/courses'),
        ]);
        setTimetables(Array.isArray(tRes) ? tRes : tRes.data || []);
        setCourses(Array.isArray(cRes) ? cRes : cRes.data || []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async () => {
    if (!form.courseId || !form.room) return;
    setCreating(true);
    try {
      await client.post('/ext/education/timetables', form);
      setCreateOpen(false);
      const d = await client.get<Timetable[] | { data?: Timetable[] }>('/ext/education/timetables');
      setTimetables(Array.isArray(d) ? d : d.data || []);
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const getSlots = (day: string) => timetables.filter(t => t.weekday === day);

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="education.timetable.read">
      <div className="ui-stack-6">
      <PageHeader title="Timetable" description="Weekly class schedule and room allocation"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Timetable' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Add Slot</Button>}
      />

      <div className={styles.s1}>
        <KPICard title="Total Slots" value={timetables.length} icon={<Calendar size={18} />} color="var(--color-primary)" />
        <KPICard title="Rooms Used" value={new Set(timetables.map(t => t.room)).size} icon={<BookOpen size={18} />} color="var(--color-info)" />
      </div>

      <Card>
        <div className={styles.s2}>
          <div style={{ gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)` }} className={styles.s3}>
            {/* Header */}
            <div className={styles.s4}>Time</div>
            {WEEKDAYS.map(day => (
              <div key={day} className={styles.s5}>{day}</div>
            ))}

            {/* Time slots */}
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                <div className={styles.s6}>{hour}</div>
                {WEEKDAYS.map(day => {
                  const slots = getSlots(day).filter(s => s.startTime === hour);
                  return (
                    <div key={`${day}-${hour}`} className={styles.s7}>
                      {slots.map(slot => (
                        <div key={slot.id} className={styles.s8}>
                          <div className={styles.s9}>{slot.course?.name || slot.courseId}</div>
                          <div className="ui-text-muted">{slot.room} · {slot.startTime}-{slot.endTime}</div>
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
        <div className="ui-stack-4">
          <FormField label="Course">
            <Select value={form.courseId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Select>
          </FormField>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Room" required value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="Room 101" />
            <FormField label="Weekday">
              <Select value={form.weekday} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, weekday: e.target.value })}>
                {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Start Time" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            <TextField label="End Time" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          </div>
        </div>
      </Modal>
      </div>
    </RouteGuard>
  );
}
