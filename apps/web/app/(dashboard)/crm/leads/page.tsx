'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Button, ProtectedComponent, useToast } from '@unerp/ui';
import {
    Search, Plus, X, AlertCircle,
    TrendingUp, Building, Users
} from 'lucide-react';
import Link from 'next/link';
import { DuplicatesFinder } from '../_components/DuplicatesFinder';

function ScoreChip({ score }: { score: number }) {
    const color = score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-text-tertiary)';
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', color, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
            <TrendingUp size={10} /> {score}
        </span>
    );
}

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
    const { success, error: showToastError } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', company: '', email: '', phone: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [showDuplicates, setShowDuplicates] = useState(false);

    // Debounce search input
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on new search
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchLeads = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const queryParams = new URLSearchParams({
                page: String(page),
                limit: viewMode === 'kanban' ? '100' : String(limit), // Kanban needs larger limit to show stages
                search: debouncedSearch,
                sortBy,
                sortOrder,
            });
            if (status && viewMode !== 'kanban') {
                queryParams.append('status', status);
            }
            const res = await fetch(`/api/v1/crm/leads?${queryParams.toString()}`, { headers: { Authorization: `Bearer ${token || ''}` } });
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (data && typeof data === 'object' && 'data' in data) {
                setLeads(data.data || []);
                setTotalCount(data.totalCount || 0);
                setTotalPages(data.totalPages || 0);
            } else {
                const list = Array.isArray(data) ? data : [];
                setLeads(list);
                setTotalCount(list.length);
                setTotalPages(Math.ceil(list.length / limit));
            }
        } catch {
            setError('Could not load data. Please try again.');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [page, debouncedSearch, status, sortBy, sortOrder, viewMode]);

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
            const payload = {
                ...formData,
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                company: formData.company.trim() || undefined,
                notes: formData.notes.trim() || undefined,
            };
            const res = await fetch('/api/v1/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setShowCreate(false);
                setFormData({ firstName: '', lastName: '', company: '', email: '', phone: '', notes: '' });
                success('Lead created successfully.');
                fetchLeads();
            } else {
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData.message || 'Failed to create lead.';
                showToastError(errMsg);
            }
        } catch (err: any) {
            showToastError(err.message || 'An error occurred while creating lead.');
        } finally {
            setSubmitting(false);
        }
    };

    const groupedLeads = LEAD_STATUSES.reduce((acc, status) => {
        acc[status] = leads.filter(l => l.status === status);
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
                        <ProtectedComponent permission="crm.duplicates.scan">
                            <Button variant="outline" size="sm" onClick={() => setShowDuplicates(true)}>
                                <Users size={14} /> Find Duplicates
                            </Button>
                        </ProtectedComponent>
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

            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: '400px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                </div>
                {viewMode === 'table' && (
                    <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
                        <option value="">All Statuses</option>
                        {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                )}
                <select value={`${sortBy}:${sortOrder}`} onChange={e => {
                    const parts = e.target.value.split(':');
                    if (parts[0] && parts[1]) {
                        setSortBy(parts[0]);
                        setSortOrder(parts[1] as 'asc' | 'desc');
                    }
                }}
                    style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
                    <option value="createdAt:desc">Newest First</option>
                    <option value="score:desc">Lead Score (Highest)</option>
                    <option value="firstName:asc">Name (A-Z)</option>
                </select>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>{totalCount} leads found</span>
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
                                                    <ScoreChip score={lead.score} />
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
                            {leads.map(lead => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => window.location.href = `/crm/leads/${lead.id}`}>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{lead.firstName} {lead.lastName}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{lead.company || '-'}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        {lead.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{lead.email}</div>}
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={lead.status} /></td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><ScoreChip score={lead.score} /></td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{lead.source?.name || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                Showing Page {page} of {totalPages} ({totalCount} total)
                            </span>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                    Previous
                                </Button>
                                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
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

            {showDuplicates && (
                <DuplicatesFinder entity="leads" onClose={() => setShowDuplicates(false)} onMerged={fetchLeads} />
            )}
        </div>
    );
}