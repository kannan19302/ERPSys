'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { MessageSquare, Plus, Star } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface FeedbackResponse {
  id: string;
  question: string;
  rating: number;
  comment: string | null;
  category: string;
}

interface Feedback360 {
  id: string;
  employeeId: string;
  reviewerId: string;
  relationship: string;
  period: string;
  responses: FeedbackResponse[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function FeedbackPage() {
  const client = useApiClient();
  const [feedbacks, setFeedbacks] = useState<Feedback360[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [relationship, setRelationship] = useState('PEER');
  const [period, setPeriod] = useState('FY 2026');
  const [question, setQuestion] = useState('How well does this employee communicate?');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedRes, empRes] = await Promise.all([
        client.get<Feedback360[]>('/api/v1/advanced-hr/feedback'),
        client.get<Employee[]>('/api/v1/hr/employees'),
      ]);
      setFeedbacks(feedRes); setEmployees(empRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  const createFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const reviewerId = 'system';

    const payload = {
      employeeId,
      reviewerId,
      relationship,
      period,
      responses: [
        {
          question,
          rating: parseInt(rating),
          comment,
          category: 'COMMUNICATION'
        }
      ]
    };

    try {
      await client.post('/api/v1/advanced-hr/feedback', payload);
      {
        setMsg('Feedback response recorded successfully.');
        setShowForm(false);
        setEmployeeId('');
        setComment('');
        fetchData();
      }
    } catch {
      setMsg('Error saving feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  return (
    <RouteGuard permission="hr.feedback.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="360° Feedback"
        description="Aggregate anonymous multi-rater peer reviews, manager evaluations, and customer feedback reports."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Feedback' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Submit Feedback
          </Button>
        }
      />

      {msg && (
        <div className={styles.message}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 className={styles.formTitle}>Record Peer Feedback</h4>
          <form onSubmit={createFeedback} className="ui-stack-3">
            <div className={styles.threeColumns}>
              <div>
                <label className="ui-text-caption">Review Target</label>
                <select
                  className="ui-input"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ui-text-caption">Relationship</label>
                <select
                  className="ui-input"
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                >
                  <option value="PEER">Peer / Colleague</option>
                  <option value="MANAGER">Direct Manager</option>
                  <option value="SUBORDINATE">Direct Report</option>
                  <option value="EXTERNAL">External Partner</option>
                </select>
              </div>
              <div>
                <label className="ui-text-caption">Review Period</label>
                <input
                  type="text"
                  className="ui-input"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className={styles.questionGrid}>
              <div>
                <label className="ui-text-caption">Evaluation Question</label>
                <select
                  className="ui-input"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                >
                  <option value="How well does this employee communicate?">How well does this employee communicate?</option>
                  <option value="Does this employee execute project deliverables timely?">Does this employee execute project deliverables timely?</option>
                  <option value="How effectively does this employee collaborate on teams?">How effectively does this employee collaborate on teams?</option>
                </select>
              </div>
              <div>
                <label className="ui-text-caption">Rating Score</label>
                <select
                  className="ui-input"
                  value={rating}
                  onChange={e => setRating(e.target.value)}
                >
                  <option value="5">5 - Outstanding</option>
                  <option value="4">4 - High Performing</option>
                  <option value="3">3 - Solid</option>
                  <option value="2">2 - Developing</option>
                  <option value="1">1 - Needs Work</option>
                </select>
              </div>
            </div>

            <textarea
              className="ui-input"
              placeholder="Provide constructive review remarks..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              required
            />
            
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Submit Review</Button>
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
          {feedbacks.length === 0 ? (
            <Card>
              <div className={styles.emptyState}>
                <MessageSquare size={32} className={styles.emptyIcon} />
                <p className="m-0">No peer reviews logged in database records.</p>
              </div>
            </Card>
          ) : (
            feedbacks.map(f => (
              <Card key={f.id} padding="md">
                <div className={styles.feedbackHeader}>
                  <div>
                    <h4 className="m-0">Review for: {getEmpName(f.employeeId)}</h4>
                    <span className="ui-text-caption">
                      Source: {f.relationship} • Period: {f.period}
                    </span>
                  </div>
                  <span className="ui-text-caption ui-text-tertiary">ID: {f.id}</span>
                </div>
                
                <div className={styles.responses}>
                  {f.responses.map(r => (
                    <div key={r.id} className={styles.response}>
                      <div className={styles.responseHeader}>
                        <span>Q: {r.question}</span>
                        <span className={styles.rating}>
                          <Star size={12} fill="currentColor" /> {r.rating} / 5
                        </span>
                      </div>
                      <span className={styles.comment}>
                        "{r.comment || 'No explanation comments provided.'}"
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
