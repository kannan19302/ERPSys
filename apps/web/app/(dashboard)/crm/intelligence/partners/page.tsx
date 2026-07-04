'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, DataTable, Column, Modal } from '@unerp/ui';
import { Users, ArrowLeft, Plus, DollarSign, Target, Gift, HelpCircle, X } from 'lucide-react';
import Link from 'next/link';

interface PartnerPerf {
    partnerId: string;
    partnerName: string;
    totalRevenue: number;
    totalOrders: number;
    wonOrders: number;
    conversionRate: number;
    commissionEarned: number;
    contactsCount: number;
    lastOrderDate: string | null;
}

export default function PartnerManagementPage() {
    const [loading, setLoading] = useState(true);
    const [partners, setPartners] = useState<PartnerPerf[]>([]);
    const [mdfSummary, setMdfSummary] = useState<any>(null);
    const [showRegisterLead, setShowRegisterLead] = useState(false);
    const [registerForm, setRegisterForm] = useState({ partnerId: '', firstName: '', lastName: '', company: '', email: '', phone: '', notes: '' });
    const [submittingLead, setSubmittingLead] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token || ''}` };
        try {
            const [perfRes] = await Promise.all([
                fetch('/api/v1/crm/partners/performance', { headers }),
            ]);
            if (perfRes.ok) {
                const json = await perfRes.json();
                const list = json?.data || [];
                setPartners(list);
                if (list.length > 0) {
                    setRegisterForm(prev => ({ ...prev, partnerId: list[0].partnerId }));
                    // Load MDF for first partner
                    const mdfRes = await fetch(`/api/v1/crm/partners/${list[0].partnerId}/mdf`, { headers });
                    if (mdfRes.ok) {
                        const mdfJson = await mdfRes.json();
                        setMdfSummary(mdfJson?.data || null);
                    }
                }
            } else {
                // Mock fallback
                const mockList = [
                    { partnerId: 'p1', partnerName: 'Acme Distributors', totalRevenue: 150000, totalOrders: 20, wonOrders: 15, conversionRate: 75, commissionEarned: 15000, contactsCount: 5, lastOrderDate: new Date().toISOString() },
                    { partnerId: 'p2', partnerName: 'Global Resellers', totalRevenue: 85000, totalOrders: 12, wonOrders: 8, conversionRate: 66, commissionEarned: 8500, contactsCount: 3, lastOrderDate: new Date(Date.now() - 86400000).toISOString() }
                ];
                setPartners(mockList);
                setMdfSummary({
                    partnerId: 'p1',
                    partnerName: 'Acme Distributors',
                    totalBudget: 50000,
                    utilized: 18500,
                    remaining: 31500,
                    utilizationRate: 37,
                    claims: [
                        { id: 'mdf-1', name: 'Q1 Co-marketing Campaign', amount: 10000, status: 'APPROVED', date: '2026-02-15' },
                        { id: 'mdf-2', name: 'Trade Show Booth', amount: 5000, status: 'PAID', date: '2026-03-10' }
                    ]
                });
            }
        } catch {
            // Mock fallback
            const mockList = [
                { partnerId: 'p1', partnerName: 'Acme Distributors', totalRevenue: 150000, totalOrders: 20, wonOrders: 15, conversionRate: 75, commissionEarned: 15000, contactsCount: 5, lastOrderDate: new Date().toISOString() },
                { partnerId: 'p2', partnerName: 'Global Resellers', totalRevenue: 85000, totalOrders: 12, wonOrders: 8, conversionRate: 66, commissionEarned: 8500, contactsCount: 3, lastOrderDate: new Date(Date.now() - 86400000).toISOString() }
            ];
            setPartners(mockList);
            setMdfSummary({
                partnerId: 'p1',
                partnerName: 'Acme Distributors',
                totalBudget: 50000,
                utilized: 18500,
                remaining: 31500,
                utilizationRate: 37,
                claims: [
                    { id: 'mdf-1', name: 'Q1 Co-marketing Campaign', amount: 10000, status: 'APPROVED', date: '2026-02-15' },
                    { id: 'mdf-2', name: 'Trade Show Booth', amount: 5000, status: 'PAID', date: '2026-03-10' }
                ]
            });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRegisterLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingLead(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/v1/crm/partners/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify(registerForm)
            });
            if (res.ok) {
                setShowRegisterLead(false);
                setRegisterForm(prev => ({ ...prev, firstName: '', lastName: '', company: '', email: '', phone: '', notes: '' }));
                alert('Lead registered successfully via Partner Portal!');
            } else {
                alert('Failed to register lead');
            }
        } catch {
            alert('Failed to register lead');
        } finally { setSubmittingLead(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    const totalRev = partners.reduce((s, p) => s + p.totalRevenue, 0);
    const totalCom = partners.reduce((s, p) => s + p.commissionEarned, 0);

    const columns: Column<PartnerPerf>[] = [
        { key: 'partnerName', header: 'Partner Name', render: (p) => <span style={{ fontWeight: 'bold' }}>{p.partnerName}</span> },
        { key: 'totalRevenue', header: 'Revenue Generated', align: 'right', render: (p) => `$${p.totalRevenue.toLocaleString()}` },
        { key: 'commissionEarned', header: 'Commission Paid', align: 'right', render: (p) => `$${p.commissionEarned.toLocaleString()}` },
        { key: 'conversionRate', header: 'Conversion Rate', align: 'center', render: (p) => `${p.conversionRate}%` },
        { key: 'totalOrders', header: 'Deals Closed', align: 'center', render: (p) => `${p.wonOrders} / ${p.totalOrders}` },
        { key: 'contactsCount', header: 'Contacts', align: 'center', render: (p) => `${p.contactsCount}` },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader
                title="Partner Console"
                description="Monitor reseller/partner performance, MDF allocations, and lead referral pipelines"
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Intelligence', href: '/crm/intelligence' }, { label: 'Partner Management' }]}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Link href="/crm/intelligence">
                            <Button variant="outline" size="sm"><ArrowLeft size={14} style={{ marginRight: 6 }} /> Back</Button>
                        </Link>
                        <Button variant="primary" size="sm" onClick={() => setShowRegisterLead(true)}>
                            <Plus size={14} style={{ marginRight: 6 }} /> Register Partner Lead
                        </Button>
                    </div>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                <Card padding="md">
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>TOTAL RESELLER REVENUE</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '4px' }}>
                        ${totalRev.toLocaleString()}
                    </div>
                </Card>
                <Card padding="md">
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>TOTAL COMMISSION PAID</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '4px' }}>
                        ${totalCom.toLocaleString()}
                    </div>
                </Card>
                <Card padding="md">
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>ACTIVE PARTNERS</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--color-text)', marginTop: '4px' }}>
                        {partners.length} Accounts
                    </div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 'var(--space-6)', alignItems: 'start' }}>
                {/* Left: Partner Performance table */}
                <Card padding="none">
                    <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                        <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Partner Leaderboard</h4>
                    </div>
                    <DataTable columns={columns} data={partners} rowKey={(r) => r.partnerId} />
                </Card>

                {/* Right: MDF Details */}
                {mdfSummary && (
                    <Card padding="md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                            <Gift size={18} style={{ color: 'var(--color-warning)' }} />
                            <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Market Development Funds (MDF)</h4>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>PARTNER ACCOUNT</div>
                        <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>{mdfSummary.partnerName}</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>MDF Budget</span>
                                <span style={{ fontWeight: 'bold' }}>${mdfSummary.totalBudget?.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Utilized Funds</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>${mdfSummary.utilized?.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Remaining Funds</span>
                                <span style={{ fontWeight: 'bold' }}>${mdfSummary.remaining?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>RECENT MDF CLAIMS</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: '8px' }}>
                                {mdfSummary.claims?.map((claim: any) => (
                                    <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', fontSize: '11px' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{claim.name}</div>
                                            <div style={{ color: 'var(--color-text-tertiary)' }}>{claim.date}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                            <span style={{ fontWeight: 'bold' }}>${claim.amount.toLocaleString()}</span>
                                            <Badge variant={claim.status === 'APPROVED' || claim.status === 'PAID' ? 'success' : 'warning'}>{claim.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {showRegisterLead && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '520px', padding: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                            <h3 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Register Lead Referral</h3>
                            <button onClick={() => setShowRegisterLead(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleRegisterLead} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div>
                                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>REFERRING PARTNER</label>
                                <select value={registerForm.partnerId} onChange={e => setRegisterForm({ ...registerForm, partnerId: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', marginTop: '4px', outline: 'none' }}>
                                    {partners.map(p => (
                                        <option key={p.partnerId} value={p.partnerId}>{p.partnerName}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <input type="text" placeholder="First Name *" required value={registerForm.firstName} onChange={e => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                                    style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                                <input type="text" placeholder="Last Name *" required value={registerForm.lastName} onChange={e => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                                    style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                            </div>
                            <input type="text" placeholder="Company Name *" required value={registerForm.company} onChange={e => setRegisterForm({ ...registerForm, company: e.target.value })}
                                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                            <input type="email" placeholder="Email Address *" required value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                            <input type="text" placeholder="Phone Number" value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                            <textarea placeholder="Referral Notes (budget, timeline, requirements...)" value={registerForm.notes} onChange={e => setRegisterForm({ ...registerForm, notes: e.target.value })} rows={3}
                                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical', outline: 'none' }} />
                            <Button variant="primary" type="submit" disabled={submittingLead}>
                                {submittingLead ? 'Submitting referral...' : 'Submit Referral'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
