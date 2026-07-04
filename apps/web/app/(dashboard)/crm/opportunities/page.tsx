'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Button } from '@unerp/ui';
import {
    Search, Plus, X, AlertCircle,
    Building
} from 'lucide-react';
import Link from 'next/link';

interface Opportunity {
    id: string;
    name: string;
    stage: string;
    amount: number | null;
    probability: number;
    expectedCloseDate?: string | null;
    customer?: { id: string; name: string } | null;
    pipeline?: { id: string; name: string } | null;
    _count?: { activities: number };
}

// Fallback stages if no pipeline configured. Real stages fetched from GET /crm/pipelines/:id/stages.
const DEFAULT_STAGES = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
const DEFAULT_STAGE_LABELS: Record<string, string> = {
    PROSPECTING: 'Prospecting', QUALIFICATION: 'Qualification', PROPOSAL: 'Proposal',
    NEGOTIATION: 'Negotiation', CLOSED_WON: 'Closed Won', CLOSED_LOST: 'Closed Lost'
};
const STAGE_COLOR_PALETTE = ['#3b82f6', '#f59e0b', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#06b6d4', '#eab308'];

interface PipelineStage {
    id: string;
    name: string;      // display label
    key: string;       // machine key stored on opportunity.stage
    probability: number;
    isWon: boolean;
    isLost: boolean;
    color: string;
}

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState('');
    const [pipelineId, setPipelineId] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({ name: '', customerId: '', amount: '', probability: '10', stage: 'PROSPECTING' });
    const [submitting, setSubmitting] = useState(false);
    const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
    const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
    const [pipelines, setPipelines] = useState<Array<{ id: string; name: string }>>([]);

    const stageKeys = pipelineStages.length > 0 ? pipelineStages.map(s => s.key) : DEFAULT_STAGES;
    const stageLabel = (k: string) => pipelineStages.find(s => s.key === k)?.name || DEFAULT_STAGE_LABELS[k] || k;
    const stageColor = (k: string) => pipelineStages.find(s => s.key === k)?.color || STAGE_COLOR_PALETTE[stageKeys.indexOf(k) % STAGE_COLOR_PALETTE.length] || '#6b7280';
    const isLostStage = (k: string) => pipelineStages.find(s => s.key === k)?.isLost ?? (k === 'CLOSED_LOST');
    const isWonStage = (k: string) => pipelineStages.find(s => s.key === k)?.isWon ?? (k === 'CLOSED_WON');

    // Debounce search input
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on new search
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const queryParams = new URLSearchParams({
                page: String(page),
                limit: viewMode === 'kanban' ? '100' : String(limit),
                search: debouncedSearch,
                sortBy,
                sortOrder,
            });
            if (stage && viewMode !== 'kanban') queryParams.append('stage', stage);
            if (pipelineId) queryParams.append('pipelineId', pipelineId);

            const [oppsRes, customersRes, pipelinesRes] = await Promise.all([
                fetch(`/api/v1/crm/opportunities?${queryParams.toString()}`, { headers: { Authorization: `Bearer ${token || ''}` } }),
                fetch('/api/v1/crm/customers', { headers: { Authorization: `Bearer ${token || ''}` } }),
                fetch('/api/v1/crm/pipelines', { headers: { Authorization: `Bearer ${token || ''}` } }),
            ]);

            if (oppsRes.ok) {
                const oppsJson = await oppsRes.json();
                if (oppsJson && typeof oppsJson === 'object' && 'data' in oppsJson) {
                    setOpportunities(oppsJson.data || []);
                    setTotalCount(oppsJson.totalCount || 0);
                    setTotalPages(oppsJson.totalPages || 0);
                } else {
                    const list = Array.isArray(oppsJson) ? oppsJson : [];
                    setOpportunities(list);
                    setTotalCount(list.length);
                    setTotalPages(Math.ceil(list.length / limit));
                }
            }
            if (customersRes.ok) setCustomers((await customersRes.json()).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
            if (pipelinesRes.ok) {
                const pipelinesJson = await pipelinesRes.json();
                const pipelinesList = Array.isArray(pipelinesJson) ? pipelinesJson : (pipelinesJson?.data || []);
                setPipelines(pipelinesList);
                const defaultPipeline = pipelinesList.find((p: { isDefault?: boolean }) => p.isDefault) || pipelinesList[0];
                if (defaultPipeline?.id && pipelineStages.length === 0) {
                    setPipelineId(defaultPipeline.id);
                    const stagesRes = await fetch(`/api/v1/crm/pipelines/${defaultPipeline.id}/stages`, { headers: { Authorization: `Bearer ${token || ''}` } });
                    if (stagesRes.ok) {
                        const sj = await stagesRes.json();
                        const list = Array.isArray(sj) ? sj : (sj?.data || []);
                        setPipelineStages(list.map((s: { id: string; name: string; key?: string; probability: number; isWon: boolean; isLost: boolean }, i: number) => ({
                            id: s.id,
                            name: s.name,
                            key: s.key || s.name.toUpperCase().replace(/\s+/g, '_'),
                            probability: s.probability,
                            isWon: s.isWon,
                            isLost: s.isLost,
                            color: STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length],
                        })));
                    }
                }
            }
        } catch {
            setError('Could not load data. Please try again.');
            setCustomers([]);
            setOpportunities([]);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, [page, debouncedSearch, stage, pipelineId, sortBy, sortOrder, viewMode]);

    const handleStageChange = async (id: string, newStage: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/v1/crm/opportunities/${id}/stage`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({ stage: newStage }),
            });
        } catch { /* demo */ }
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, stage: newStage } : o));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({ ...formData, amount: formData.amount ? Number(formData.amount) : undefined, probability: Number(formData.probability) }),
            });
            if (res.ok) { setShowCreate(false); setFormData({ name: '', customerId: '', amount: '', probability: '10', stage: 'PROSPECTING' }); fetchData(); }
        } catch { /* demo */ } finally { setSubmitting(false); }
    };

    // Calculate totals based on currently loaded page/view
    const totalPipeline = opportunities.filter(o => !isLostStage(o.stage)).reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const totalWon = opportunities.filter(o => isWonStage(o.stage)).reduce((sum, o) => sum + Number(o.amount || 0), 0);

    const grouped = stageKeys.reduce((acc, stage) => {
        acc[stage] = opportunities.filter(o => o.stage === stage);
        return acc;
    }, {} as Record<string, Opportunity[]>);

    if (loading && opportunities.length === 0) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader
                title="Sales Pipeline"
                description="Track and manage your sales opportunities through the pipeline stages"
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Opportunities' }]}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <button onClick={() => setViewMode('kanban')} style={{ padding: 'var(--space-1.5) var(--space-3)', border: 'none', background: viewMode === 'kanban' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'kanban' ? 'white' : 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>Pipeline</button>
                            <button onClick={() => setViewMode('table')} style={{ padding: 'var(--space-1.5) var(--space-3)', border: 'none', background: viewMode === 'table' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'table' ? 'white' : 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>List</button>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Opportunity</Button>
                    </div>
                }
            />

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                <Card>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Pipeline</div>
                    <h3 style={{ margin: 'var(--space-1) 0', fontSize: 'var(--text-xl)' }}>${totalPipeline.toLocaleString()}</h3>
                </Card>
                <Card>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Closed Won</div>
                    <h3 style={{ margin: 'var(--space-1) 0', fontSize: 'var(--text-xl)', color: 'var(--color-success)' }}>${totalWon.toLocaleString()}</h3>
                </Card>
                <Card>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Open Deals</div>
                    <h3 style={{ margin: 'var(--space-1) 0', fontSize: 'var(--text-xl)' }}>{opportunities.filter(o => !isWonStage(o.stage) && !isLostStage(o.stage)).length}</h3>
                </Card>
                <Card>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Avg Deal Size</div>
                    <h3 style={{ margin: 'var(--space-1) 0', fontSize: 'var(--text-xl)' }}>
                        ${opportunities.length > 0 ? Math.round(totalPipeline / (opportunities.filter(o => !isLostStage(o.stage)).length || 1)).toLocaleString() : 0}
                    </h3>
                </Card>
            </div>

            {error && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}><AlertCircle size={16} /> <span>{error}</span></div>}

            {/* Search */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: '400px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input type="text" placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                </div>
                {pipelines.length > 1 && (
                    <select value={pipelineId} onChange={e => { setPipelineId(e.target.value); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                )}
                {viewMode === 'table' && (
                    <select value={stage} onChange={e => { setStage(e.target.value); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
                        <option value="">All Stages</option>
                        {stageKeys.map(s => <option key={s} value={s}>{stageLabel(s)}</option>)}
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
                    <option value="amount:desc">Amount (Highest)</option>
                    <option value="name:asc">Name (A-Z)</option>
                </select>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>{totalCount} deals found</span>
            </div>

            {viewMode === 'kanban' ? (
                <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', minHeight: '60vh', paddingBottom: 'var(--space-4)' }}>
                    {stageKeys.map(stage => {
                        const stageOpps = grouped[stage] || [];
                        const stageTotal = stageOpps.reduce((s, o) => s + Number(o.amount || 0), 0);
                        return (
                            <div key={stage} style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: `1px solid ${stageColor(stage)}33`, borderLeft: `3px solid ${stageColor(stage)}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{stageLabel(stage)}</span>
                                        <span style={{ background: stageColor(stage) + '20', color: stageColor(stage), padding: '1px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>{stageOpps.length}</span>
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>${stageTotal.toLocaleString()}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {stageOpps.map(opp => (
                                        <Link key={opp.id} href={`/crm/opportunities/${opp.id}`} style={{ textDecoration: 'none' }}>
                                            <Card padding="sm" style={{ cursor: 'pointer' }}>
                                                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>{opp.name}</div>
                                                {opp.customer && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}><Building size={12} />{opp.customer.name}</div>}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                                                    {opp.amount && <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>${Number(opp.amount).toLocaleString()}</span>}
                                                    <span style={{ fontSize: 'var(--text-xs)', color: opp.probability >= 50 ? 'var(--color-success)' : 'var(--color-warning)' }}>{opp.probability}%</span>
                                                </div>
                                                {opp.expectedCloseDate && <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>Close: {new Date(opp.expectedCloseDate).toLocaleDateString()}</div>}
                                                <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                                                    {stageKeys.filter(s => s !== opp.stage && !isLostStage(s)).slice(0, 3).map(s => (
                                                        <button key={s} onClick={e => { e.preventDefault(); handleStageChange(opp.id, s); }}
                                                            style={{ fontSize: '8px', padding: '1px 4px', border: `1px solid ${stageColor(s)}44`, borderRadius: '4px', background: 'transparent', color: stageColor(s), cursor: 'pointer' }}>
                                                            {(stageLabel(s)).slice(0, 4)}
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
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Customer</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Stage</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Amount</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Prob.</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Close Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opportunities.map(opp => (
                                <tr key={opp.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => window.location.href = `/crm/opportunities/${opp.id}`}>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{opp.name}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{opp.customer?.name || '-'}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={stageLabel(opp.stage)} /></td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>${Number(opp.amount || 0).toLocaleString()}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>{opp.probability}%</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : '-'}</td>
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
                            <h3 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>New Opportunity</h3>
                            <button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <input type="text" placeholder="Deal Name *" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <select value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                                <input type="number" placeholder="Probability %" min="0" max="100" value={formData.probability} onChange={e => setFormData({ ...formData, probability: e.target.value })}
                                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            </div>
                            <select value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                                {stageKeys.map(s => <option key={s} value={s}>{stageLabel(s)}</option>)}
                            </select>
                            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Opportunity'}</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}