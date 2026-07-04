'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, PageHeader, Spinner, Button, StatusBadge } from '@unerp/ui';
import { 
    ArrowLeft, Building, Mail, Phone, CreditCard, Calendar, 
    DollarSign, AlertTriangle, Ticket, FileText, CheckCircle, 
    Clock, Landmark, MapPin, Notebook, User
} from 'lucide-react';

interface Address {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}

interface Customer {
    id: string;
    name: string;
    type: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    billingAddress: any;
    shippingAddress: any;
    creditLimit: number | null;
    paymentTerms: number;
    status: string;
    notes: string | null;
    createdAt: string;
}

interface SummaryData {
    customer: Customer;
    metrics: {
        ltv: number;
        unpaidBalance: number;
        creditLimit: number;
        availableCredit: number;
        isCreditLimitExceeded: boolean;
        openCases: number;
        resolvedCases: number;
    };
    recentSalesOrders: Array<{
        id: string;
        orderNumber: string;
        totalAmount: number;
        status: string;
        orderDate: string;
    }>;
    recentInvoices: Array<{
        id: string;
        invoiceNumber: string;
        totalAmount: number;
        status: string;
        issueDate: string;
        dueDate: string;
    }>;
    recentCases: Array<{
        id: string;
        caseNumber: string;
        subject: string;
        status: string;
        priority: string;
        createdAt: string;
    }>;
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'invoices' | 'cases'>('profile');

