'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Button } from '@unerp/ui';
import {
    Search, Plus, X, AlertCircle,
    TrendingUp, Building
} from 'lucide-react';
import Link from 'next/link';

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    score: number;
    source?: { name: string } | null;
    _count?: { activities: number; opportunities: number };
}

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'];
const STATUS_COLORS: Record<string, string> = {
    NEW: '#3b82f6', CONTACTED: '#f59e0b', QUALIFIED: '#10b981',
    DISQUALIFIED: '#ef4444', CONVERTED: '#8b5cf6'
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', company: '', email: '', phone: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchLeads = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/leads', { headers: { Authorization: `Bearer ${token || ''}` } });
            if (!res.ok) throw new Error();
            const data = await res.json();
      setLeads(Array.isArray(data) ? data : (data?.data || []));
        } catch {
            setError('Using demo data');
            setLeads([
                { id: '1', firstName: 'Tony', lastName: 'Stark', company: 'Stark Industries', email: 'tony@stark.com', phone: '+1-555-0101', status: 'NEW', score: 85, source: { name: 'Website' }, _count: { activities: 2, opportunities: 0 } },
                { id: '2', firstName: 'Bruce', lastName: 'Wayne', company: 'Wayne Enterprises', email: 'bruce@wayne.com', phone: '+1-555-0102', status: 'CONTACTED', score: 72, source: { name: 'Referral' }, _count: { activities: 4, opportunities: 1 } },
                { id: '3', firstName: 'Natasha', lastName: 'Romanoff', company: 'S.H.I.E.L.D.', email: 'natasha@shield.gov', phone: '+1-555-0103', status: 'QUALIFIED', score: 91, source: { name: 'LinkedIn' }, _count: { activities: 6, opportunities: 2 } },
                { id: '4', firstName: 'Peter', lastName: 'Parker', company: 'Daily Bugle', email: 'peter@bugle.com', phone: '+1-555-0104', status: 'NEW', score: 45, source: { name: 'Website' }, _count: { activities: 1, opportunities: 0 } },
                { id: '5', firstName: 'Stephen', lastName: 'Strange', company: 'Kamar-Taj', email: 'strange@sanctum.com', phone: '+1-555-0105', status: 'QUALIFIED', score: 88, source: { name: 'Conference' }, _count: { activities: 5, opportunities: 1 } },
                { id: '6', firstName: 'Carol', lastName: 'Danvers', company: 'NASA', email: 'carol@nasa.gov', phone: '+1-555-0106', status: 'CONTACTED', score: 76, source: { name: 'Website' }, _count: { activities: 3, opportunities: 0 } },
                { id: '7', firstName: 'Loki', lastName: 'Laufeyson', company: 'Asgard Trading', email: 'loki@asgard.com', phone: '+1-555-0107', status: 'DISQUALIFIED', score: 30, source: { name: 'Email' }, _count: { activities: 2, opportunities: 0 } },
                { id: '8', firstName: 'Wanda', lastName: 'Maximoff', company: 'Sokovia Industries', email: 'wanda@sokovia.com', phone: '+1-555-0108', status: 'NEW', score: 65, source: { name: 'Referral' }, _count: { activities: 0, opportunities: 0 } },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeads(); }, []);

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/v1/crm/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch { /* demo - update local */ }
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowCreate(false);
                setFormData({ firstName: '', lastName: '', company: '', email: '', phone: '', notes: '' });
                fetchLeads();
            }
        } catch { /* demo */ } finally { setSubmitting(false); }
    };

    const filteredLeads = leads.filter(l =>
        `${l.firstName} ${l.lastName} ${l.company || ''} ${l.email || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const groupedLeads = LEAD_STATUSES.reduce((acc, status) => {
        acc[status] = filteredLeads.filter(l => l.status === status);
        return acc;
    }, {} as Record<string, Lead[]>);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader
                title="Leads Management"
                description="Track, qualify, and convert your sales leads"
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Leads' }]}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <button onClick={() => setViewMode('kanban')} style={{ padding: 'var(--space-1.5) var(--space-3)', border: 'none', background: viewMode === 'kanban' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'kanban' ? 'white' : 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>Kanban</button>
                            <button onClick={() => setViewMode('table')} style={{ padding: 'var(--space-1.5) var(--space-3)', border: 'none', background: viewMode === 'table' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'table' ? 'white' : 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>Table</button>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                            <Plus size={14} /> Add Lead
                        </Button>
                    </div>
                }
            />

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                    <AlertCircle size={16} /> <span>{error}</span>
                </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{filteredLeads.length} leads</span>
            </div>

            {viewMode === 'kanban' ? (
                <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', minHeight: '60vh', paddingBottom: 'var(--space-4)' }}>
                    {LEAD_STATUSES.map(status => {
                        const statusLeads = groupedLeads[status] || [];
                        return (
                            <div key={status} style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLORS[status] || '#6b7280' }} />
                                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{status}</span>
                                    <span style={{ marginLeft: 'auto', background: 'var(--color-bg-sunken)', padding: '1px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)' }}>{statusLeads.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {statusLeads.map(lead => (
                                        <Link key={lead.id} href={`/crm/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                                            <Card padding="sm" style={{ cursor: 'pointer' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                                                        {lead.firstName} {lead.lastName}
                                                    </span>
                                                    {lead.score >= 80 && <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />}
                                                </div>
                                                {lead.company && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                                        <Building size={12} /> {lead.company}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                                    <span style={{ fontSize: '10px', background: 'var(--color-bg-sunken)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>Score: {lead.score}</span>
                                                    {lead.source && <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{lead.source.name}</span>}
                                                </div>
                                                <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-1)' }}>
                                                    {LEAD_STATUSES.filter(s => s !== lead.status).map(s => (
                                                        <button key={s} onClick={e => { e.preventDefault(); handleStatusChange(lead.id, s); }}
                                                            style={{ fontSize: '9px', padding: '1px 4px', border: `1px solid ${STATUS_COLORS[s]}`, borderRadius: '4px', background: 'transparent', color: STATUS_COLORS[s], cursor: 'pointer' }}>
                                                            {s[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <Card padding="none">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Company</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Contact</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Score</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => window.location.href = `/crm/leads/${lead.id}`}>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{lead.firstName} {lead.lastName}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{lead.company || '-'}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        {lead.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{lead.email}</div>}
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={lead.status} /></td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{lead.score}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{lead.source?.name || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', padding: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                            <h3 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>New Lead</h3>
                            <button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <input type="text" placeholder="First Name *" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                                <input type="text" placeholder="Last Name *" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            </div>
                            <input type="text" placeholder="Company" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <input type="text" placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', resize: 'vertical' }} />
                            <Button variant="primary" type="submit" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Lead'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}