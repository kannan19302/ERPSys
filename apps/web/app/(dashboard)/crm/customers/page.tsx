'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, PageHeader, StatusBadge, Spinner, Button, ProtectedComponent } from '@unerp/ui';
import { Search, Plus, Mail, Building, X, Users, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { DuplicatesFinder } from '../_components/DuplicatesFinder';

interface Customer {
    id: string;
    name: string;
    type: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    creditLimit: number | null;
    paymentTerms: number;
    status: string;
    _count?: { invoices: number; quotations: number; salesOrders: number };
}

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [type, setType] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'COMPANY', email: '', phone: '', creditLimit: '5000', paymentTerms: '30' });
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const queryParams = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                search: debouncedSearch,
                status,
                type,
                sortBy,
                sortOrder,
            });

            const res = await fetch(`/api/v1/crm/customers?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token || ''}` }
            });
            
            if (res.ok) {
                const _d = await res.json();
                if (_d && typeof _d === 'object' && 'data' in _d) {
                    setCustomers(_d.data || []);
                    setTotalCount(_d.totalCount || 0);
                    setTotalPages(_d.totalPages || 0);
                } else if (Array.isArray(_d)) {
                    setCustomers(_d);
                    setTotalCount(_d.length);
                    setTotalPages(Math.ceil(_d.length / limit));
                }
            } else {
                throw new Error();
            }
        } catch {
            // Mock data fallback for local demo
            const mockData: Customer[] = [
                { id: '1', name: 'Stark Industries', type: 'COMPANY', email: 'procurement@stark.com', phone: '+1-555-0101', taxId: 'TX-001', creditLimit: 50000, paymentTerms: 30, status: 'ACTIVE', _count: { invoices: 5, quotations: 3, salesOrders: 2 } },
                { id: '2', name: 'Wayne Enterprises', type: 'COMPANY', email: 'treasury@wayne.com', phone: '+1-555-0102', taxId: 'TX-002', creditLimit: 100000, paymentTerms: 45, status: 'ACTIVE', _count: { invoices: 8, quotations: 6, salesOrders: 4 } },
                { id: '3', name: 'Oscorp Industries', type: 'COMPANY', email: 'finance@oscorp.com', phone: '+1-555-0103', taxId: 'TX-003', creditLimit: 25000, paymentTerms: 15, status: 'ACTIVE', _count: { invoices: 2, quotations: 1, salesOrders: 1 } },
                { id: '4', name: 'Peter Parker', type: 'INDIVIDUAL', email: 'peter@dailybugle.com', phone: '+1-555-0104', taxId: null, creditLimit: 1000, paymentTerms: 30, status: 'ACTIVE', _count: { invoices: 1, quotations: 2, salesOrders: 1 } },
                { id: '5', name: 'LexCorp', type: 'COMPANY', email: 'billing@lexcorp.com', phone: '+1-555-0105', taxId: 'TX-005', creditLimit: 150000, paymentTerms: 60, status: 'INACTIVE', _count: { invoices: 12, quotations: 10, salesOrders: 9 } }
            ];

            // Client-side filtering simulation for mock data
            let filtered = mockData.filter(c => 
                (c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || (c.email || '').toLowerCase().includes(debouncedSearch.toLowerCase())) &&
                (status === '' || c.status === status) &&
                (type === '' || c.type === type)
            );

            // Client-side sorting simulation
            filtered.sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
                else if (sortBy === 'creditLimit') comparison = (a.creditLimit || 0) - (b.creditLimit || 0);
                else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
                
                return sortOrder === 'desc' ? -comparison : comparison;
            });

            const paginated = filtered.slice((page - 1) * limit, page * limit);
            setCustomers(paginated);
            setTotalCount(filtered.length);
            setTotalPages(Math.ceil(filtered.length / limit));
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch, status, type, sortBy, sortOrder]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({
                    ...form,
                    creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
                    paymentTerms: Number(form.paymentTerms)
                }),
            });
            if (res.ok) {
                setShowCreate(false);
                setForm({ name: '', type: 'COMPANY', email: '', phone: '', creditLimit: '5000', paymentTerms: '30' });
                fetchData();
            }
        } catch {
            // fallback
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <style dangerouslySetInnerHTML={{ __html: '.hover-row:hover { background-color: var(--color-bg-sunken) !important; }' }} />
            
            <PageHeader
                title="Customers"
                description="Manage your customer accounts, credit limits, and terms"
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Customers' }]}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <ProtectedComponent permission="crm.duplicates.scan">
                            <Button variant="outline" size="sm" onClick={() => setShowDuplicates(true)}>
                                <Users size={14} /> Find Duplicates
                            </Button>
                        </ProtectedComponent>
                        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                            <Plus size={14} /> Add Customer
                        </Button>
                    </div>
                }
            />

            {/* Premium Filter Bar */}
            <Card padding="md">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                            <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)',
                                    fontSize: 'var(--text-sm)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                            />
                        </div>
                        
                        {/* Type Filter */}
                        <select
                            value={type}
                            onChange={e => { setType(e.target.value); setPage(1); }}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text)',
                                outline: 'none'
                            }}
                        >
                            <option value="">All Types</option>
                            <option value="COMPANY">Company</option>
                            <option value="INDIVIDUAL">Individual</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={status}
                            onChange={e => { setStatus(e.target.value); setPage(1); }}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text)',
                                outline: 'none'
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                        <SlidersHorizontal size={14} style={{ color: 'var(--color-text-secondary)' }} />
                        <select
                            value={`${sortBy}:${sortOrder}`}
                            onChange={e => {
                                const parts = e.target.value.split(':');
                                if (parts[0] && parts[1]) {
                                    setSortBy(parts[0]);
                                    setSortOrder(parts[1] as 'asc' | 'desc');
                                }
                            }}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text)',
                                outline: 'none'
                            }}
                        >
                            <option value="name:asc">Name (A-Z)</option>
                            <option value="name:desc">Name (Z-A)</option>
                            <option value="creditLimit:desc">Highest Credit Limit</option>
                            <option value="creditLimit:asc">Lowest Credit Limit</option>
                        </select>
                    </div>
                </div>
            </Card>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    <Card padding="none">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Type</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Phone</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Credit Limit</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Terms</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                            No customers found. Click "Add Customer" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map(c => (
                                        <tr 
                                            key={c.id} 
                                            onClick={() => router.push(`/crm/customers/${c.id}`)}
                                            style={{ 
                                                borderBottom: '1px solid var(--color-border)', 
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                            }}
                                            className="hover-row"
                                        >
                                            <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                    <Building size={14} style={{ color: 'var(--color-text-secondary)' }} />
                                                    {c.name}
                                                </div>
                                            </td>
                                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                                <span style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize', background: 'var(--color-bg-sunken)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                                                    {c.type.toLowerCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                                {c.email ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
                                                        <Mail size={12} />{c.email}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.phone || '-'}</td>
                                            <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>
                                                {c.creditLimit !== null ? `$${c.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                            </td>
                                            <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Net {c.paymentTerms}</td>
                                            <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                                                <StatusBadge status={c.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                Showing {customers.length} of {totalCount} customers
                            </span>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </Button>
                                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                >
                                    Next <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create Drawer */}
            {showCreate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px', padding: 'var(--space-5)', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>New Customer</h3>
                            <button onClick={() => setShowCreate(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Customer Type</label>
                                <select 
                                    value={form.type} 
                                    onChange={e => setForm({ ...form, type: e.target.value })} 
                                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}
                                >
                                    <option value="COMPANY">Company</option>
                                    <option value="INDIVIDUAL">Individual</option>
                                </select>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name *</label>
                                <input type="text" placeholder="e.g. Stark Industries" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email</label>
                                <input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Phone</label>
                                <input type="text" placeholder="+1-555-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Credit Limit ($)</label>
                                    <input type="number" placeholder="5000" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Payment Terms</label>
                                    <select value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
                                        <option value="15">Net 15</option>
                                        <option value="30">Net 30</option>
                                        <option value="45">Net 45</option>
                                        <option value="60">Net 60</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyItems: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                <Button variant="outline" type="button" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>Cancel</Button>
                                <Button variant="primary" type="submit" disabled={submitting} style={{ flex: 1 }}>{submitting ? 'Creating...' : 'Create Customer'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDuplicates && (
                <DuplicatesFinder entity="customers" onClose={() => setShowDuplicates(false)} onMerged={fetchData} />
            )}
        </div>
    );
}