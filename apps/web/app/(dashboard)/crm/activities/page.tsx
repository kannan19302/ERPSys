'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge } from '@unerp/ui';
import { Phone, Mail, Calendar, FileText, MessageSquare, Plus, X, CheckCircle } from 'lucide-react';

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    CALL: <Phone size={14} />, EMAIL: <Mail size={14} />, MEETING: <Calendar size={14} />,
    NOTE: <FileText size={14} />, TASK: <CheckCircle size={14} />, QUOTE_SENT: <Mail size={14} />, ORDER_PLACED: <MessageSquare size={14} />
};
const ACTIVITY_COLORS: Record<string, string> = {
    CALL: '#3b82f6', EMAIL: '#8b5cf6', MEETING: '#f59e0b', NOTE: '#6b7280',
    TASK: '#10b981', QUOTE_SENT: '#f97316', ORDER_PLACED: '#ef4444'
};

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ type: 'NOTE', subject: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/activities', { headers: { Authorization: `Bearer ${token || ''}` } });
            if (res.ok) setActivities(await res.json()); else throw new Error();
        } catch {
            setActivities([
                { id: '1', type: 'CALL', subject: 'Discussed arc reactor contract', description: 'Tony agreed to initial terms', createdAt: new Date().toISOString() },
                { id: '2', type: 'EMAIL', subject: 'Sent proposal for Batmobile fleet', description: 'Pricing sheet attached', createdAt: new Date(Date.now() - 86400000).toISOString() },
                { id: '3', type: 'MEETING', subject: 'Quarterly review with Wayne Enterprises', description: 'Discussed upcoming projects', createdAt: new Date(Date.now() - 172800000).toISOString() },
            ]);
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/activities', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` }, body: JSON.stringify(form) });
            if (res.ok) { setShowCreate(false); setForm({ type: 'NOTE', subject: '', description: '' }); fetchData(); }
        } catch { /* demo */ } finally { setSubmitting(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader title="Activities" description="Track all communications and tasks across your CRM" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Activities' }]}
                actions={<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Log Activity</Button>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {activities.map(a => (
                    <Card key={a.id} padding="sm">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                            <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: `${ACTIVITY_COLORS[a.type]}15`, color: ACTIVITY_COLORS[a.type] }}>{ACTIVITY_ICONS[a.type]}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{a.subject}</span>
                                    <StatusBadge status={a.type} />
                                </div>
                                {a.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0' }}>{a.description}</p>}
                                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{new Date(a.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>
                ))}
                {activities.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-8)' }}>No activities logged yet</p>}
            </div>
            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', padding: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}><h3 style={{ margin: 0 }}>Log Activity</h3><button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button></div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                                <option value="CALL">Phone Call</option><option value="EMAIL">Email</option><option value="MEETING">Meeting</option><option value="NOTE">Note</option><option value="TASK">Task</option>
                            </select>
                            <input type="text" placeholder="Subject *" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', resize: 'vertical' }} />
                            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Logging...' : 'Log Activity'}</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}