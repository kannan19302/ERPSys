'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge, DataTable, Badge } from '@unerp/ui';
import { Brain, TrendingUp, RefreshCw, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LeadScoringPage() {
    const [loading, setLoading] = useState(true);
    const [models, setModels] = useState<any[]>([]);
    const [training, setTraining] = useState(false);
    const [trainResult, setTrainResult] = useState<any>(null);
    const [leads, setLeads] = useState<any[]>([]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token || ''}` };
        try {
            const [mlRes, leadsRes] = await Promise.all([
                fetch('/api/v1/crm/ml-models', { headers }),
                fetch('/api/v1/crm/leads?limit=20&sortBy=score&sortOrder=desc', { headers }),
            ]);
            if (mlRes.ok) { const d = await mlRes.json(); setModels(d?.data ?? d ?? []); }
            if (leadsRes.ok) { const d = await leadsRes.json(); setLeads(d?.data ?? d ?? []); }
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleTrain = async () => {
        setTraining(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/ml-models/train', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` } });
            if (res.ok) { const d = await res.json(); setTrainResult(d?.data ?? d); await fetchData(); }
        } catch { /* ignore */ } finally { setTraining(false); }
    };

    if (loading) return <div className="frappe-page"><Spinner /></div>;

    const leadColumns = [
        { key: 'firstName', header: 'Name', render: (r: any) => `${r.firstName} ${r.lastName}` },
        { key: 'company', header: 'Company' },
        { key: 'email', header: 'Email' },
        { key: 'score', header: 'Score', render: (r: any) => <Badge variant={r.score >= 80 ? 'success' : r.score >= 50 ? 'warning' : 'default'}>{String(r.score || 0)}</Badge> },
        { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    ];

    return (
        <div className="frappe-page">
            <PageHeader title="Predictive Lead Scoring" description="ML-powered lead scoring with explainability" breadcrumbs={[{ label: 'CRM Intelligence', href: '/crm/intelligence' }, { label: 'Lead Scoring' }]} />

            <div className="frappe-grid-3" style={{ marginBottom: 'var(--space-6)' }}>
                <Card>
                    <div className="frappe-card-header"><h3 className="frappe-card-title">ML Models</h3></div>
                    <div className="frappe-card-body">
                        {models.length === 0 ? <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No models trained yet</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {models.map((m: any) => (
                                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                                        <div><strong style={{ fontSize: 'var(--text-sm)' }}>{m.name}</strong><p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{m.model_type}</p></div>
                                        <Badge variant={m.status === 'ACTIVE' ? 'success' : 'default'}>{m.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ marginTop: 'var(--space-4)' }}>
                            <Button onClick={handleTrain} disabled={training}><RefreshCw size={14} /> {training ? 'Training...' : 'Train New Model'}</Button>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="frappe-card-header"><h3 className="frappe-card-title">Training Results</h3></div>
                    <div className="frappe-card-body">
                        {trainResult ? (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div><p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Accuracy</p><p style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>{trainResult.accuracy}%</p></div>
                                    <div><p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Leads Scored</p><p style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>{trainResult.leadsScored}</p></div>
                                    <div><p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Total Leads</p><p style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>{trainResult.totalLeads}</p></div>
                                    <div><p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Features</p><p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>{trainResult.featuresUsed?.length || 0}</p></div>
                                </div>
                                <div style={{ marginTop: 'var(--space-3)' }}>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Features Used:</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                                        {trainResult.featuresUsed?.map((f: string) => <Badge key={f} variant="default">{f}</Badge>)}
                                    </div>
                                </div>
                            </div>
                        ) : <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Train a model to see results</p>}
                    </div>
                </Card>

                <Card>
                    <div className="frappe-card-header"><h3 className="frappe-card-title">Scoring Factors</h3></div>
                    <div className="frappe-card-body">
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>Top factors influencing lead scores:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {[{ factor: 'Email provided', points: 15 }, { factor: 'Phone provided', points: 15 }, { factor: 'Company identified', points: 10 }, { factor: 'Website available', points: 10 }, { factor: 'Industry specified', points: 10 }].map((f) => (
                                <div key={f.factor} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-sm)' }}>
                                    <span style={{ fontSize: 'var(--text-sm)' }}>{f.factor}</span>
                                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-primary)' }}>+{f.points}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="frappe-card-header"><h3 className="frappe-card-title">Leads by Score</h3></div>
                <div className="frappe-card-body">
                    <DataTable columns={leadColumns} data={leads} />
                </div>
            </Card>
        </div>
    );
}