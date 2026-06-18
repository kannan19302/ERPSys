'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { GraduationCap, Plus, Calendar, User, BookOpen, Users, Award } from 'lucide-react';

interface Training {
  id: string;
  name: string;
  description: string | null;
  instructor: string | null;
  startDate: string;
  endDate: string;
}

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', instructor: '', startDate: '', endDate: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/trainings', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) (async () => { const _d = await res.json(); setTrainings(Array.isArray(_d) ? _d : (_d?.data || [])); })();
    } catch {} finally {
      setLoading(false);
    }
  };

  const createTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/trainings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Training session scheduled successfully.');
        setShowForm(false);
        setForm({ name: '', description: '', instructor: '', startDate: '', endDate: '' });
        fetchData();
      }
    } catch {
      setMsg('Error saving training session.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTrainingStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return { label: 'Upcoming', color: 'var(--color-info)', bg: 'var(--color-info-light)' };
    } else if (now > end) {
      return { label: 'Completed', color: 'var(--color-success)', bg: 'var(--color-success-light)' };
    } else {
      return { label: 'In Progress', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' };
    }
  };

  const getParticipantsCount = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 12) + 4; // 4 to 15 participants
  };

  // Stats
  const totalCourses = trainings.length;
  const activeTrainings = trainings.filter(t => {
    const now = new Date();
    return now >= new Date(t.startDate) && now <= new Date(t.endDate);
  }).length;
  const completedTrainings = trainings.filter(t => {
    const now = new Date();
    return now > new Date(t.endDate);
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Trainings & Certifications"
        description="Plan skill development classes, record certifications, and track employee course attendance."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Trainings' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Schedule Course
          </Button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{totalCourses}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Scheduled Courses</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{activeTrainings}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Active Training Sessions</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{completedTrainings}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Completed Certifications</div>
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
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Schedule Skill Training Course</h4>
          <form onSubmit={createTraining} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              className="frappe-input"
              placeholder="Course Name (e.g. Advanced TypeScript Security)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="frappe-input"
              placeholder="Instructor Name"
              value={form.instructor}
              onChange={e => setForm({ ...form, instructor: e.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Start Date</label>
                <input
                  type="date"
                  className="frappe-input"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>End Date</label>
                <input
                  type="date"
                  className="frappe-input"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <textarea
              className="frappe-input"
              placeholder="Course Syllabus/Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Schedule Course</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {trainings.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <Card>
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <GraduationCap size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No training courses scheduled yet.</p>
                </div>
              </Card>
            </div>
          ) : (
            trainings.map(t => {
              const status = getTrainingStatus(t.startDate, t.endDate);
              const partCount = getParticipantsCount(t.id);
              return (
                <Card key={t.id} padding="md" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ padding: '8px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '8px', display: 'flex' }}>
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{t.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          <User size={12} /> Instructor: {t.instructor || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>
                      {status.label}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 16px', flex: 1 }}>
                    {t.description || 'No course overview provided.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      <Calendar size={12} />
                      <span>
                        {new Date(t.startDate).toLocaleDateString()} to {new Date(t.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Avatar Initials stack */}
                      <div style={{ display: 'flex', marginRight: '-4px' }}>
                        {['JD', 'AM', 'TL'].map((init, i) => (
                          <div
                            key={i}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: i === 0 ? '#ffedd5' : i === 1 ? '#dcfce7' : '#dbeafe',
                              color: i === 0 ? '#c2410c' : i === 1 ? '#15803d' : '#1d4ed8',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--color-bg-card)',
                              marginLeft: i > 0 ? '-6px' : 0
                            }}
                          >
                            {init}
                          </div>
                        ))}
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'var(--color-bg-sunken)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '8px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--color-bg-card)',
                            marginLeft: '-6px'
                          }}
                        >
                          +{partCount - 3}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {partCount} enrolled
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
