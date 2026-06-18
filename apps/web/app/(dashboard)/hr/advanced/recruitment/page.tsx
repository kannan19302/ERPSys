'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Plus, ArrowLeft, ArrowRight, LayoutGrid, List } from 'lucide-react';

interface OfferLetter {
  id: string;
  applicantId: string;
  salaryOffered: number | string;
  status: string;
  expiresAt: string | null;
  notes: string | null;
  applicant?: {
    firstName: string;
    lastName: string;
    jobPosting?: {
      title: string;
    }
  };
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; status: string; postedAt: string }>>([]);
  const [applicants, setApplicants] = useState<Array<{ id: string; firstName: string; lastName: string; currentStage: string; jobPosting: { title: string } }>>([]);
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'jobs' | 'applicants' | 'offers'>('jobs');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', departmentId: '', location: '', employmentType: 'FULL_TIME' });
  
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [applicantForm, setApplicantForm] = useState({ jobPostingId: '', firstName: '', lastName: '', email: '', phone: '' });

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({ applicantId: '', salaryOffered: '', expiresAt: '', notes: '' });
  
  const [msg, setMsg] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appRes, offersRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/jobs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/applicants', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/offers', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (appRes.ok) setApplicants(await appRes.json());
      if (offersRes.ok) setOffers(await offersRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/advanced-hr/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Job posted successfully.');
        setShowForm(false);
        setForm({ title: '', description: '', departmentId: '', location: '', employmentType: 'FULL_TIME' });
        fetchData();
      }
    } catch {}
  };

  const createApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/advanced-hr/applicants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(applicantForm)
      });
      if (res.ok) {
        setMsg('Applicant added successfully.');
        setShowApplicantForm(false);
        setApplicantForm({ jobPostingId: '', firstName: '', lastName: '', email: '', phone: '' });
        fetchData();
      }
    } catch {}
  };

  const advanceStage = async (id: string, stage: string) => {
    await fetch(`/api/v1/advanced-hr/applicants/${id}/advance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ stage })
    });
    fetchData();
  };

  const createOfferLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/advanced-hr/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          applicantId: offerForm.applicantId,
          salaryOffered: parseFloat(offerForm.salaryOffered),
          expiresAt: offerForm.expiresAt || null,
          notes: offerForm.notes || ''
        })
      });
      if (res.ok) {
        setMsg('Offer Letter issued successfully.');
        setShowOfferForm(false);
        setOfferForm({ applicantId: '', salaryOffered: '', expiresAt: '', notes: '' });
        fetchData();
      }
    } catch {}
  };

  const handleOfferStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/advanced-hr/offers/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setMsg(`Offer status updated to ${status}.`);
        fetchData();
      }
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Recruitment"
        description="Job postings, applicants, and interview pipeline"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Recruitment' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => { setTab('applicants'); setShowApplicantForm(true); }}>
              <Plus size={14} /> Add Applicant
            </Button>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Post Job
            </Button>
          </>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button variant={tab === 'jobs' ? 'primary' : 'outline'} onClick={() => setTab('jobs')}>
          Job Postings ({jobs.length})
        </Button>
        <Button variant={tab === 'applicants' ? 'primary' : 'outline'} onClick={() => setTab('applicants')}>
          Applicants ({applicants.length})
        </Button>
        <Button variant={tab === 'offers' ? 'primary' : 'outline'} onClick={() => setTab('offers')}>
          Offers ({offers.length})
        </Button>
      </div>

      {showForm && (
        <Card padding="md">
          <form onSubmit={createJob} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              className="frappe-input"
              placeholder="Job Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="frappe-input"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <input
                className="frappe-input"
                placeholder="Location"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
              <select
                className="frappe-input"
                value={form.employmentType}
                onChange={e => setForm({ ...form, employmentType: e.target.value })}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Post Job</Button>
            </div>
          </form>
        </Card>
      )}

      {showApplicantForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Add New Job Applicant</h4>
          <form onSubmit={createApplicant} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
              value={applicantForm.jobPostingId}
              onChange={e => setApplicantForm({ ...applicantForm, jobPostingId: e.target.value })}
              required
            >
              <option value="">Select Job Position</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <input
                className="frappe-input"
                placeholder="First Name"
                value={applicantForm.firstName}
                onChange={e => setApplicantForm({ ...applicantForm, firstName: e.target.value })}
                required
              />
              <input
                className="frappe-input"
                placeholder="Last Name"
                value={applicantForm.lastName}
                onChange={e => setApplicantForm({ ...applicantForm, lastName: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <input
                className="frappe-input"
                placeholder="Email"
                type="email"
                value={applicantForm.email}
                onChange={e => setApplicantForm({ ...applicantForm, email: e.target.value })}
                required
              />
              <input
                className="frappe-input"
                placeholder="Phone"
                value={applicantForm.phone}
                onChange={e => setApplicantForm({ ...applicantForm, phone: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowApplicantForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Submit Applicant</Button>
            </div>
          </form>
        </Card>
      )}

      {showOfferForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Issue Job Offer Letter</h4>
          <form onSubmit={createOfferLetter} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
              value={offerForm.applicantId}
              onChange={e => setOfferForm({ ...offerForm, applicantId: e.target.value })}
              required
            >
              <option value="">Select Candidate</option>
              {applicants.filter(a => a.currentStage === 'OFFER' || a.currentStage === 'HIRED').map(a => (
                <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.jobPosting?.title})</option>
              ))}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Offered Monthly Salary ($)</label>
                <input
                  type="number"
                  className="frappe-input"
                  placeholder="5000"
                  value={offerForm.salaryOffered}
                  onChange={e => setOfferForm({ ...offerForm, salaryOffered: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Offer Expiry Date</label>
                <input
                  type="date"
                  className="frappe-input"
                  value={offerForm.expiresAt}
                  onChange={e => setOfferForm({ ...offerForm, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <textarea
              className="frappe-input"
              placeholder="Notes, terms, or message to candidate"
              value={offerForm.notes}
              onChange={e => setOfferForm({ ...offerForm, notes: e.target.value })}
              rows={3}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowOfferForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Issue Offer</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {tab === 'jobs' && (
            <Card padding="none">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Posted</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No jobs posted yet.
                      </td>
                    </tr>
                  ) : (
                    jobs.map(j => (
                      <tr key={j.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{j.title}</td>
                        <td style={{ padding: 'var(--space-4)' }}>{new Date(j.postedAt).toLocaleDateString()}</td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                          <StatusBadge status={j.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {tab === 'applicants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* View Switcher */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button variant={viewMode === 'kanban' ? 'primary' : 'outline'} onClick={() => setViewMode('kanban')}>
                  <LayoutGrid size={14} style={{ marginRight: 4 }} /> Kanban Board
                </Button>
                <Button variant={viewMode === 'table' ? 'primary' : 'outline'} onClick={() => setViewMode('table')}>
                  <List size={14} style={{ marginRight: 4 }} /> List View
                </Button>
              </div>

              {viewMode === 'table' ? (
                <Card padding="none">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Job Position</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Pipeline Stage</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            No applicants found.
                          </td>
                        </tr>
                      ) : (
                        applicants.map(a => (
                          <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{a.firstName} {a.lastName}</td>
                            <td style={{ padding: 'var(--space-4)' }}>{a.jobPosting?.title || 'N/A'}</td>
                            <td style={{ padding: 'var(--space-4)' }}>
                              <StatusBadge status={a.currentStage} />
                            </td>
                            <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                              {a.currentStage === 'OFFER' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  style={{ marginRight: 8 }}
                                  onClick={() => {
                                    setOfferForm({ ...offerForm, applicantId: a.id });
                                    setShowOfferForm(true);
                                  }}
                                >
                                  Issue Offer
                                </Button>
                              )}
                              <select
                                className="frappe-input"
                                style={{ fontSize: 12, padding: '2px 8px', maxWidth: '120px', display: 'inline-block' }}
                                defaultValue=""
                                onChange={e => {
                                  if (e.target.value) advanceStage(a.id, e.target.value);
                                }}
                              >
                                <option value="">Advance</option>
                                <option value="SCREENING">Screening</option>
                                <option value="INTERVIEW">Interview</option>
                                <option value="OFFER">Offer</option>
                                <option value="HIRED">Hire</option>
                                <option value="REJECTED">Reject</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </Card>
              ) : (
                /* Kanban Board View */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-4)' }}>
                  {['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].map((stage, idx, stagesArray) => {
                    const stageApplicants = applicants.filter(a => a.currentStage === stage);
                    return (
                      <div key={stage} style={{ background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 220 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>{stage}</span>
                          <span style={{ fontSize: '10px', background: 'var(--color-border)', color: 'var(--color-text-secondary)', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{stageApplicants.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minHeight: 300 }}>
                          {stageApplicants.map(a => (
                            <Card key={a.id} padding="sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                              <div>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{a.firstName} {a.lastName}</div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: 2 }}>{a.jobPosting?.title || 'N/A'}</div>
                              </div>
                              {a.currentStage === 'OFFER' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setOfferForm({ ...offerForm, applicantId: a.id });
                                    setShowOfferForm(true);
                                  }}
                                  style={{ width: '100%', fontSize: 11, padding: '4px' }}
                                >
                                  Issue Offer Letter
                                </Button>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                                {idx > 0 && stagesArray[idx - 1] ? (
                                  <button
                                    onClick={() => advanceStage(a.id, stagesArray[idx - 1] as string)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}
                                    title={`Move back to ${stagesArray[idx - 1]}`}
                                  >
                                    <ArrowLeft size={14} />
                                  </button>
                                ) : <div />}
                                <select
                                  className="frappe-input"
                                  style={{ fontSize: 10, padding: '1px 4px', maxWidth: 80, border: 'none', background: 'transparent' }}
                                  value={a.currentStage}
                                  onChange={e => advanceStage(a.id, e.target.value)}
                                >
                                  {stagesArray.map(st => (
                                    <option key={st} value={st}>{st.toLowerCase()}</option>
                                  ))}
                                </select>
                                {idx < stagesArray.length - 1 && stagesArray[idx + 1] ? (
                                  <button
                                    onClick={() => advanceStage(a.id, stagesArray[idx + 1] as string)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}
                                    title={`Advance to ${stagesArray[idx + 1]}`}
                                  >
                                    <ArrowRight size={14} />
                                  </button>
                                ) : <div />}
                              </div>
                            </Card>
                          ))}
                          {stageApplicants.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 'var(--space-8)', fontSize: '11px', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                              Empty Stage
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {tab === 'offers' && (
            <Card padding="none">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Candidate</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Position</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Salary</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Expires</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No offers issued yet.
                      </td>
                    </tr>
                  ) : (
                    offers.map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>
                          {o.applicant?.firstName} {o.applicant?.lastName}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          {o.applicant?.jobPosting?.title || 'N/A'}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'center', fontWeight: 600 }}>
                          ${Number(o.salaryOffered).toLocaleString()}/mo
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                          {o.expiresAt ? new Date(o.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                          <StatusBadge status={o.status} />
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                          {o.status === 'SENT' && (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <Button variant="outline" size="sm" onClick={() => handleOfferStatus(o.id, 'REJECTED')} style={{ color: 'var(--color-danger)' }}>
                                Reject
                              </Button>
                              <Button variant="primary" size="sm" onClick={() => handleOfferStatus(o.id, 'ACCEPTED')}>
                                Accept
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}