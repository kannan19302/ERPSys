'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { CheckSquare, Plus } from 'lucide-react';

interface SurveyQuestion {
  id: string;
  question: string;
  category: string;
  sortOrder: number;
  responses: Array<{
    id: string;
    rating: number;
    comment: string | null;
  }>;
}

interface EngagementSurvey {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  questions: SurveyQuestion[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<EngagementSurvey[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', questionText: 'How would you rate our company culture?\nHow satisfied are you with career progression opportunities?\nRate your direct manager communication efficiency.' });

  const [activeQuestionId, setActiveQuestionId] = useState('');
  const [submitEmpId, setSubmitEmpId] = useState('');
  const [submitRating, setSubmitRating] = useState('5');
  const [submitComment, setSubmitComment] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [surveyRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/surveys', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (surveyRes.ok) setSurveys(await surveyRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const createSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const parsedQuestions = form.questionText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .map((q, idx) => ({
        question: q,
        category: 'ENGAGEMENT',
        sortOrder: idx + 1
      }));

    try {
      const res = await fetch('/api/v1/advanced-hr/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          questions: parsedQuestions
        })
      });
      if (res.ok) {
        setMsg('Engagement survey launched successfully.');
        setShowForm(false);
        setForm({ title: '', description: '', startDate: '', endDate: '', questionText: 'How would you rate our company culture?\nHow satisfied are you with career progression opportunities?\nRate your direct manager communication efficiency.' });
        fetchData();
      }
    } catch {
      setMsg('Error creating survey.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestionId || !submitEmpId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/surveys/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: activeQuestionId,
          employeeId: submitEmpId,
          rating: parseInt(submitRating),
          comment: submitComment
        })
      });
      if (res.ok) {
        setMsg('Response submitted.');
        setActiveQuestionId('');
        setSubmitEmpId('');
        setSubmitComment('');
        fetchData();
      }
    } catch {
      setMsg('Error submitting response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Engagement Surveys"
        description="Initiate feedback questionnaires, collect anonymous employee answers, and compute general workplace sentiment indexes."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Surveys' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Launch Survey
          </Button>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Launch Corporate Engagement Survey</h4>
          <form onSubmit={createSurvey} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              className="frappe-input"
              placeholder="Survey Title (e.g. Q2 Corporate Health & Pulse Survey)"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="frappe-input"
              placeholder="Description overview summary..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
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

            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Survey Questions (one per line)</label>
              <textarea
                className="frappe-input"
                value={form.questionText}
                onChange={e => setForm({ ...form, questionText: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Launch Survey</Button>
            </div>
          </form>
        </Card>
      )}

      {activeQuestionId && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Log Survey Answer Response</h4>
          <form onSubmit={submitResponse} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
              value={submitEmpId}
              onChange={e => setSubmitEmpId(e.target.value)}
              required
            >
              <option value="">Select Employee (Mock Submitter)</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Rating Score</label>
                <select
                  className="frappe-input"
                  value={submitRating}
                  onChange={e => setSubmitRating(e.target.value)}
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good / Fair</option>
                  <option value="2">2 - Needs Improvement</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>
            </div>

            <textarea
              className="frappe-input"
              placeholder="Feedback explanation comments (optional)..."
              value={submitComment}
              onChange={e => setSubmitComment(e.target.value)}
              rows={2}
            />

            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setActiveQuestionId('')}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Submit Answer</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {surveys.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <CheckSquare size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                <p style={{ margin: 0 }}>No engagement surveys launched yet.</p>
              </div>
            </Card>
          ) : (
            surveys.map(s => (
              <Card key={s.id} padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{s.title}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Timeline: {new Date(s.startDate).toLocaleDateString()} to {new Date(s.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 'var(--space-2) 0 var(--space-4)' }}>
                  {s.description || 'No detailed instructions description provided.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                  {s.questions.map(q => {
                    const avgRating = q.responses.length > 0 
                      ? Math.round((q.responses.reduce((sum, r) => sum + r.rating, 0) / q.responses.length) * 10) / 10
                      : 0;

                    return (
                      <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, display: 'block' }}>Q: {q.question}</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            Category: {q.category} • Responses: {q.responses.length} {q.responses.length > 0 && `(Avg: ${avgRating}/5)`}
                          </span>
                        </div>
                        {s.status === 'ACTIVE' && (
                          <Button variant="outline" size="sm" onClick={() => setActiveQuestionId(q.id)}>
                            Log Response
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