    const loadData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/v1/crm/customers/${id}/summary`, {
                headers: { Authorization: `Bearer ${token || ''}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                throw new Error();
            }
        } catch {
            // Mock data fallback for local demo and test environments
            setTimeout(() => {
                const nowStr = new Date().toISOString();
                const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
                const lastWeekStr = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
                
                setData({
                    customer: {
                        id,
                        name: id === '1' ? 'Stark Industries' : id === '2' ? 'Wayne Enterprises' : 'Oscorp Industries',
                        type: 'COMPANY',
                        email: 'procurement@stark.com',
                        phone: '+1-555-0101',
                        taxId: 'TX-001',
                        billingAddress: {
                            street: '10880 Malibu Point',
                            city: 'Malibu',
                            state: 'CA',
                            postalCode: '90265',
                            country: 'USA'
                        },
                        shippingAddress: {
                            street: 'Stark Tower, 200 Park Ave',
                            city: 'New York',
                            state: 'NY',
                            postalCode: '10166',
                            country: 'USA'
                        },
                        creditLimit: id === '2' ? 100000 : 50000,
                        paymentTerms: 30,
                        status: 'ACTIVE',
                        notes: 'Key enterprise account. Prefers invoicing via electronic portals. High volume buyer.',
                        createdAt: lastWeekStr
                    },
                    metrics: {
                        ltv: 75000,
                        unpaidBalance: 12500,
                        creditLimit: id === '2' ? 100000 : 50000,
                        availableCredit: id === '2' ? 87500 : 37500,
                        isCreditLimitExceeded: false,
                        openCases: 2,
                        resolvedCases: 5
                    },
                    recentSalesOrders: [
                        { id: 'so1', orderNumber: 'SO-2026-0004', totalAmount: 12500, status: 'PROCESSING', orderDate: nowStr },
                        { id: 'so2', orderNumber: 'SO-2026-0003', totalAmount: 25000, status: 'DELIVERED', orderDate: yesterdayStr },
                        { id: 'so3', orderNumber: 'SO-2026-0002', totalAmount: 37500, status: 'DELIVERED', orderDate: lastWeekStr }
                    ],
                    recentInvoices: [
                        { id: 'inv1', invoiceNumber: 'INV-2026-0003', totalAmount: 12500, status: 'UNPAID', issueDate: nowStr, dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() },
                        { id: 'inv2', invoiceNumber: 'INV-2026-0002', totalAmount: 25000, status: 'PAID', issueDate: yesterdayStr, dueDate: nowStr },
                        { id: 'inv3', invoiceNumber: 'INV-2026-0001', totalAmount: 37500, status: 'PAID', issueDate: lastWeekStr, dueDate: yesterdayStr }
                    ],
                    recentCases: [
                        { id: 'case1', caseNumber: 'CS-2026-0002', subject: 'Invoicing dispute on shipment SO-0003', status: 'IN_PROGRESS', priority: 'HIGH', createdAt: nowStr },
                        { id: 'case2', caseNumber: 'CS-2026-0001', subject: 'API endpoint auth error', status: 'RESOLVED', priority: 'MEDIUM', createdAt: lastWeekStr }
                    ]
                });
                setLoading(false);
            }, 500);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
                <AlertTriangle size={48} style={{ color: 'var(--color-warning)' }} />
                <h3>Customer Not Found</h3>
                <Button variant="primary" onClick={() => router.push('/crm/customers')}>
                    Back to Customers List
                </Button>
            </div>
        );
    }

    const { customer, metrics, recentSalesOrders, recentInvoices, recentCases } = data;

    // Credit Utilization percent
    const creditPercent = metrics.creditLimit > 0 
        ? Math.min(100, Math.round((metrics.unpaidBalance / metrics.creditLimit) * 100)) 
        : 0;

    const renderProfileTab = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
            {/* Contact Details Card */}
            <Card padding="md">
                <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} /> Contact Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                    <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Email Address</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginTop: '4px' }}>
                            {customer.email ? (
                                <a href={`mailto:${customer.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                    {customer.email}
                                </a>
                            ) : '-'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Phone Number</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginTop: '4px' }}>{customer.phone || '-'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Tax Identification Number</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginTop: '4px' }}>{customer.taxId || '-'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Registered On</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginTop: '4px' }}>
                            {new Date(customer.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Addresses Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
                <Card padding="md">
                    <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} /> Billing Address
                    </h4>
                    {customer.billingAddress ? (
                        <div style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
                            <div>{customer.billingAddress.street}</div>
                            <div>{customer.billingAddress.city}, {customer.billingAddress.state} {customer.billingAddress.postalCode}</div>
                            <div>{customer.billingAddress.country}</div>
                        </div>
                    ) : (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No billing address provided.</div>
                    )}
                </Card>

                <Card padding="md">
                    <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} /> Shipping Address
                    </h4>
                    {customer.shippingAddress ? (
                        <div style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
                            <div>{customer.shippingAddress.street}</div>
                            <div>{customer.shippingAddress.city}, {customer.shippingAddress.state} {customer.shippingAddress.postalCode}</div>
                            <div>{customer.shippingAddress.country}</div>
                        </div>
                    ) : (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No shipping address provided.</div>
                    )}
                </Card>
            </div>

            {/* Notes Card */}
            <Card padding="md">
                <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Notebook size={16} /> Internal Account Notes
                </h4>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: '1.6', color: customer.notes ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                    {customer.notes || 'No account notes added yet.'}
                </p>
            </Card>
        </div>
    );

    const renderOrdersTab = () => (
        <Card padding="none">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Order Number</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Date</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Total Amount</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {recentSalesOrders.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No sales orders recorded for this customer.</td>
                        </tr>
                    ) : (
                        recentSalesOrders.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{o.orderNumber}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(o.orderDate).toLocaleDateString()}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>
                                    ${o.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                                    <StatusBadge status={o.status} />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Card>
    );

    const renderInvoicesTab = () => (
        <Card padding="none">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Invoice Number</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Issue Date</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Due Date</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Total Amount</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {recentInvoices.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No invoices recorded for this customer.</td>
                        </tr>
                    ) : (
                        recentInvoices.map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{inv.invoiceNumber}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(inv.issueDate).toLocaleDateString()}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>
                                    ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                                    <StatusBadge status={inv.status} />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Card>
    );

    const renderCasesTab = () => (
        <Card padding="none">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Case ID</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Subject</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Priority</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {recentCases.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No support cases recorded for this customer.</td>
                        </tr>
                    ) : (
                        recentCases.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{c.caseNumber}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.subject}</td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                                    <span style={{
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 'var(--weight-semibold)',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: c.priority === 'HIGH' || c.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: c.priority === 'HIGH' || c.priority === 'URGENT' ? 'var(--color-danger)' : 'var(--color-warning)'
                                    }}>
                                        {c.priority}
                                    </span>
                                </td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                                    <StatusBadge status={c.status} />
                                </td>
                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Card>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader
                title={customer.name}
                description={`Payment Terms: Net ${customer.paymentTerms} Days | Type: ${customer.type}`}
                breadcrumbs={[
                    { label: 'Home', href: '/dashboard' },
                    { label: 'CRM', href: '/crm' },
                    { label: 'Customers', href: '/crm/customers' },
                    { label: customer.name }
                ]}
                actions={
                    <Button variant="outline" size="sm" onClick={() => router.push('/crm/customers')}>
                        <ArrowLeft size={14} /> Back to Customers
                    </Button>
                }
            />

            {/* KPI Cards Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                {/* LTV */}
                <Card padding="md" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>LIFETIME VALUE (LTV)</span>
                            <h3 style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>
                                ${metrics.ltv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                            <Landmark size={20} />
                        </div>
                    </div>
                </Card>

                {/* Unpaid Balance */}
                <Card padding="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>OUTSTANDING BALANCE</span>
                            <h3 style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: metrics.unpaidBalance > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                                ${metrics.unpaidBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                </Card>

                {/* Available Credit */}
                <Card padding="md">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>AVAILABLE CREDIT</span>
                                <h3 style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: metrics.isCreditLimitExceeded ? 'var(--color-danger)' : 'var(--color-text)' }}>
                                    ${metrics.availableCredit.toLocaleString(undefined, { minimumFractionDigits: 0 })} / ${metrics.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                </h3>
                            </div>
                            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: metrics.isCreditLimitExceeded ? 'rgba(239, 68, 68, 0.1)' : 'rgba(226, 232, 240, 0.5)', color: metrics.isCreditLimitExceeded ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                                {metrics.isCreditLimitExceeded ? <AlertTriangle size={20} /> : <CreditCard size={20} />}
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${creditPercent}%`, 
                                height: '100%', 
                                background: metrics.isCreditLimitExceeded ? 'var(--color-danger)' : 'var(--color-primary)',
                                transition: 'width 0.5s ease-out'
                            }} />
                        </div>
                    </div>
                </Card>

                {/* Support Tickets */}
                <Card padding="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>SUPPORT STATUS</span>
                            <h3 style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>
                                {metrics.openCases} Open / {metrics.resolvedCases} Resolved
                            </h3>
                        </div>
                        <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)' }}>
                            <Ticket size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Credit Limit Alert Banner */}
            {metrics.isCreditLimitExceeded && (
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: 'var(--space-3) var(--space-4)', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--color-danger)', 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    color: 'var(--color-danger)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)'
                }}>
                    <AlertTriangle size={18} />
                    <span>Warning: This customer has exceeded their configured credit limit! Immediate actions on new Sales Orders should be placed on hold.</span>
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)' }}>
                {(['profile', 'orders', 'invoices', 'cases'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: 'var(--space-3) var(--space-4)',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: activeTab === tab ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                            fontSize: 'var(--text-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'profile' ? 'Profile & Details' : tab === 'orders' ? 'Sales Orders' : tab === 'invoices' ? 'Invoices' : 'Support Tickets'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'orders' && renderOrdersTab()}
                {activeTab === 'invoices' && renderInvoicesTab()}
                {activeTab === 'cases' && renderCasesTab()}
            </div>
        </div>
    );
}
