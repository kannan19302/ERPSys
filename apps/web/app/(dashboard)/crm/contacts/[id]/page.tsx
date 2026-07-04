'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, PageHeader, Spinner, Button, StatusBadge, Badge, Modal,
  TextField, FormField, Select, useToast, KPICard, Textarea,
} from '@unerp/ui';
import {
  ArrowLeft, Phone, Mail, Calendar, User, Tag, Star,
  Activity, Briefcase, MessageSquare, Clock, Video,
  Plus, X, TrendingUp, Building, Edit, Trash2, Shield, Globe
} from 'lucide-react';
import { apiGet, apiPut, apiDelete, ApiRequestError } from '../../../../../src/lib/api';

interface LinkedParty {
  id: string;
  name: string;
  industry?: string | null;
}

interface ContactDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  title: string | null;
  department: string | null;
  isPrimary: boolean;
  notes: string | null;
  secondaryEmail: string | null;
  preferredContactMethod: string | null;
  engagementScore: number;
  socialProfiles: any;
  lifecycleStatus: string;
  buyingRole: string;
  lastContactedAt: string | null;
  interactionVelocity: number;
  createdAt: string;
  customer?: LinkedParty | null;
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
  tags: Array<{
    id: string;
    tag: {
      id: string;
      name: string;
      color: string;
    };
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
  const router = useRouter();
  const id = params.id as string;
  const { success, error } = useToast();

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<LinkedParty[]>([]);

  // Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', mobile: '',
    title: '', department: '', isPrimary: false,    notes: '',
    secondaryEmail: '', preferredContactMethod: 'EMAIL',
    socialProfiles: '', lifecycleStatus: 'LEAD', customerId: '',
    buyingRole: 'INFLUENCER',
  });

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // New Tag State
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);

  const fetchContact = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ContactDetail>(`/crm/contacts/${id}/timeline`);
      setContact(data);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to load contact.';
      error(message);
      setContact(null);
    } finally {
      setLoading(false);
    }
  }, [id, error]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await apiGet<any>('/crm/customers');
      if (res && Array.isArray(res.data)) {
        setCustomers(res.data);
      } else if (Array.isArray(res)) {
        setCustomers(res);
      }
    } catch {}
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const tags = await apiGet<any>('/crm/contacts/tags');
      setAvailableTags(Array.isArray(tags) ? tags : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchContact();
    fetchCustomers();
    fetchTags();
  }, [fetchContact, fetchCustomers, fetchTags]);

  const triggerEdit = () => {
    if (!contact) return;
    setEditForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      title: contact.title || '',
      department: contact.department || '',
      isPrimary: contact.isPrimary,
      notes: contact.notes || '',
      secondaryEmail: contact.secondaryEmail || '',
      preferredContactMethod: contact.preferredContactMethod || 'EMAIL',
      socialProfiles: typeof contact.socialProfiles === 'object' && contact.socialProfiles ? JSON.stringify(contact.socialProfiles) : String(contact.socialProfiles || ''),
      lifecycleStatus: contact.lifecycleStatus || 'LEAD',
      customerId: contact.customer?.id || '',
      buyingRole: contact.buyingRole || 'INFLUENCER',
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      let parsedSocial = null;
      if (editForm.socialProfiles.trim()) {
        try {
          parsedSocial = JSON.parse(editForm.socialProfiles);
        } catch {
          parsedSocial = editForm.socialProfiles;
        }
      }

      const payload = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        mobile: editForm.mobile.trim() || undefined,
        title: editForm.title.trim() || undefined,
        department: editForm.department.trim() || undefined,
        isPrimary: editForm.isPrimary,
        notes: editForm.notes.trim() || undefined,
        secondaryEmail: editForm.secondaryEmail.trim() || undefined,
        preferredContactMethod: editForm.preferredContactMethod,
        socialProfiles: parsedSocial,
        lifecycleStatus: editForm.lifecycleStatus,
        customerId: editForm.customerId || undefined,
        buyingRole: editForm.buyingRole,
      };

      await apiPut(`/crm/contacts/${id}`, payload);
      success('Contact updated successfully.');
      setEditOpen(false);
      fetchContact();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to update contact.';
      error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiDelete(`/crm/contacts/${id}`);
      success('Contact deleted successfully.');
      setDeleteOpen(false);
      router.push('/crm/contacts');
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to delete contact.';
      error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    try {
      let tagObj = availableTags.find(t => t.name.toLowerCase() === newTag.trim().toLowerCase());
      if (!tagObj) {
        tagObj = await apiPut<any>('/crm/contacts/tags', { name: newTag.trim(), color: '#3b82f6' });
        fetchTags();
      }
      await apiPut(`/crm/contacts/${id}/tags`, { tagId: tagObj!.id });
      success('Tag assigned successfully.');
      setNewTag('');
      fetchContact();
    } catch {
      error('Failed to assign tag.');
    }
  };

  const handleRemoveTag = async (tagLinkId: string) => {
    try {
      await apiDelete(`/crm/contacts/${id}/tags/${tagLinkId}`);
      success('Tag removed.');
      fetchContact();
    } catch {
      error('Failed to remove tag.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
        <User size={48} style={{ color: 'var(--color-text-tertiary)' }} />
        <h3>Contact Not Found</h3>
        <Button variant="primary" onClick={() => router.push('/crm/contacts')}>
          Back to Contacts List
        </Button>
      </div>
    );
  }

  const fullName = `${contact.firstName} ${contact.lastName}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title={fullName}
        description={contact.title ? `${contact.title} at ${contact.customer?.name || 'Unassociated'}` : 'Contact details'}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Contacts', href: '/crm/contacts' },
          { label: fullName },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="sm" onClick={() => router.push('/crm/contacts')}>
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={triggerEdit}>
              <Edit size={14} style={{ marginRight: 6 }} /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} style={{ marginRight: 6 }} /> Delete
            </Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Main Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Information Grid */}
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Profile Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>First Name</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginTop: '2px' }}>{contact.firstName}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Last Name</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginTop: '2px' }}>{contact.lastName}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Primary Email</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{contact.email || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Secondary Email</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{contact.secondaryEmail || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Phone</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{contact.phone || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Mobile</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{contact.mobile || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Title</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{contact.title || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Department</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{contact.department || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Primary Contact</span>
                <div style={{ marginTop: '2px' }}>
                  <Badge variant={contact.isPrimary ? 'success' : 'default'}>{contact.isPrimary ? 'Yes' : 'No'}</Badge>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Lifecycle Status</span>
                <div style={{ marginTop: '2px' }}>
                  <Badge variant="info">{contact.lifecycleStatus}</Badge>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Preferred Contact Method</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{contact.preferredContactMethod || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Buying Center Role</span>
                <div style={{ marginTop: '2px' }}>
                  <Badge variant="primary">{contact.buyingRole || 'INFLUENCER'}</Badge>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Last Contacted</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  {contact.lastContactedAt ? new Date(contact.lastContactedAt).toLocaleDateString() : 'Never'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>30-Day Activity Velocity</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: contact.interactionVelocity > 5 ? 'var(--color-success)' : 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {contact.interactionVelocity} activities
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Engagement Score</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <div style={{ flex: 1, height: 8, background: 'var(--color-bg-sunken)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${contact.engagementScore}%`, height: '100%', background: 'var(--color-success)' }} />
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>{contact.engagementScore}</span>
                </div>
              </div>
            </div>

            {contact.notes && (
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Notes</span>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{contact.notes}</p>
              </div>
            )}
          </Card>

          {/* Activity History */}
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} /> Activities History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {contact.activities && contact.activities.length > 0 ? (
                contact.activities.map((act) => (
                  <div key={act.id} style={{ display: 'flex', gap: 'var(--space-3)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {ACTIVITY_ICONS[act.type] || <Clock size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{act.subject}</div>
                      {act.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{act.description}</div>}
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
                  No activities recorded yet.
                </div>
              )}
            </div>
          </Card>

          {/* Linked Opportunities */}
          <Card padding="none">
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Opportunities</h4>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Name</th>
                  <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Stage</th>
                  <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Value</th>
                  <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Close Date</th>
                </tr>
              </thead>
              <tbody>
                {contact.opportunities && contact.opportunities.length > 0 ? (
                  contact.opportunities.map((opp) => (
                    <tr key={opp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text)', fontWeight: 'var(--weight-medium)' }}>{opp.name}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'white', background: STAGE_COLORS[opp.stage] || 'var(--color-text-secondary)' }}>
                          {opp.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>
                        {opp.amount != null ? `$${Number(opp.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}` : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                        {opp.closeDate ? new Date(opp.closeDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                      No opportunities linked to this contact.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Linked Customer Card */}
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Account Association</h4>
            {contact.customer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Customer Account</span>
                <a onClick={() => router.push(`/crm/customers`)} style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
                  {contact.customer.name}
                </a>
                {contact.customer.industry && (
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-secondary)' }}>Industry: {contact.customer.industry}</span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Unassociated Contact</span>
            )}
          </Card>

          {contact.customer && (() => {
            const customer = contact.customer;
            return (
              <Card padding="md">
                <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Account Contracts</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <Button size="sm" variant="outline" style={{ width: '100%' }} onClick={() => router.push(`/crm/contracts?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`)}>
                    Create Contract
                  </Button>
                </div>
              </Card>
            );
          })()}

          {/* Social Profiles */}
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> Social Profiles
            </h4>
            {contact.socialProfiles ? (
              <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: 'var(--color-bg-sunken)', padding: '8px', borderRadius: '4px' }}>
                {typeof contact.socialProfiles === 'object' ? JSON.stringify(contact.socialProfiles, null, 2) : String(contact.socialProfiles)}
              </div>
            ) : (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>No profiles recorded</span>
            )}
          </Card>

          {/* Tags Manager */}
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} /> Tags
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1-5)', marginBottom: 'var(--space-3)' }}>
              {contact.tags && contact.tags.length > 0 ? (
                contact.tags.map((t) => (
                  <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', background: t.tag.color || 'var(--color-primary-light)', color: t.tag.color ? 'white' : 'var(--color-primary)' }}>
                    {t.tag.name}
                    <button onClick={() => handleRemoveTag(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><X size={10} /></button>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>No tags assigned</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Assign tag..." style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)', color: 'var(--color-text)', outline: 'none' }} />
              <Button size="sm" onClick={handleAddTag}><Plus size={12} /></Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Contact Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Contact" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate as any} disabled={updating}>{updating ? 'Saving...' : 'Save Updates'}</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="First Name" required value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
            <TextField label="Last Name" required value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Primary Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <TextField label="Secondary Email" value={editForm.secondaryEmail} onChange={(e) => setEditForm({ ...editForm, secondaryEmail: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <TextField label="Mobile" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <TextField label="Department" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Lifecycle Status">
              <Select value={editForm.lifecycleStatus} onChange={(e) => setEditForm({ ...editForm, lifecycleStatus: e.target.value })}>
                <option value="LEAD">Lead</option>
                <option value="MARKETING_QUALIFIED">Marketing Qualified</option>
                <option value="SALES_QUALIFIED">Sales Qualified</option>
                <option value="OPPORTUNITY">Opportunity</option>
                <option value="ACTIVE_CUSTOMER">Active Customer</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
            <FormField label="Preferred Contact Method">
              <Select value={editForm.preferredContactMethod} onChange={(e) => setEditForm({ ...editForm, preferredContactMethod: e.target.value })}>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="SMS">SMS</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>
            <FormField label="Buying Center Role">
              <Select value={editForm.buyingRole} onChange={(e) => setEditForm({ ...editForm, buyingRole: e.target.value })}>
                <option value="BUYER">Buyer</option>
                <option value="DECISION_MAKER">Decision Maker</option>
                <option value="INFLUENCER">Influencer</option>
                <option value="GATEKEEPER">Gatekeeper</option>
                <option value="TECHNICAL">Technical Buyer</option>
                <option value="BILLING">Billing/Finance</option>
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: 'var(--space-3)' }}>
            <FormField label="Customer Account">
              <Select value={editForm.customerId} onChange={(e) => setEditForm({ ...editForm, customerId: e.target.value })}>
                <option value="">None / Unassociated</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Primary contact?">
              <div style={{ marginTop: 'var(--space-2)' }}>
                <input type="checkbox" checked={editForm.isPrimary} onChange={(e) => setEditForm({ ...editForm, isPrimary: e.target.checked })} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
              </div>
            </FormField>
          </div>
          <TextField label="Social Profiles (JSON format)" value={editForm.socialProfiles} onChange={(e) => setEditForm({ ...editForm, socialProfiles: e.target.value })} placeholder='e.g. {"linkedin": "https://linkedin.com/..."}' />
          <FormField label="Notes">
            <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
          </FormField>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirm Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete this contact? This will soft-delete the record and remove it from lists. This action is reversible by system admins.
        </p>
      </Modal>
    </div>
  );
}
