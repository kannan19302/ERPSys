'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { MessageSquare, Plus, Star } from 'lucide-react';

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feedRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/feedback', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (feedRes.ok) setFeedbacks(await feedRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (empRes.ok) setEmployees(await empRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {} finally {
      setLoading(false);
    }
  };

  const createFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const reviewerId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').id || 'system' : 'system';

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
      const res = await fetch('/api/v1/advanced-hr/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
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
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Record Peer Feedback</h4>
          <form onSubmit={createFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Review Target</label>
                <select
                  className="frappe-input"
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
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Relationship</label>
                <select
                  className="frappe-input"
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
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Review Period</label>
                <input
                  type="text"
                  className="frappe-input"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Evaluation Question</label>
                <select
                  className="frappe-input"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                >
                  <option value="How well does this employee communicate?">How well does this employee communicate?</option>
                  <option value="Does this employee execute project deliverables timely?">Does this employee execute project deliverables timely?</option>
                  <option value="How effectively does this employee collaborate on teams?">How effectively does this employee collaborate on teams?</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Rating Score</label>
                <select
                  className="frappe-input"
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
              className="frappe-input"
              placeholder="Provide constructive review remarks..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              required
            />
            
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Submit Review</Button>
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
          {feedbacks.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <MessageSquare size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                <p style={{ margin: 0 }}>No peer reviews logged in database records.</p>
              </div>
            </Card>
          ) : (
            feedbacks.map(f => (
              <Card key={f.id} padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Review for: {getEmpName(f.employeeId)}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      Source: {f.relationship} • Period: {f.period}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>ID: {f.id}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                  {f.responses.map(r => (
                    <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>Q: {r.question}</span>
                        <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Star size={12} fill="currentColor" /> {r.rating} / 5
                        </span>
                      </div>
                      <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
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
  );
}
