'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Button } from '@unerp/ui';
import { Search, Plus, Mail, Building, X } from 'lucide-react';

interface Customer {
    id: string; name: string; type: string; email: string | null; phone: string | null;
    taxId: string | null; creditLimit: number | null; paymentTerms: number; status: string;
    _count?: { invoices: number; quotations: number; salesOrders: number };
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', creditLimit: '5000', paymentTerms: '30' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/customers', { headers: { Authorization: `Bearer ${token || ''}` } });
            if (res.ok) (async () => { const _d = await res.json(); setCustomers(Array.isArray(_d) ? _d : (_d?.data || [])); })();
            else throw new Error();
        } catch {
            setCustomers([
                { id: '1', name: 'Stark Industries', type: 'COMPANY', email: 'procurement@stark.com', phone: '+1-555-0101', taxId: 'TX-001', creditLimit: 50000, paymentTerms: 30, status: 'ACTIVE', _count: { invoices: 5, quotations: 3, salesOrders: 2 } },
                { id: '2', name: 'Wayne Enterprises', type: 'COMPANY', email: 'treasury@wayne.com', phone: '+1-555-0102', taxId: 'TX-002', creditLimit: 100000, paymentTerms: 45, status: 'ACTIVE', _count: { invoices: 8, quotations: 6, salesOrders: 4 } },
            ]);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/customers', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({ ...form, creditLimit: Number(form.creditLimit), paymentTerms: Number(form.paymentTerms) }),
            });
            if (res.ok) { setShowCreate(false); fetchData(); }
        } catch { /* demo */ } finally { setSubmitting(false); }
    };

    const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader title="Customers" description="Manage your customer accounts and credit terms" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Customers' }]}
                actions={<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Customer</Button>} />
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{filtered.length} customers</span>
            </div>
            <Card padding="none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Phone</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Credit Limit</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Terms</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Building size={14} />{c.name}</div></td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.email ? <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', textDecoration: 'none' }}><Mail size={12} />{c.email}</a> : '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.phone || '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>{c.creditLimit ? `$${c.creditLimit.toLocaleString()}` : '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Net {c.paymentTerms}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}><StatusBadge status={c.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', padding: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}><h3 style={{ margin: 0 }}>New Customer</h3><button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button></div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <input type="text" placeholder="Company Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <input type="number" placeholder="Credit Limit" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                                <select value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                                    <option value="15">Net 15</option><option value="30">Net 30</option><option value="45">Net 45</option><option value="60">Net 60</option>
                                </select>
                            </div>
                            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Customer'}</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}