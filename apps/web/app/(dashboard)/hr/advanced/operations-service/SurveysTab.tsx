'use client';

import React, { useState, useEffect } from 'react';
import { Card, StatusBadge, Button, Spinner, Modal, FormField, Input, Select, Textarea, useToast } from '@unerp/ui';
import { CheckSquare, Plus } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './SurveysTab.module.css';

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

export default function SurveysTab() {
  const client = useApiClient();
  const [surveys, setSurveys] = useState<EngagementSurvey[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', questionText: 'How would you rate our company culture?\nHow satisfied are you with career progression opportunities?\nRate your direct manager communication efficiency.' });

  const [activeQuestionId, setActiveQuestionId] = useState('');
  const [submitEmpId, setSubmitEmpId] = useState('');
  const [submitRating, setSubmitRating] = useState('5');
  const [submitComment, setSubmitComment] = useState('');

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [surveysData, employeesData] = await Promise.all([
        client.get<EngagementSurvey[] | { data?: EngagementSurvey[] }>('/advanced-hr/surveys'),
        client.get<Employee[] | { data?: Employee[] }>('/hr/employees'),
      ]);
      setSurveys(Array.isArray(surveysData) ? surveysData : (surveysData.data || []));
      setEmployees(Array.isArray(employeesData) ? employeesData : (employeesData.data || []));
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
      await client.post('/advanced-hr/surveys', {
          title: form.title,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          questions: parsedQuestions
      });
      toast.success('Engagement survey launched successfully.');
      setShowForm(false);
      setForm({ title: '', description: '', startDate: '', endDate: '', questionText: 'How would you rate our company culture?\nHow satisfied are you with career progression opportunities?\nRate your direct manager communication efficiency.' });
      fetchData();
    } catch {
      toast.error('Error creating survey.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestionId || !submitEmpId) return;
    setSubmitting(true);
    try {
      await client.post('/advanced-hr/surveys/responses', {
          questionId: activeQuestionId,
          employeeId: submitEmpId,
          rating: parseInt(submitRating),
          comment: submitComment
      });
      toast.success('Response submitted.');
      setActiveQuestionId('');
      setSubmitEmpId('');
      setSubmitComment('');
      fetchData();
    } catch {
      toast.error('Error submitting response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Launch Survey
        </Button>
      </div>

      {activeQuestionId && (
        <Card padding="md">
          <h4 className={styles.s0}>Log Survey Answer Response</h4>
          <form onSubmit={submitResponse} className="ui-stack-3">
            <select
              className="ui-input"
              value={submitEmpId}
              onChange={e => setSubmitEmpId(e.target.value)}
              required
            >
              <option value="">Select Employee (Mock Submitter)</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>

            <div className={styles.s1}>
              <div>
                <label className="ui-text-caption">Rating Score</label>
                <select
                  className="ui-input"
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
              className="ui-input"
              placeholder="Feedback explanation comments (optional)..."
              value={submitComment}
              onChange={e => setSubmitComment(e.target.value)}
              rows={2}
            />

            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setActiveQuestionId('')}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Submit Answer</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="ui-stack-6">
          {surveys.length === 0 ? (
            <Card>
              <div className={styles.s2}>
                <CheckSquare size={32} className={styles.s3} />
                <p className="m-0">No engagement surveys launched yet.</p>
              </div>
            </Card>
          ) : (
            surveys.map(s => (
              <Card key={s.id} padding="md">
                <div className={styles.s4}>
                  <div>
                    <h4 className="m-0">{s.title}</h4>
                    <span className={styles.s5}>
                      Timeline: {new Date(s.startDate).toLocaleDateString()} to {new Date(s.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <p className={styles.s6}>
                  {s.description || 'No detailed instructions description provided.'}
                </p>

                <div className={styles.s7}>
                  {s.questions.map(q => {
                    const avgRating = q.responses.length > 0
                      ? Math.round((q.responses.reduce((sum, r) => sum + r.rating, 0) / q.responses.length) * 10) / 10
                      : 0;

                    return (
                      <div key={q.id} className={styles.s8}>
                        <div className={styles.s9}>
                          <span className={styles.s10}>Q: {q.question}</span>
                          <span className="ui-text-caption">
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Launch Corporate Engagement Survey" size="lg"
        footer={<><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button variant="primary" onClick={createSurvey as any} disabled={submitting}>Launch Survey</Button></>}
      >
        <form onSubmit={createSurvey} className="ui-stack-3">
          <FormField label="Survey Title" required>
            <Input placeholder="e.g. Q2 Corporate Health & Pulse Survey" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </FormField>
          <FormField label="Description">
            <Textarea placeholder="Description overview summary..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </FormField>

          <div className="ui-grid-2 ui-gap-3">
            <FormField label="Start Date" required>
              <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
            </FormField>
            <FormField label="End Date" required>
              <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
            </FormField>
          </div>

          <FormField label="Survey Questions (one per line)" required>
            <Textarea value={form.questionText} onChange={e => setForm({ ...form, questionText: e.target.value })} rows={4} required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

