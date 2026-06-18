'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge } from '@unerp/ui';
import { Plus, X, Mail } from 'lucide-react';

interface EmailTemplate {
    id: string; name: string; category: string; subject: string; body: string; isActive: boolean;
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', category: 'GENERAL', subject: '', body: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/email-templates', { headers: { Authorization: `Bearer ${token || ''}` } });
            if (res.ok) (async () => { const _d = await res.json(); setTemplates(Array.isArray(_d) ? _d : (_d?.data || [])); })(); else throw new Error();
        } catch {
            setTemplates([
                { id: '1', name: 'Welcome Email', category: 'GENERAL', subject: 'Welcome {{customer.name}}!', body: 'Dear {{customer.name}}, welcome to our platform...', isActive: true },
                { id: '2', name: 'Quote Follow-up', category: 'QUOTATION', subject: 'Following up on your quote', body: 'Hi {{customer.name}}, I wanted to follow up...', isActive: true },
                { id: '3', name: 'Invoice Reminder', category: 'INVOICE', subject: 'Payment Reminder - {{invoice.number}}', body: 'Dear {{customer.name}}, this is a reminder...', isActive: true },
            ]);
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/email-templates', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` }, body: JSON.stringify(form) });
            if (res.ok) { setShowCreate(false); fetchData(); }
        } catch { /* demo */ } finally { setSubmitting(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader title="Email Templates" description="Create and manage reusable email templates" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Email Templates' }]}
                actions={<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New Template</Button>} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
                {templates.map(t => (
                    <Card key={t.id} padding="md">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Mail size={16} style={{ color: 'var(--color-primary)' }} /><span style={{ fontWeight: 'var(--weight-semibold)' }}>{t.name}</span></div>
                            <StatusBadge status={t.category} />
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-2)' }}><strong>Subject:</strong> {t.subject}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.body.substring(0, 100)}...</p>
                    </Card>
                ))}
            </div>
            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '520px', padding: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}><h3 style={{ margin: 0 }}>New Email Template</h3><button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button></div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <input type="text" placeholder="Template Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                                <option value="GENERAL">General</option><option value="QUOTATION">Quotation</option><option value="INVOICE">Invoice</option><option value="FOLLOWUP">Follow-up</option>
                            </select>
                            <input type="text" placeholder="Subject (use {{variable}} syntax)" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <textarea placeholder="Email body (HTML supported)..." required value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={6} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', resize: 'vertical' }} />
                            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Template'}</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}