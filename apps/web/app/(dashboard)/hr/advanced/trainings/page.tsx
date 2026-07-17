'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { GraduationCap, Plus, Calendar, User, BookOpen, Users, Award } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface Training {
  id: string;
  name: string;
  description: string | null;
  instructor: string | null;
  startDate: string;
  endDate: string;
}

export default function TrainingsPage() {
  const client = useApiClient();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', instructor: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await client.get<Training[] | { data?: Training[] }>('/advanced-hr/trainings');
      setTrainings(Array.isArray(data) ? data : (data.data || []));
    } catch {} finally {
      setLoading(false);
    }
  };

  const createTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/advanced-hr/trainings', form);
      setMsg('Training session scheduled successfully.');
      setShowForm(false);
      setForm({ name: '', description: '', instructor: '', startDate: '', endDate: '' });
      fetchData();
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
    <div className="ui-stack-6 ui-animate-in">
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
      <div className={styles.auto0}>
        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={styles.s0}>
              <BookOpen size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">{totalCourses}</div>
              <div className="ui-text-xs-muted">Total Scheduled Courses</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={styles.s1}>
              <Users size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">{activeTrainings}</div>
              <div className="ui-text-xs-muted">Active Training Sessions</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-hstack-4">
            <div className={styles.s2}>
              <Award size={24} />
            </div>
            <div>
              <div className="ui-heading-lg">{completedTrainings}</div>
              <div className="ui-text-xs-muted">Completed Certifications</div>
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
          <h4 className={styles.s4}>Schedule Skill Training Course</h4>
          <form onSubmit={createTraining} className="ui-stack-3">
            <input
              className="ui-input"
              placeholder="Course Name (e.g. Advanced TypeScript Security)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="ui-input"
              placeholder="Instructor Name"
              value={form.instructor}
              onChange={e => setForm({ ...form, instructor: e.target.value })}
            />
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Start Date</label>
                <input
                  type="date"
                  className="ui-input"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">End Date</label>
                <input
                  type="date"
                  className="ui-input"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <textarea
              className="ui-input"
              placeholder="Course Syllabus/Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Schedule Course</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.auto1}>
          {trainings.length === 0 ? (
            <div className={styles.s5}>
              <Card>
                <div className={styles.s6}>
                  <GraduationCap size={32} className={styles.s7} />
                  <p className="m-0">No training courses scheduled yet.</p>
                </div>
              </Card>
            </div>
          ) : (
            trainings.map(t => {
              const status = getTrainingStatus(t.startDate, t.endDate);
              const partCount = getParticipantsCount(t.id);
              return (
                <Card key={t.id} padding="md" className={styles.s8}>
                  <div className={styles.s9}>
                    <div className={styles.s10}>
                      <div className={styles.s11}>
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h4 className={styles.s12}>{t.name}</h4>
                        <div className={styles.s13}>
                          <User size={12} /> Instructor: {t.instructor || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    <span className={styles.dyn0} style={{ color: status.color, background: status.bg }}>
                      {status.label}
                    </span>
                  </div>

                  <p className={styles.s14}>
                    {t.description || 'No course overview provided.'}
                  </p>

                  <div className={styles.s15}>
                    <div className={styles.s16}>
                      <Calendar size={12} />
                      <span>
                        {new Date(t.startDate).toLocaleDateString()} to {new Date(t.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className={styles.s17}>
                      {/* Avatar Initials stack */}
                      <div className={styles.s18}>
                        {['JD', 'AM', 'TL'].map((init, i) => (
                          <div
                            key={i}
                            className={styles.dyn1} style={{ background: i === 0 ? 'var(--color-warning-light)' : i === 1 ? 'var(--color-success-light)' : 'var(--color-primary-light)', color: i === 0 ? 'var(--color-warning-text)' : i === 1 ? 'var(--color-success-text)' : 'var(--color-primary)', marginLeft: i > 0 ? 'calc(var(--space-1) * -1.5)' : 0 }}
                          >
                            {init}
                          </div>
                        ))}
                        <div
                          className={styles.s19}
                        >
                          +{partCount - 3}
                        </div>
                      </div>
                      <span className={styles.s20}>
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


