'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, PageHeader, StatusBadge, Spinner, Button, ProtectedComponent, useToast, DataTable, type Column, type SortOrder } from '@unerp/ui';
import {
    Search, Plus, X, AlertCircle,
    TrendingUp, Building, Users, Eye, Trash2, RotateCcw
} from 'lucide-react';
import { DuplicatesFinder } from '../_components/DuplicatesFinder';
import { KanbanBoard } from './_components/kanban-board';
import { apiDelete, apiPost, ApiRequestError } from '../../../../src/lib/api';

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

function ScoreChip({ score }: { score: number }) {
    const color = score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-text-tertiary)';
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', color, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
            <TrendingUp size={10} /> {score}
        </span>
    );
}

export default function LeadsPage() {
    const router = useRouter();
    const { success, error: showToastError } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [sources, setSources] = useState<{id: string, name: string}[]>([]);
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
    const [formData, setFormData] = useState({ firstName: '', lastName: '', company: '', email: '', phone: '', notes: '', sourceId: '' });
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

    useEffect(() => {
        const fetchSources = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/v1/crm/lead-sources', { headers: { Authorization: `Bearer ${token || ''}` } });
                const data = await res.json();
                if (Array.isArray(data)) setSources(data);
            } catch {}
        };
        fetchSources();
    }, []);

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

    const handleSortChange = (key: string, order: SortOrder) => {
        setSortBy(key);
        setSortOrder(order);
    };

    const handleDeleteLead = async (lead: Lead) => {
        if (!window.confirm(`Delete lead "${lead.firstName} ${lead.lastName}"? This cannot be undone.`)) return;
        try {
            await apiDelete(`/crm/leads/${lead.id}`);
            success('Lead deleted.');
            fetchLeads();
        } catch (err: unknown) {
            const message = err instanceof ApiRequestError ? err.message : 'Failed to delete lead.';
            showToastError(message);
        }
    };

    const handleReactivateLead = async (lead: Lead) => {
        const reason = window.prompt(`Reactivate "${lead.firstName} ${lead.lastName}"? Optionally note why (e.g. budget freed up):`);
        if (reason === null) return;
        try {
            await apiPost(`/crm/leads/${lead.id}/reactivate`, { reason: reason || undefined });
            success('Lead reactivated to New.');
            fetchLeads();
        } catch (err: unknown) {
            const message = err instanceof ApiRequestError ? err.message : 'Failed to reactivate lead.';
            showToastError(message);
        }
    };

    const columns: Column<Lead>[] = [
        { key: 'firstName', header: 'Name', sortable: true, render: (l) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{l.firstName} {l.lastName}</span> },
        { key: 'company', header: 'Company', sortable: true, render: (l) => l.company || '-' },
        { key: 'email', header: 'Contact', render: (l) => l.email ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{l.email}</div> : '-' },
        { key: 'status', header: 'Status', sortable: true, render: (l) => <StatusBadge status={l.status} /> },
        { key: 'score', header: 'Score', sortable: true, render: (l) => <ScoreChip score={l.score} /> },
        { key: 'source', header: 'Source', render: (l) => l.source?.name || '-' },
        {
            key: 'actions', header: 'Actions', align: 'center', width: '90px',
            render: (l) => (
                <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center' }}>
                    <button title="View" onClick={(e) => { e.stopPropagation(); router.push(`/crm/leads/${l.id}`); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 'var(--space-1)' }}><Eye size={15} /></button>
                    {l.status === 'DISQUALIFIED' && (
                        <button title="Reactivate (win-back)" onClick={(e) => { e.stopPropagation(); handleReactivateLead(l); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-success, #10b981)', padding: 'var(--space-1)' }}><RotateCcw size={15} /></button>
                    )}
                    <button title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteLead(l); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger, #dc2626)', padding: 'var(--space-1)' }}><Trash2 size={15} /></button>
                </div>
            ),
        },
    ];

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        const token = localStorage.getItem('token');
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        try {
            await fetch(`/api/v1/crm/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch { 
            // Revert on error if necessary (for demo we keep the optimistic update)
        }
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
                sourceId: formData.sourceId || undefined,
            };
            const res = await fetch('/api/v1/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setShowCreate(false);
                setFormData({ firstName: '', lastName: '', company: '', email: '', phone: '', notes: '', sourceId: '' });
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
                <KanbanBoard leads={leads} onStatusChange={handleStatusChange} />
            ) : (
                <Card padding="none">
                    <DataTable<Lead>
                        columns={columns}
                        data={leads}
                        rowKey={(l) => l.id}
                        onRowClick={(l) => router.push(`/crm/leads/${l.id}`)}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSortChange={handleSortChange}
                        emptyTitle="No leads found"
                        emptyMessage='Click "Add Lead" to create one.'
                    />
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
                            <select value={formData.sourceId} onChange={e => setFormData({ ...formData, sourceId: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', background: 'var(--color-bg)' }}>
                                <option value="">Select Lead Source (Optional)</option>
                                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
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