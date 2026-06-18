'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button } from '@unerp/ui';
import { Search, Plus, Mail, Phone, Building, Users, X, CheckCircle } from 'lucide-react';

interface Contact { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; mobile: string | null; title: string | null; isPrimary: boolean; customer?: { id: string; name: string } | null; }

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', mobile: '', title: '', customerId: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [res, custRes] = await Promise.all([
                fetch('/api/v1/crm/contacts', { headers: { Authorization: `Bearer ${token || ''}` } }),
                fetch('/api/v1/crm/customers', { headers: { Authorization: `Bearer ${token || ''}` } }),
            ]);
            if (res.ok) (async () => { const _d = await res.json(); setContacts(Array.isArray(_d) ? _d : (_d?.data || [])); })();
            if (custRes.ok) setCustomers((await custRes.json()).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        } catch {
            setCustomers([{ id: 'c1', name: 'Stark Industries' }, { id: 'c2', name: 'Wayne Enterprises' }]);
            setContacts([
                { id: '1', firstName: 'Pepper', lastName: 'Potts', email: 'pepper@stark.com', phone: '+1-555-1001', mobile: null, title: 'CEO', isPrimary: true, customer: { id: 'c1', name: 'Stark Industries' } },
                { id: '2', firstName: 'Lucius', lastName: 'Fox', email: 'lfox@wayne.com', phone: '+1-555-1002', mobile: null, title: 'CFO', isPrimary: true, customer: { id: 'c2', name: 'Wayne Enterprises' } },
                { id: '3', firstName: 'Happy', lastName: 'Hogan', email: 'happy@stark.com', phone: '+1-555-1003', mobile: null, title: 'Security', isPrimary: false, customer: { id: 'c1', name: 'Stark Industries' } },
            ]);
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` }, body: JSON.stringify(form) });
            if (res.ok) { setShowCreate(false); fetchData(); }
        } catch { /* demo */ } finally { setSubmitting(false); }
    };

    const filtered = contacts.filter(c => `${c.firstName} ${c.lastName} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase()));
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader title="Contacts" description="Manage contact persons linked to your customer accounts" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Contacts' }]}
                actions={<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Contact</Button>} />
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{filtered.length} contacts</span>
            </div>
            <Card padding="none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Customer</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Phone</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Title</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Primary</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}><Users size={14} style={{ marginRight: 'var(--space-2)' }} />{c.firstName} {c.lastName}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.customer ? <><Building size={12} style={{ marginRight: '4px' }} />{c.customer.name}</> : '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.email ? <a href={`mailto:${c.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}><Mail size={12} style={{ marginRight: '4px' }} />{c.email}</a> : '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.phone || c.mobile ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} />{c.phone || c.mobile}</span> : '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.title || '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>{c.isPrimary ? <CheckCircle size={14} style={{ color: 'var(--color-success)' }} /> : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', padding: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}><h3 style={{ margin: 0 }}>New Contact</h3><button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button></div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <input type="text" placeholder="First Name *" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                                <input type="text" placeholder="Last Name *" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            </div>
                            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                                <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            </div>
                            <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Contact'}</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}