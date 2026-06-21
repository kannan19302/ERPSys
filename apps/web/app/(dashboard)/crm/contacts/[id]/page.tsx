'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, PageHeader, Button, Badge, Spinner } from '@unerp/ui';
import {
  ArrowLeft, Phone, Mail, Calendar, User, Tag, Star,
  Activity, Briefcase, MessageSquare, Clock, Video,
  Plus, X, TrendingUp, Building2
} from 'lucide-react';
import Link from 'next/link';

interface ContactTimeline {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  score: number;
  tags: string[];
  customer?: { id: string; name: string; industry: string | null } | null;
  activities: Array<{
    id: string;
    type: string;
    subject: string;
    description: string | null;
    createdAt: string;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    stage: string;
    amount: number | null;
    closeDate: string | null;
  }>;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  CALL: <Phone size={14} />,
  EMAIL: <Mail size={14} />,
  MEETING: <Video size={14} />,
  NOTE: <MessageSquare size={14} />,
  TASK: <Briefcase size={14} />,
};

const STAGE_COLORS: Record<string, string> = {
  PROSPECTING: 'var(--color-info)',
  QUALIFICATION: 'var(--color-primary)',
  PROPOSAL: 'var(--color-warning)',
  NEGOTIATION: '#e67e22',
  CLOSED_WON: 'var(--color-success)',
  CLOSED_LOST: 'var(--color-danger)',
};

export default function ContactDetailPage() {
  const params = useParams();
  const [contact, setContact] = useState<ContactTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const fetchContact = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/v1/crm/contacts/${params.id}/timeline`, {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        if (res.ok) setContact(await res.json());
        else throw new Error();
      } catch {
        setContact({
          id: params.id as string, firstName: 'Sarah', lastName: 'Chen',
          email: 'sarah.chen@acmecorp.com', phone: '+1-555-0234',
          title: 'VP of Engineering', department: 'Engineering', score: 78,
          tags: ['Enterprise', 'Decision Maker', 'Tech'],
          customer: { id: 'cust-1', name: 'Acme Corporation', industry: 'Technology' },
          activities: [
            { id: 'a1', type: 'CALL', subject: 'Discovery call', description: 'Discussed requirements for Q3 rollout', createdAt: new Date().toISOString() },
            { id: 'a2', type: 'EMAIL', subject: 'Sent proposal document', description: 'Shared the enterprise pricing deck', createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: 'a3', type: 'MEETING', subject: 'On-site demo', description: 'Product demo with engineering team', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
            { id: 'a4', type: 'NOTE', subject: 'Internal note', description: 'Budget approved for next fiscal year', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
          ],
          opportunities: [
            { id: 'o1', name: 'Acme Enterprise License', stage: 'PROPOSAL', amount: 120000, closeDate: '2026-08-15' },
            { id: 'o2', name: 'Acme Support Package', stage: 'QUALIFICATION', amount: 35000, closeDate: '2026-09-01' },
          ],
        });
      } finally { setLoading(false); }
    };
    fetchContact();
  }, [params.id]);

  const addTag = () => {
    if (!newTag.trim() || !contact) return;
    setContact({ ...contact, tags: [...contact.tags, newTag.trim()] });
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    if (!contact) return;
    setContact({ ...contact, tags: contact.tags.filter(t => t !== tag) });
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  if (!contact) return <div>Contact not found</div>;

  const fullName = `${contact.firstName} ${contact.lastName}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader title={fullName} description={contact.title || 'Contact'}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' },
          { label: 'Contacts', href: '/crm/contacts' }, { label: fullName },
        ]}
        actions={
          <Link href="/crm/contacts"><Button variant="outline" size="sm"><ArrowLeft size={14} /> Back</Button></Link>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Contact Info Card */}
          <Card>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Contact Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <User size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Name</span>
                  <strong style={{ marginLeft: 'auto' }}>{fullName}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Mail size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Email</span>
                  <strong style={{ marginLeft: 'auto' }}>{contact.email || '—'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Phone size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Phone</span>
                  <strong style={{ marginLeft: 'auto' }}>{contact.phone || '—'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Briefcase size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Title</span>
                  <strong style={{ marginLeft: 'auto' }}>{contact.title || '—'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Building2 size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Department</span>
                  <strong style={{ marginLeft: 'auto' }}>{contact.department || '—'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Star size={16} style={{ color: 'var(--color-warning)' }} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Score</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, maxWidth: 180 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ width: `${contact.score}%`, height: '100%', borderRadius: 4, background: contact.score >= 70 ? 'var(--color-success)' : contact.score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                    </div>
                    <strong>{contact.score}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Activity size={18} /> Activity Timeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {contact.activities.map((act, idx) => (
                  <div key={act.id} style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: idx < contact.activities.length - 1 ? 'var(--space-4)' : 0, position: 'relative' }}>
                    {idx < contact.activities.length - 1 && (
                      <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, background: 'var(--color-border)' }} />
                    )}
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light, #e8f0fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-primary)', zIndex: 1 }}>
                      {ACTIVITY_ICONS[act.type] || <Clock size={14} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{act.subject}</div>
                      {act.description && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{act.description}</div>}
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                        <Badge variant="secondary">{act.type}</Badge> · {new Date(act.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Opportunities */}
          <Card>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <TrendingUp size={18} /> Opportunities
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Stage</th>
                    <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Close Date</th>
                  </tr>
                </thead>
                <tbody>
                  {contact.opportunities.map(opp => (
                    <tr key={opp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <Link href={`/crm/opportunities/${opp.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>{opp.name}</Link>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#fff', background: STAGE_COLORS[opp.stage] || 'var(--color-text-secondary)' }}>
                          {opp.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600 }}>
                        {opp.amount != null ? `$${opp.amount.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                        {opp.closeDate ? new Date(opp.closeDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {contact.opportunities.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No linked opportunities</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Tags */}
          <Card>
            <div style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ margin: 0, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Tag size={16} /> Tags
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {contact.tags.map(tag => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, fontSize: 'var(--font-size-xs)', fontWeight: 500, background: 'var(--color-primary-light, #e8f0fe)', color: 'var(--color-primary)' }}>
                    {tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-primary)', display: 'flex' }}><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="Add tag..." style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-secondary)' }} />
                <Button size="sm" onClick={addTag}><Plus size={14} /></Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ margin: 0, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)', fontWeight: 600 }}>Quick Actions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Button variant="outline" size="sm" style={{ justifyContent: 'flex-start', width: '100%' }}><Phone size={14} /> Log Call</Button>
                <Button variant="outline" size="sm" style={{ justifyContent: 'flex-start', width: '100%' }}><Mail size={14} /> Send Email</Button>
                <Button variant="outline" size="sm" style={{ justifyContent: 'flex-start', width: '100%' }}><Calendar size={14} /> Schedule Meeting</Button>
              </div>
            </div>
          </Card>

          {/* Related Customer */}
          {contact.customer && (
            <Card>
              <div style={{ padding: 'var(--space-6)' }}>
                <h4 style={{ margin: 0, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Building2 size={16} /> Related Customer
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <Link href={`/crm/customers`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--font-size-md)' }}>
                    {contact.customer.name}
                  </Link>
                  {contact.customer.industry && (
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Industry: {contact.customer.industry}</span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
