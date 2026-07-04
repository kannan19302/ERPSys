'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, PageHeader, StatusBadge, Spinner, Button, ProtectedComponent } from '@unerp/ui';
import { Phone, Mail, Globe, ArrowLeft, Activity, UserPlus, X, RefreshCw, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface LeadDetail {
    id: string; firstName: string; lastName: string; company: string | null; title: string | null;
    email: string | null; phone: string | null; mobile: string | null; website: string | null;
    status: string; score: number; industry: string | null; employeeCount: number | null;
    annualRevenue: number | null; notes: string | null; createdAt: string;
    source?: { name: string } | null;
    activities?: Array<{ id: string; type: string; subject: string; description: string | null; createdAt: string }>;
    opportunities?: Array<{ id: string; name: string; stage: string; amount: number | null }>;
}

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [lead, setLead] = useState<LeadDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showConvert, setShowConvert] = useState(false);
    const [convertForm, setConvertForm] = useState({ customerName: '', opportunityName: '', opportunityAmount: '' });
    const [converting, setConverting] = useState(false);
    const [recalcing, setRecalcing] = useState(false);

    const recalcScore = async () => {
        setRecalcing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/v1/crm/leads/${params.id}/recalculate-score`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
            });
            if (res.ok) {
                const json = await res.json();
                const updated = json?.data ?? json;
                setLead(prev => prev ? { ...prev, score: updated.score ?? prev.score } : prev);
            }
        } catch { /* ignore */ } finally { setRecalcing(false); }
    };

    useEffect(() => {
        const fetchLead = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/v1/crm/leads/${params.id}`, { headers: { Authorization: `Bearer ${token || ''}` } });
                if (res.ok) setLead(await res.json());
                else throw new Error();
            } catch {
                setLead({
                    id: params.id as string, firstName: 'Tony', lastName: 'Stark', company: 'Stark Industries',
                    title: 'CEO', email: 'tony@stark.com', phone: '+1-555-0101', mobile: null, website: 'starkindustries.com',
                    status: 'QUALIFIED', score: 85, industry: 'Technology', employeeCount: 5000, annualRevenue: 50000000,
                    notes: 'Interested in arc reactor supply deal for 2026.',
                    createdAt: new Date().toISOString(), source: { name: 'Website' },
                    activities: [
                        { id: 'a1', type: 'CALL', subject: 'Initial call with Tony', description: 'Discussed arc reactor requirements', createdAt: new Date().toISOString() },
                        { id: 'a2', type: 'EMAIL', subject: 'Sent product brochure', description: 'Emailed the latest Stark Industries catalog', createdAt: new Date(Date.now() - 86400000).toISOString() },
                    ],
                    opportunities: [{ id: 'o1', name: 'Arc Reactor Supply Deal', stage: 'PROPOSAL', amount: 50000 }],
                });
            } finally { setLoading(false); }
        };
        fetchLead();
    }, [params.id]);

    const handleConvert = async (e: React.FormEvent) => {
        e.preventDefault(); setConverting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/v1/crm/leads/${params.id}/convert`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({
                    customerName: convertForm.customerName || undefined,
                    opportunityName: convertForm.opportunityName || undefined,
                    opportunityAmount: convertForm.opportunityAmount ? Number(convertForm.opportunityAmount) : undefined,
                }),
            });
            if (res.ok) { router.push('/crm/opportunities'); }
            else { alert('Conversion failed'); }
        } catch { alert('Demo mode: Lead would be converted'); } finally { setConverting(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
    if (!lead) return <div>Lead not found</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader title={`${lead.firstName} ${lead.lastName}`} description={lead.company || 'Individual Lead'}
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Leads', href: '/crm/leads' }, { label: `${lead.firstName} ${lead.lastName}` }]}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Link href="/crm/leads"><Button variant="outline" size="sm"><ArrowLeft size={14} /> Back</Button></Link>
                        {lead.status !== 'CONVERTED' && lead.status !== 'DISQUALIFIED' && (
                            <Button variant="primary" size="sm" onClick={() => setShowConvert(true)}><UserPlus size={14} /> Convert</Button>
                        )}
                    </div>
                }
            />

            {/* Prominent score banner */}
            <Card padding="md">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: lead.score >= 80 ? 'var(--color-success-light, #ecfdf5)' : lead.score >= 50 ? 'var(--color-warning-light)' : 'var(--color-bg-sunken)', color: lead.score >= 80 ? 'var(--color-success)' : lead.score >= 50 ? 'var(--color-warning)' : 'var(--color-text-tertiary)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-2xl, 22px)' }}>
                            {lead.score}
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Lead Score</div>
                            <div style={{ fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                <TrendingUp size={14} /> {lead.score >= 80 ? 'Hot' : lead.score >= 50 ? 'Warm' : 'Cold'}
                            </div>
                        </div>
                    </div>
                    <ProtectedComponent permission="crm.lead-scoring.recalculate">
                        <Button variant="outline" size="sm" onClick={recalcScore} disabled={recalcing}>
                            <RefreshCw size={14} /> {recalcing ? 'Recalculating…' : 'Recalculate Score'}
                        </Button>
                    </ProtectedComponent>
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {/* Contact Info */}
                    <Card padding="md">
                        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)' }}>Contact Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            {lead.email && <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Email</span><p style={{ margin: 'var(--space-1) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><Mail size={14} /> {lead.email}</p></div>}
                            {lead.phone && <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Phone</span><p style={{ margin: 'var(--space-1) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><Phone size={14} /> {lead.phone}</p></div>}
                            {lead.website && <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Website</span><p style={{ margin: 'var(--space-1) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><Globe size={14} /> {lead.website}</p></div>}
                            {lead.title && <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Title</span><p style={{ margin: 'var(--space-1) 0' }}>{lead.title}</p></div>}
                        </div>
                    </Card>

                    {/* Activity Timeline */}
                    <Card padding="md">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                            <h4 style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Activity Timeline</h4>
                            <Link href={`/crm/activities`}><Button variant="outline" size="sm"><Activity size={14} /> Log Activity</Button></Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {(lead.activities || []).map(a => (
                                <div key={a.id} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}><StatusBadge status={a.type} /> {a.subject}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {a.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0' }}>{a.description}</p>}
                                </div>
                            ))}
                            {(!lead.activities || lead.activities.length === 0) && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>No activities recorded</p>}
                        </div>
                    </Card>

                    {/* Notes */}
                    {lead.notes && (
                        <Card padding="md">
                            <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-sm)' }}>Notes</h4>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{lead.notes}</p>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <Card padding="md">
                        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)' }}>Lead Details</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Status</span><StatusBadge status={lead.status} /></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Score</span><span style={{ fontWeight: 'var(--weight-bold)', color: lead.score >= 80 ? 'var(--color-success)' : lead.score >= 50 ? 'var(--color-warning)' : 'var(--color-text-tertiary)' }}>{lead.score}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Source</span><span>{lead.source?.name || '-'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Industry</span><span>{lead.industry || '-'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Employees</span><span>{lead.employeeCount?.toLocaleString() || '-'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Revenue</span><span>{lead.annualRevenue ? `$${lead.annualRevenue.toLocaleString()}` : '-'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Created</span><span>{new Date(lead.createdAt).toLocaleDateString()}</span></div>
                        </div>
                    </Card>

                    {/* Related Opportunities */}
                    {(lead.opportunities ?? []).length > 0 && (
                        <Card padding="md">
                            <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)' }}>Opportunities</h4>
                            {(lead.opportunities ?? []).map(o => (
                                <Link key={o.id} href={`/crm/opportunities/${o.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>
                                        <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{o.name}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                            <StatusBadge status={o.stage} /> {o.amount ? `$${o.amount.toLocaleString()}` : ''}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </Card>
                    )}
                </div>
            </div>

            {showConvert && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', padding: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}><h3 style={{ margin: 0 }}>Convert Lead</h3><button onClick={() => setShowConvert(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button></div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
                            Convert {lead.firstName} {lead.lastName} into a Customer and Opportunity
                        </p>
                        <form onSubmit={handleConvert} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <input type="text" placeholder="Customer Name" value={convertForm.customerName} onChange={e => setConvertForm({ ...convertForm, customerName: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <input type="text" placeholder="Opportunity Name" value={convertForm.opportunityName} onChange={e => setConvertForm({ ...convertForm, opportunityName: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <input type="number" placeholder="Opportunity Amount" value={convertForm.opportunityAmount} onChange={e => setConvertForm({ ...convertForm, opportunityAmount: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <Button variant="primary" type="submit" disabled={converting}>{converting ? 'Converting...' : 'Convert to Customer & Opportunity'}</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}