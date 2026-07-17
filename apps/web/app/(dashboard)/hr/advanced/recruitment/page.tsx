'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Plus, ArrowLeft, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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
  const client = useApiClient();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appRes, offersRes] = await Promise.all([
        client.get<Array<{ id: string; title: string; status: string; postedAt: string }>>('/api/v1/advanced-hr/jobs'),
        client.get<Array<{ id: string; firstName: string; lastName: string; currentStage: string; jobPosting: { title: string } }>>('/api/v1/advanced-hr/applicants'),
        client.get<OfferLetter[]>('/api/v1/advanced-hr/offers'),
      ]);
      setJobs(jobsRes); setApplicants(appRes); setOffers(offersRes);
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
      await client.post('/api/v1/advanced-hr/jobs', form);
      {
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
      await client.post('/api/v1/advanced-hr/applicants', applicantForm);
      {
        setMsg('Applicant added successfully.');
        setShowApplicantForm(false);
        setApplicantForm({ jobPostingId: '', firstName: '', lastName: '', email: '', phone: '' });
        fetchData();
      }
    } catch {}
  };

  const advanceStage = async (id: string, stage: string) => {
    await client.post(`/api/v1/advanced-hr/applicants/${id}/advance`, {
      stage
    });
    fetchData();
  };

  const createOfferLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/api/v1/advanced-hr/offers', {
          applicantId: offerForm.applicantId,
          salaryOffered: parseFloat(offerForm.salaryOffered),
          expiresAt: offerForm.expiresAt || null,
          notes: offerForm.notes || ''
        });
      {
        setMsg('Offer Letter issued successfully.');
        setShowOfferForm(false);
        setOfferForm({ applicantId: '', salaryOffered: '', expiresAt: '', notes: '' });
        fetchData();
      }
    } catch {}
  };

  const handleOfferStatus = async (id: string, status: string) => {
    try {
      await client.request(`/api/v1/advanced-hr/offers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      {
        setMsg(`Offer status updated to ${status}.`);
        fetchData();
      }
    } catch {}
  };

  return (
    <RouteGuard permission="hr.recruitment.read">
    <div className="ui-stack-6">
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
        <div className={styles.s0}>
          {msg}
        </div>
      )}

      <div className="ui-flex ui-gap-3">
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
          <form onSubmit={createJob} className="ui-stack-3">
            <input
              className="ui-input"
              placeholder="Job Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="ui-input"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
            />
            <div className="ui-grid-2 ui-gap-3">
              <input
                className="ui-input"
                placeholder="Location"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
              <select
                className="ui-input"
                value={form.employmentType}
                onChange={e => setForm({ ...form, employmentType: e.target.value })}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Post Job</Button>
            </div>
          </form>
        </Card>
      )}

      {showApplicantForm && (
        <Card padding="md">
          <h4 className={styles.s1}>Add New Job Applicant</h4>
          <form onSubmit={createApplicant} className="ui-stack-3">
            <select
              className="ui-input"
              value={applicantForm.jobPostingId}
              onChange={e => setApplicantForm({ ...applicantForm, jobPostingId: e.target.value })}
              required
            >
              <option value="">Select Job Position</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <div className="ui-grid-2 ui-gap-3">
              <input
                className="ui-input"
                placeholder="First Name"
                value={applicantForm.firstName}
                onChange={e => setApplicantForm({ ...applicantForm, firstName: e.target.value })}
                required
              />
              <input
                className="ui-input"
                placeholder="Last Name"
                value={applicantForm.lastName}
                onChange={e => setApplicantForm({ ...applicantForm, lastName: e.target.value })}
                required
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <input
                className="ui-input"
                placeholder="Email"
                type="email"
                value={applicantForm.email}
                onChange={e => setApplicantForm({ ...applicantForm, email: e.target.value })}
                required
              />
              <input
                className="ui-input"
                placeholder="Phone"
                value={applicantForm.phone}
                onChange={e => setApplicantForm({ ...applicantForm, phone: e.target.value })}
              />
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowApplicantForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Submit Applicant</Button>
            </div>
          </form>
        </Card>
      )}

      {showOfferForm && (
        <Card padding="md">
          <h4 className={styles.s2}>Issue Job Offer Letter</h4>
          <form onSubmit={createOfferLetter} className="ui-stack-3">
            <select
              className="ui-input"
              value={offerForm.applicantId}
              onChange={e => setOfferForm({ ...offerForm, applicantId: e.target.value })}
              required
            >
              <option value="">Select Candidate</option>
              {applicants.filter(a => a.currentStage === 'OFFER' || a.currentStage === 'HIRED').map(a => (
                <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.jobPosting?.title})</option>
              ))}
            </select>
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Offered Monthly Salary ($)</label>
                <input
                  type="number"
                  className="ui-input"
                  placeholder="5000"
                  value={offerForm.salaryOffered}
                  onChange={e => setOfferForm({ ...offerForm, salaryOffered: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="ui-text-caption">Offer Expiry Date</label>
                <input
                  type="date"
                  className="ui-input"
                  value={offerForm.expiresAt}
                  onChange={e => setOfferForm({ ...offerForm, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <textarea
              className="ui-input"
              placeholder="Notes, terms, or message to candidate"
              value={offerForm.notes}
              onChange={e => setOfferForm({ ...offerForm, notes: e.target.value })}
              rows={3}
            />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowOfferForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Issue Offer</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {tab === 'jobs' && (
            <ListPageTemplate
              title=""
              columns={[
                { key: 'title', header: 'Title' },
                { key: 'postedAt', header: 'Posted', render: (v) => new Date(String(v)).toLocaleDateString() },
                { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
              ] as ListColumn[]}
              data={jobs as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No jobs posted yet."
            />
          )}

          {tab === 'applicants' && (
            <div className="ui-stack-4">
              {/* View Switcher */}
              <div className="ui-flex-end ui-gap-2">
                <Button variant={viewMode === 'kanban' ? 'primary' : 'outline'} onClick={() => setViewMode('kanban')}>
                  <LayoutGrid size={14} className="mr-1" /> Kanban Board
                </Button>
                <Button variant={viewMode === 'table' ? 'primary' : 'outline'} onClick={() => setViewMode('table')}>
                  <List size={14} className="mr-1" /> List View
                </Button>
              </div>

              {viewMode === 'table' ? (
                <ListPageTemplate
                  title=""
                  columns={[
                    { key: 'firstName', header: 'Name', render: (_v, row) => {
                      const a = row as unknown as { id: string; firstName: string; lastName: string; currentStage: string; jobPosting: { title: string } };
                      return <span className="font-semibold">{a.firstName} {a.lastName}</span>;
                    }},
                    { key: 'jobPosting', header: 'Job Position', render: (v) => (v as { title: string })?.title || 'N/A' },
                    { key: 'currentStage', header: 'Pipeline Stage', render: (v) => <StatusBadge status={String(v)} /> },
                    { key: 'id', header: 'Action', render: (_v, row) => {
                      const a = row as unknown as { id: string; firstName: string; lastName: string; currentStage: string; jobPosting: { title: string } };
                      return (
                        <div className={styles.s3}>
                          {a.currentStage === 'OFFER' && (
                            <Button variant="outline" size="sm" onClick={() => { setOfferForm({ ...offerForm, applicantId: a.id }); setShowOfferForm(true); }}>
                              Issue Offer
                            </Button>
                          )}
                          <select className={`ui-input ${styles.s4}`} defaultValue="" onChange={e => { if (e.target.value) advanceStage(a.id, e.target.value); }}>
                            <option value="">Advance</option>
                            <option value="SCREENING">Screening</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="HIRED">Hire</option>
                            <option value="REJECTED">Reject</option>
                          </select>
                        </div>
                      );
                    }},
                  ] as ListColumn[]}
                  data={applicants as unknown as Record<string, unknown>[]}
                  loading={loading}
                  emptyTitle="No applicants found."
                />
              ) : (
                /* Kanban Board View */
                <div className={styles.auto0}>
                  {['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].map((stage, idx, stagesArray) => {
                    const stageApplicants = applicants.filter(a => a.currentStage === stage);
                    return (
                      <div key={stage} className={styles.s5}>
                        <div className={styles.s6}>
                          <span className={styles.s7}>{stage}</span>
                          <span className={styles.s8}>{stageApplicants.length}</span>
                        </div>
                        <div className={styles.s9}>
                          {stageApplicants.map(a => (
                            <Card key={a.id} padding="sm" className="ui-stack-2">
                              <div>
                                <div className="ui-heading-sm">{a.firstName} {a.lastName}</div>
                                <div className={styles.s10}>{a.jobPosting?.title || 'N/A'}</div>
                              </div>
                              {a.currentStage === 'OFFER' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setOfferForm({ ...offerForm, applicantId: a.id });
                                    setShowOfferForm(true);
                                  }}
                                  className={styles.s11}
                                >
                                  Issue Offer Letter
                                </Button>
                              )}
                              <div className={styles.s12}>
                                {idx > 0 && stagesArray[idx - 1] ? (
                                  <button
                                    onClick={() => advanceStage(a.id, stagesArray[idx - 1] as string)}
                                    className={styles.s13}
                                    title={`Move back to ${stagesArray[idx - 1]}`}
                                  >
                                    <ArrowLeft size={14} />
                                  </button>
                                ) : <div />}
                                <select
                                  className={`ui-input ${styles.s14}`}
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
                                    className={styles.s15}
                                    title={`Advance to ${stagesArray[idx + 1]}`}
                                  >
                                    <ArrowRight size={14} />
                                  </button>
                                ) : <div />}
                              </div>
                            </Card>
                          ))}
                          {stageApplicants.length === 0 && (
                            <div className={styles.s16}>
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
            <ListPageTemplate
              title=""
              columns={[
                { key: 'applicant', header: 'Candidate', render: (v) => { const a = v as OfferLetter['applicant']; return <span className="font-semibold">{a?.firstName} {a?.lastName}</span>; }},
                { key: 'applicant', header: 'Position', render: (v) => { const a = v as OfferLetter['applicant']; return a?.jobPosting?.title || 'N/A'; }},
                { key: 'salaryOffered', header: 'Salary', render: (v) => <span className="font-semibold">${Number(v).toLocaleString()}/mo</span> },
                { key: 'expiresAt', header: 'Expires', render: (v) => v ? new Date(String(v)).toLocaleDateString() : 'Never' },
                { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
                { key: 'id', header: 'Actions', render: (_v, row) => {
                  const o = row as unknown as OfferLetter;
                  return o.status === 'SENT' ? (
                    <div className={styles.s17}>
                      <Button variant="outline" size="sm" onClick={() => handleOfferStatus(o.id, 'REJECTED')} className="ui-text-danger">Reject</Button>
                      <Button variant="primary" size="sm" onClick={() => handleOfferStatus(o.id, 'ACCEPTED')}>Accept</Button>
                    </div>
                  ) : null;
                }},
              ] as ListColumn[]}
              data={offers as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No offers issued yet."
            />
          )}
        </>
      )}
    </div>
    </RouteGuard>
  );
}



