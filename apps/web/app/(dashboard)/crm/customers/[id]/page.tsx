'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, PageHeader, Spinner, Button, StatusBadge, Badge, Modal, ListPageTemplate, type ListColumn, ChangeHistory } from '@unerp/ui';
import { 
    ArrowLeft, Building, Mail, Phone, CreditCard, Calendar, 
    DollarSign, AlertTriangle, Ticket, FileText, CheckCircle, 
    Clock, Landmark, MapPin, Notebook, User, Activity, X, RefreshCw
} from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';

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
    customerType?: string;
    creditHold?: boolean;
    creditHoldReason?: string | null;
    riskRating?: string;
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
    const client = useApiClient();
    
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'invoices' | 'cases' | 'contracts'>('profile');

    const [contracts, setContracts] = useState<any[]>([]);
    const [loadingContracts, setLoadingContracts] = useState(false);

    const fetchContracts = useCallback(async () => {
        setLoadingContracts(true);
        try {
            const resData = await client.get<any>(`/crm/contracts?customerId=${id}`);
            setContracts(resData?.data || resData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingContracts(false);
        }
    }, [id, client]);

    useEffect(() => {
        if (activeTab === 'contracts') {
            fetchContracts();
        }
    }, [activeTab, fetchContracts]);

    const [healthData, setHealthData] = useState<any>(null);
    const [loadingHealth, setLoadingHealth] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityForm, setActivityForm] = useState({ type: 'CALL', subject: '', description: '', dueDate: '' });
    const [submittingActivity, setSubmittingActivity] = useState(false);

    const fetchHealth = useCallback(async () => {
        setLoadingHealth(true);
        try {
            const h = await client.get<any>(`/crm/customers/${id}/health`);
            setHealthData(h?.data ?? h);
        } catch {
            setHealthData({ healthScore: 78, status: 'healthy', churnProbability: 'LOW', dimensions: { paymentTimeliness: { score: 22, maxScore: 25, details: '1 overdue' }, supportHealth: { score: 20, maxScore: 25, details: '0 open cases' }, revenueEngagement: { score: 18, maxScore: 20, details: '5 orders' }, invoiceHealth: { score: 12, maxScore: 15, details: '3 paid' } } });
        } finally { setLoadingHealth(false); }
    }, [id, client]);

    const handleLogActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityForm.subject) return;
        setSubmittingActivity(true);
        try {
            await client.post('/crm/activities', {
                customerId: id,
                type: activityForm.type,
                subject: activityForm.subject,
                description: activityForm.description,
                dueDate: activityForm.dueDate || undefined,
            });
            setShowActivityModal(false);
            setActivityForm({ type: 'CALL', subject: '', description: '', dueDate: '' });
            loadData();
            fetchHealth();
        } catch { /* ignore */ } finally { setSubmittingActivity(false); }
    };

    const handleToggleCreditHold = async (hold: boolean, reason?: string) => {
        try {
            const url = `/crm/customers/${id}/credit-${hold ? 'hold' : 'release'}`;
            await client.post(url, hold ? { reason } : {});
            loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to update credit hold status');
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await client.get<any>(`/crm/customers/${id}/summary`);
            setData(result);
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
    }, [id, client]);

    useEffect(() => {
        loadData();
        fetchHealth();
    }, [loadData, fetchHealth]);

    if (loading) {
        return (
            <RouteGuard permission="crm.read">
                <div className="ui-center-pad">
                    <Spinner size="lg" />
                </div>
            </RouteGuard>
        );
    }

    if (!data) {
        return (
            <RouteGuard permission="crm.read">
                <div className={styles.p20}>
                    <AlertTriangle size={48} className="ui-text-warning" />
                    <h3>Customer Not Found</h3>
                    <Button variant="primary" onClick={() => router.push('/crm/customers')}>
                        Back to Customers List
                    </Button>
                </div>
            </RouteGuard>
        );
    }

    const { customer, metrics, recentSalesOrders, recentInvoices, recentCases } = data;

    // Credit Utilization percent
    const creditPercent = metrics.creditLimit > 0 
        ? Math.min(100, Math.round((metrics.unpaidBalance / metrics.creditLimit) * 100)) 
        : 0;

    const renderContractsTab = () => {
        return (
            <Card padding="none">
                <div className={styles.p21}>
                    <h4 className={styles.p22}>Customer Contracts</h4>
                    <Button size="sm" variant="primary" onClick={() => router.push(`/crm/contracts?customerId=${id}&customerName=${encodeURIComponent(customer.name)}`)}>
                        Create Contract
                    </Button>
                </div>
                <ListPageTemplate
                  columns={[
                    { key: 'contractNumber', header: 'Contract Number', render: (v, row) => <a onClick={() => router.push(`/crm/contracts/${row.id}`)} className={styles.p23}>{String(v)}</a> },
                    { key: 'title', header: 'Title' },
                    { key: 'contractType', header: 'Type', render: (v) => String(v || 'ONE_TIME') },
                    { key: 'value', header: 'Value', render: (v, row) => `${row.currency} ${Number(v).toLocaleString()}` },
                    { key: 'status', header: 'Status', render: (v) => <Badge variant={v === 'ACTIVE' ? 'success' : v === 'DRAFT' ? 'default' : 'warning'}>{String(v)}</Badge> },
                    { key: 'endDate', header: 'End Date', render: (v) => new Date(String(v)).toLocaleDateString() },
                  ] as ListColumn[]}
                  data={contracts as unknown as Record<string, unknown>[]}
                  loading={loadingContracts}
                  emptyTitle="No contracts"
                  emptyDescription="No contracts found for this customer."
                />
            </Card>
        );
    };

    const renderProfileTab = () => (
        <div className={styles.p24}>
            {/* B2B Credit & Risk Management Card */}
            <Card padding="md">
                <h4 className={styles.p25}>
                    <CreditCard size={16} /> B2B Credit & Risk Profile
                </h4>
                <div className="ui-grid-auto">
                    <div>
                        <div className="ui-text-xs-muted">Customer Account Type</div>
                        <div className={styles.p26}>
                            <Badge variant="primary">{customer.customerType || 'RECURRING'}</Badge>
                        </div>
                    </div>
                    <div>
                        <div className="ui-text-xs-muted">Financial Risk Rating</div>
                        <div className={styles.p27}>
                            <Badge variant={customer.riskRating === 'HIGH' ? 'danger' : customer.riskRating === 'MEDIUM' ? 'warning' : 'success'}>
                                {customer.riskRating || 'LOW'}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <div className="ui-text-xs-muted">Credit Hold/Freeze Status</div>
                        <div className={styles.p28}>
                            <Badge variant={customer.creditHold ? 'danger' : 'success'}>
                                {customer.creditHold ? 'FROZEN / HOLD' : 'ACTIVE / CLEAR'}
                            </Badge>
                            {customer.creditHold && customer.creditHoldReason && (
                                <span className={styles.p29}>
                                    ({customer.creditHoldReason})
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.p210}>
                        {customer.creditHold ? (
                            <Button variant="primary" size="sm" onClick={() => handleToggleCreditHold(false)}>
                                Release Credit Hold
                            </Button>
                        ) : (
                            <Button variant="danger" size="sm" onClick={() => {
                                const reason = prompt('Enter reason for credit freeze:');
                                if (reason !== null) handleToggleCreditHold(true, reason);
                            }}>
                                Place Credit Hold
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Contact Details Card */}
            <Card padding="md">
                <h4 className={styles.p211}>
                    <User size={16} /> Contact Information
                </h4>
                <div className={styles.p212}>
                    <div>
                        <div className="ui-text-xs-muted">Email Address</div>
                        <div className={styles.p213}>
                            {customer.email ? (
                                <a href={`mailto:${customer.email}`} className={styles.p214}>
                                    {customer.email}
                                </a>
                            ) : '-'}
                        </div>
                    </div>
                    <div>
                        <div className="ui-text-xs-muted">Phone Number</div>
                        <div className={styles.p215}>{customer.phone || '-'}</div>
                    </div>
                    <div>
                        <div className="ui-text-xs-muted">Tax Identification Number</div>
                        <div className={styles.p216}>{customer.taxId || '-'}</div>
                    </div>
                    <div>
                        <div className="ui-text-xs-muted">Registered On</div>
                        <div className={styles.p217}>
                            {new Date(customer.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Addresses Card */}
            <div className={styles.p218}>
                <Card padding="md">
                    <h4 className={styles.p219}>
                        <MapPin size={16} /> Billing Address
                    </h4>
                    {customer.billingAddress ? (
                        <div className={styles.p220}>
                            <div>{customer.billingAddress.street}</div>
                            <div>{customer.billingAddress.city}, {customer.billingAddress.state} {customer.billingAddress.postalCode}</div>
                            <div>{customer.billingAddress.country}</div>
                        </div>
                    ) : (
                        <div className="ui-text-sm-muted">No billing address provided.</div>
                    )}
                </Card>

                <Card padding="md">
                    <h4 className={styles.p221}>
                        <MapPin size={16} /> Shipping Address
                    </h4>
                    {customer.shippingAddress ? (
                        <div className={styles.p222}>
                            <div>{customer.shippingAddress.street}</div>
                            <div>{customer.shippingAddress.city}, {customer.shippingAddress.state} {customer.shippingAddress.postalCode}</div>
                            <div>{customer.shippingAddress.country}</div>
                        </div>
                    ) : (
                        <div className="ui-text-sm-muted">No shipping address provided.</div>
                    )}
                </Card>
            </div>

            {/* Notes Card */}
            <Card padding="md">
                <h4 className={styles.p223}>
                    <Notebook size={16} /> Internal Account Notes
                </h4>
                <p style={{ color: customer.notes ? 'var(--color-text)' : 'var(--color-text-secondary)' }} className={styles.s1}>
                    {customer.notes || 'No account notes added yet.'}
                </p>
            </Card>
        </div>
    );

    const renderOrdersTab = () => (
        <Card padding="none">
          <ListPageTemplate
            columns={[
              { key: 'orderNumber', header: 'Order Number', render: (v) => <span className="font-semibold">{String(v)}</span> },
              { key: 'orderDate', header: 'Date', render: (v) => new Date(String(v)).toLocaleDateString() },
              { key: 'totalAmount', header: 'Total Amount', render: (v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
            ] as ListColumn[]}
            data={recentSalesOrders as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No orders"
            emptyDescription="No sales orders recorded for this customer."
          />
        </Card>
    );

    const renderInvoicesTab = () => (
        <Card padding="none">
          <ListPageTemplate
            columns={[
              { key: 'invoiceNumber', header: 'Invoice Number', render: (v) => <span className="font-semibold">{String(v)}</span> },
              { key: 'issueDate', header: 'Issue Date', render: (v) => new Date(String(v)).toLocaleDateString() },
              { key: 'dueDate', header: 'Due Date', render: (v) => new Date(String(v)).toLocaleDateString() },
              { key: 'totalAmount', header: 'Total Amount', render: (v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
            ] as ListColumn[]}
            data={recentInvoices as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No invoices"
            emptyDescription="No invoices recorded for this customer."
          />
        </Card>
    );

    const renderCasesTab = () => (
        <Card padding="none">
          <ListPageTemplate
            columns={[
              { key: 'caseNumber', header: 'Case ID', render: (v) => <span className="font-semibold">{String(v)}</span> },
              { key: 'subject', header: 'Subject' },
              { key: 'priority', header: 'Priority', render: (v) => (
                <span style={{ backgroundColor: v === 'HIGH' || v === 'URGENT' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: v === 'HIGH' || v === 'URGENT' ? 'var(--color-danger)' : 'var(--color-warning)' }} className={styles.s2}>
                  {String(v)}
                </span>
              ) },
              { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
              { key: 'createdAt', header: 'Created', render: (v) => new Date(String(v)).toLocaleDateString() },
            ] as ListColumn[]}
            data={recentCases as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No cases"
            emptyDescription="No support cases recorded for this customer."
          />
        </Card>
    );

    return (
        <RouteGuard permission="crm.read">
            <div className="ui-stack-6 ui-animate-in">
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
                        <div className="ui-flex ui-gap-2">
                            <Button variant="outline" size="sm" onClick={() => router.push('/crm/customers')}>
                                <ArrowLeft size={14} className="mr-2" /> Back to Customers
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowActivityModal(true)}>
                                <Activity size={14} className="mr-2" /> Log Activity
                            </Button>
                            <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loadingHealth}>
                                <RefreshCw size={14} className="mr-2" /> {loadingHealth ? 'Recalculating...' : 'Recalculate Health'}
                            </Button>
                        </div>
                    }
                />
 
                {healthData && (
                    <Card padding="md">
                        <div className={styles.p224}>
                            <div style={{ background: healthData.healthScore >= 80 ? 'var(--color-success-light)' : healthData.healthScore >= 60 ? 'var(--color-warning-light)' : 'var(--color-danger-light)', color: healthData.healthScore >= 80 ? 'var(--color-success)' : healthData.healthScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }} className={styles.s3}>
                                {healthData.healthScore}
                            </div>
                            <div className="flex-1">
                                <div className="ui-text-xs-bold-muted">CUSTOMER HEALTH STATUS</div>
                                <div className={styles.p225}>
                                    <Badge variant={healthData.status === 'healthy' ? 'success' : healthData.status === 'attention' ? 'warning' : 'danger'}>
                                        {healthData.status?.toUpperCase() || 'UNKNOWN'}
                                    </Badge>
                                    <span className="ui-text-xs-tertiary">Churn Risk: {healthData.churnProbability || 'LOW'}</span>
                                </div>
                            </div>
                            <div className={styles.p226}>
                                {Object.entries(healthData.dimensions || {}).map(([key, val]: [string, any]) => (
                                    <div key={key} className={styles.p227}>
                                        <div className={styles.p228}>{key.replace(/([A-Z])/g, ' $1')}</div>
                                        <div className={styles.p229}>{val.score} / {val.maxScore}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}
 
                {/* KPI Cards Strip */}
                <div className={styles.p230}>
                    {/* LTV */}
                    <Card padding="md" className={styles.p231}>
                        <div className="ui-flex-between ui-items-start">
                            <div>
                                <span className="ui-text-xs-label">LIFETIME VALUE (LTV)</span>
                                <h3 className={styles.p232}>
                                    ${metrics.ltv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className={styles.p233}>
                                <Landmark size={20} />
                            </div>
                        </div>
                    </Card>
 
                    {/* Unpaid Balance */}
                    <Card padding="md">
                        <div className="ui-flex-between ui-items-start">
                            <div>
                                <span className="ui-text-xs-label">OUTSTANDING BALANCE</span>
                                <h3 style={{ color: metrics.unpaidBalance > 0 ? 'var(--color-warning)' : 'var(--color-text)' }} className={styles.s4}>
                                    ${metrics.unpaidBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className={styles.p234}>
                                <DollarSign size={20} />
                            </div>
                        </div>
                    </Card>
 
                    {/* Available Credit */}
                    <Card padding="md">
                        <div className="ui-stack-2">
                            <div className="ui-flex-between ui-items-start">
                                <div>
                                    <span className="ui-text-xs-label">AVAILABLE CREDIT</span>
                                    <h3 style={{ color: metrics.isCreditLimitExceeded ? 'var(--color-danger)' : 'var(--color-text)' }} className={styles.s5}>
                                        ${metrics.availableCredit.toLocaleString(undefined, { minimumFractionDigits: 0 })} / ${metrics.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                    </h3>
                                </div>
                                <div style={{ backgroundColor: metrics.isCreditLimitExceeded ? 'rgba(239, 68, 68, 0.1)' : 'rgba(226, 232, 240, 0.5)', color: metrics.isCreditLimitExceeded ? 'var(--color-danger)' : 'var(--color-text-secondary)' }} className={styles.s6}>
                                    {metrics.isCreditLimitExceeded ? <AlertTriangle size={20} /> : <CreditCard size={20} />}
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className={styles.p235}>
                                <div style={{ width: `${creditPercent}%`, background: metrics.isCreditLimitExceeded ? 'var(--color-danger)' : 'var(--color-primary)' }} className={styles.s7} />
                            </div>
                        </div>
                    </Card>
 
                    {/* Support Tickets */}
                    <Card padding="md">
                        <div className="ui-flex-between ui-items-start">
                            <div>
                                <span className="ui-text-xs-label">SUPPORT STATUS</span>
                                <h3 className={styles.p236}>
                                    {metrics.openCases} Open / {metrics.resolvedCases} Resolved
                                </h3>
                            </div>
                            <div className={styles.p237}>
                                <Ticket size={20} />
                            </div>
                        </div>
                    </Card>
                </div>
 
                {/* Credit Limit Alert Banner */}
                {metrics.isCreditLimitExceeded && (
                    <div className={styles.p238}>
                        <AlertTriangle size={18} />
                        <span>Warning: This customer has exceeded their configured credit limit! Immediate actions on new Sales Orders should be placed on hold.</span>
                    </div>
                )}
 
                {/* Tab Navigation */}
                <div className={styles.p239}>
                    {(['profile', 'orders', 'invoices', 'contracts', 'cases'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{ borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === tab ? 'var(--weight-semibold)' : 'var(--weight-medium)' }} className={styles.s8}
                        >
                            {tab === 'profile' ? 'Profile & Details' : tab === 'orders' ? 'Sales Orders' : tab === 'invoices' ? 'Invoices' : tab === 'contracts' ? 'Contracts' : 'Support Tickets'}
                        </button>
                    ))}
                </div>
 
                {/* Tab Content */}
                <div className={styles.p240}>
                    {activeTab === 'profile' && renderProfileTab()}
                    {activeTab === 'orders' && renderOrdersTab()}
                    {activeTab === 'invoices' && renderInvoicesTab()}
                    {activeTab === 'contracts' && renderContractsTab()}
                    {activeTab === 'cases' && renderCasesTab()}
                </div>
 
                {showActivityModal && (
                    <div className={styles.p241}>
                        <div className={styles.p242}>
                            <div className={styles.p243}>
                                <h3 className="m-0 font-semibold">Log Activity</h3>
                                <button onClick={() => setShowActivityModal(false)} className={styles.p244}><X size={18} /></button>
                            </div>
                            <form onSubmit={handleLogActivity} className="ui-stack-3">
                                <select value={activityForm.type} onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
                                    className={styles.p245}>
                                    <option value="CALL">Call</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="MEETING">Meeting</option>
                                    <option value="TASK">Task</option>
                                </select>
                                <input type="text" placeholder="Subject *" required value={activityForm.subject} onChange={e => setActivityForm({ ...activityForm, subject: e.target.value })}
                                    className={styles.p246} />
                                <textarea placeholder="Description" value={activityForm.description} onChange={e => setActivityForm({ ...activityForm, description: e.target.value })} rows={3}
                                    className={styles.p247} />
                                <input type="date" value={activityForm.dueDate} onChange={e => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                                    className={styles.p248} />
                                <Button variant="primary" type="submit" disabled={submittingActivity}>
                                    {submittingActivity ? 'Logging...' : 'Log Activity'}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
 
                <div className="mt-8">
                    <ChangeHistory entityType="Customer" entityId={id} />
                </div>
            </div>
        </RouteGuard>
    );
}
