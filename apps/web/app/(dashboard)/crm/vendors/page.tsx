'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Button } from '@unerp/ui';
import { Search, Plus, Building, Mail, X } from 'lucide-react';

interface Vendor { id: string; name: string; email: string | null; phone: string | null; taxId: string | null; paymentTerms: number; status: string; }

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', paymentTerms: '30' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/vendors', { headers: { Authorization: `Bearer ${token || ''}` } });
            if (res.ok) setVendors(await res.json()); else throw new Error();
        } catch {
            setVendors([
                { id: 'v1', name: 'Pym Particles Inc.', email: 'supply@pym.com', phone: '+1-555-0901', taxId: 'TX-901', paymentTerms: 30, status: 'ACTIVE' },
                { id: 'v2', name: 'Wakanda Minerals Trading', email: 'sales@wakandaminerals.gov', phone: null, taxId: 'TX-000', paymentTerms: 60, status: 'ACTIVE' },
            ]);
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            await fetch('/api/v1/crm/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` }, body: JSON.stringify({ ...form, paymentTerms: Number(form.paymentTerms) }) });
            setShowCreate(false); fetchData();
        } catch { /* demo */ } finally { setSubmitting(false); }
    };

    const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader title="Vendors" description="Manage your vendor and supplier accounts" breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Vendors' }]}
                actions={<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Vendor</Button>} />
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{filtered.length} vendors</span>
            </div>
            <Card padding="none">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Phone</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Tax ID</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Terms</th>
                            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}><Building size={14} style={{ marginRight: 'var(--space-2)' }} />{v.name}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{v.email ? <a href={`mailto:${v.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}><Mail size={12} style={{ marginRight: '4px' }} />{v.email}</a> : '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{v.phone || '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>{v.taxId || '-'}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Net {v.paymentTerms}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}><StatusBadge status={v.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', padding: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}><h3 style={{ margin: 0 }}>New Vendor</h3><button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button></div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <input type="text" placeholder="Company Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }} />
                            <select value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                                <option value="15">Net 15</option><option value="30">Net 30</option><option value="45">Net 45</option><option value="60">Net 60</option>
                            </select>
                            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Vendor'}</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}