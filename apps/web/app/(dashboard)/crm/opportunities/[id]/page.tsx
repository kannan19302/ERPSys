'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, PageHeader, StatusBadge, Spinner, Button, Badge } from '@unerp/ui';
import { Calendar, ArrowLeft, Activity, CheckCircle, Plus, Trash2, Package, X } from 'lucide-react';
import Link from 'next/link';

interface LineItem {
    id: string; productId: string | null; description: string; quantity: number;
    unitPrice: number; discount: number; totalAmount: number;
    product?: { id: string; name: string; sku: string } | null;
}

interface OpportunityDetail {
    id: string; name: string; stage: string; amount: number | null; probability: number;
    expectedCloseDate: string | null; actualCloseDate: string | null; competitor: string | null;
    lossReason: string | null; notes: string | null; createdAt: string;
    currency?: string; weightedAmount?: number | null;
    customer?: { id: string; name: string } | null;
    lead?: { id: string; firstName: string; lastName: string } | null;
    pipeline?: { id: string; name: string; stages: unknown } | null;
    activities?: Array<{ id: string; type: string; subject: string; description: string | null; createdAt: string }>;
    lineItems?: LineItem[];
}

const STAGE_LABELS: Record<string, string> = {
    PROSPECTING: 'Prospecting', QUALIFICATION: 'Qualification', PROPOSAL: 'Proposal',
    NEGOTIATION: 'Negotiation', CLOSED_WON: 'Closed Won', CLOSED_LOST: 'Closed Lost'
};
const STAGE_ORDER = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

export default function OpportunityDetailPage() {
    const params = useParams();
    const [opp, setOpp] = useState<OpportunityDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'lineItems'>('details');
    const [showAddItem, setShowAddItem] = useState(false);
    const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unitPrice: 0, discount: 0, productId: '' });
    const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string; sellPrice: number }>>([]);

    useEffect(() => {
        const fetchOpp = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/v1/crm/opportunities/${params.id}`, { headers: { Authorization: `Bearer ${token || ''}` } });
                if (res.ok) setOpp(await res.json());
                else throw new Error();
            } catch {
                setOpp({
                    id: params.id as string, name: 'Arc Reactor Supply Deal', stage: 'PROPOSAL', amount: 50000, probability: 60,
                    expectedCloseDate: '2026-08-15', actualCloseDate: null, competitor: 'Hammer Industries', lossReason: null,
                    notes: 'Tony is interested in a 3-year supply contract. Need to finalize pricing.', createdAt: new Date().toISOString(),
                    customer: { id: 'c1', name: 'Stark Industries' },
                    pipeline: { id: 'p1', name: 'Default', stages: [] },
                    activities: [
                        { id: 'a1', type: 'CALL', subject: 'Discussed pricing', description: 'Shared revised pricing sheet', createdAt: new Date().toISOString() },
                        { id: 'a2', type: 'EMAIL', subject: 'Sent proposal v2', description: 'Updated proposal with volume discounts', createdAt: new Date(Date.now() - 86400000).toISOString() },
                    ],
                });
            } finally { setLoading(false); }
        };
        fetchOpp();
    }, [params.id]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/v1/crm/products', { headers: { Authorization: `Bearer ${token || ''}` } });
                if (res.ok) setProducts(await res.json());
            } catch { /* fallback */ }
        };
        fetchProducts();
    }, []);

    const handleAddLineItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/v1/crm/opportunities/${params.id}/line-items`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({ ...itemForm, quantity: Number(itemForm.quantity), unitPrice: Number(itemForm.unitPrice), discount: Number(itemForm.discount), productId: itemForm.productId || undefined }),
            });
            if (res.ok) {
                setShowAddItem(false);
                setItemForm({ description: '', quantity: 1, unitPrice: 0, discount: 0, productId: '' });
                window.location.reload();
            }
        } catch { /* fallback */ }
    };

    const handleDeleteLineItem = async (itemId: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/v1/crm/opportunities/${params.id}/line-items/${itemId}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` },
            });
            if (opp) setOpp({ ...opp, lineItems: (opp.lineItems || []).filter((i) => i.id !== itemId) });
        } catch { /* fallback */ }
    };

    const handleStageChange = async (newStage: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/v1/crm/opportunities/${params.id}/stage`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({ stage: newStage, probability: newStage === 'CLOSED_WON' ? 100 : newStage === 'CLOSED_LOST' ? 0 : undefined }),
            });
            if (res.ok) window.location.reload();
        } catch { /* demo */ }
        if (opp) setOpp({ ...opp, stage: newStage });
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
    if (!opp) return <div>Opportunity not found</div>;

    const currentStageIdx = STAGE_ORDER.indexOf(opp.stage);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader title={opp.name} description={opp.customer?.name || 'No customer'}
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Opportunities', href: '/crm/opportunities' }, { label: opp.name }]}
                actions={<Link href="/crm/opportunities"><Button variant="outline" size="sm"><ArrowLeft size={14} /> Back</Button></Link>}
            />

            {/* Pipeline Progress Bar */}
            <Card padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    {STAGE_ORDER.filter(s => s !== 'CLOSED_LOST').map((stage, idx) => (
                        <div key={stage} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto',
                                background: idx <= currentStageIdx ? 'var(--color-primary)' : 'var(--color-bg-sunken)',
                                color: idx <= currentStageIdx ? 'white' : 'var(--color-text-tertiary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)'
                            }}>{idx + 1}</div>
                            <span style={{ fontSize: '9px', marginTop: 'var(--space-1)', display: 'block', color: idx <= currentStageIdx ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: idx === currentStageIdx ? 'var(--weight-bold)' : 'var(--weight-normal)' }}>
                                {STAGE_LABELS[stage]}
                            </span>
                        </div>
                    ))}
                </div>
                {!['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage) && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
                        {STAGE_ORDER.filter(s => s !== opp.stage && s !== 'CLOSED_LOST').slice(0, 2).map(s => (
                            <Button key={s} variant="outline" size="sm" onClick={() => handleStageChange(s)}>Move to {STAGE_LABELS[s]}</Button>
                        ))}
                        {opp.stage !== 'CLOSED_LOST' && <Button variant="danger" size="sm" onClick={() => handleStageChange('CLOSED_LOST')}>Mark Lost</Button>}
                    </div>
                )}
            </Card>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--color-border)' }}>
                {(['details', 'lineItems'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: activeTab === tab ? 'var(--weight-bold)' : 'var(--weight-normal)',
                        color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)', background: 'none',
                        borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: '-2px',
                    }}>
                        {tab === 'details' ? 'Deal Details' : `Line Items (${opp.lineItems?.length || 0})`}
                    </button>
                ))}
            </div>

            {activeTab === 'lineItems' && (
                <Card padding="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                        <h4 style={{ margin: 0 }}>Products & Line Items</h4>
                        <Button variant="primary" size="sm" onClick={() => setShowAddItem(true)}><Plus size={14} /> Add Item</Button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg-sunken)' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Product</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Description</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Qty</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Unit Price</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Discount</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Total</th>
                                <th style={{ padding: '10px 12px', width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(opp.lineItems || []).map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '10px 12px' }}>
                                        {item.product ? <span><Package size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{item.product.name}</span> : <span style={{ color: 'var(--color-text-muted)' }}>Custom</span>}
                                    </td>
                                    <td style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{item.description}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(item.quantity)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>${Number(item.unitPrice).toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(item.discount)}%</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>${Number(item.totalAmount).toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <button onClick={() => handleDeleteLineItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(opp.lineItems || []).length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-3)', borderTop: '2px solid var(--color-border)', marginTop: 'var(--space-2)' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Deal Total</div>
                                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>${(opp.lineItems || []).reduce((s, i) => s + Number(i.totalAmount), 0).toLocaleString()}</div>
                                {opp.weightedAmount != null && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Weighted: ${Number(opp.weightedAmount).toLocaleString()}</div>}
                            </div>
                        </div>
                    )}
                    {(opp.lineItems || []).length === 0 && <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>No line items yet. Add products to this deal.</div>}
                </Card>
            )}

            {/* Add Line Item Modal */}
            {showAddItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                            <h3 style={{ margin: 0 }}>Add Line Item</h3>
                            <button onClick={() => setShowAddItem(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddLineItem} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', marginBottom: 4 }}>Product (optional)</label>
                                <select value={itemForm.productId} onChange={(e) => {
                                    const p = products.find((pr) => pr.id === e.target.value);
                                    setItemForm({ ...itemForm, productId: e.target.value, description: p ? p.name : itemForm.description, unitPrice: p ? p.sellPrice : itemForm.unitPrice });
                                }} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                                    <option value="">Custom item</option>
                                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - ${p.sellPrice}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', marginBottom: 4 }}>Description *</label>
                                <input required value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', marginBottom: 4 }}>Quantity *</label>
                                    <input type="number" required min={1} value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', marginBottom: 4 }}>Unit Price *</label>
                                    <input type="number" required min={0} step={0.01} value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', marginBottom: 4 }}>Discount %</label>
                                    <input type="number" min={0} max={100} value={itemForm.discount} onChange={(e) => setItemForm({ ...itemForm, discount: Number(e.target.value) })} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                                </div>
                            </div>
                            <div style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Estimated Total: </span>
                                <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>${(itemForm.quantity * itemForm.unitPrice * (1 - itemForm.discount / 100)).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                                <Button variant="outline" size="sm" onClick={() => setShowAddItem(false)}>Cancel</Button>
                                <Button variant="primary" size="sm" type="submit">Add Item</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'details' && <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {/* Deal Info */}
                    <Card padding="md">
                        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)' }}>Deal Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Amount</span><p style={{ margin: 'var(--space-1) 0', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>{opp.amount ? `$${opp.amount.toLocaleString()}` : '-'}</p></div>
                            <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Probability</span><p style={{ margin: 'var(--space-1) 0' }}>{opp.probability}%</p></div>
                            {opp.expectedCloseDate && <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Expected Close</span><p style={{ margin: 'var(--space-1) 0' }}><Calendar size={14} style={{ marginRight: '4px' }} />{new Date(opp.expectedCloseDate).toLocaleDateString()}</p></div>}
                            {opp.competitor && <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Competitor</span><p style={{ margin: 'var(--space-1) 0' }}>{opp.competitor}</p></div>}
                            {opp.lossReason && <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loss Reason</span><p style={{ margin: 'var(--space-1) 0', color: 'var(--color-danger)' }}>{opp.lossReason}</p></div>}
                        </div>
                    </Card>

                    {/* Activity Timeline */}
                    <Card padding="md">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                            <h4 style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Activity Timeline</h4>
                            <Link href="/crm/activities"><Button variant="outline" size="sm"><Activity size={14} /> Log Activity</Button></Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {(opp.activities || []).map(a => (
                                <div key={a.id} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}><StatusBadge status={a.type} /> {a.subject}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {a.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0' }}>{a.description}</p>}
                                </div>
                            ))}
                            {(!opp.activities || opp.activities.length === 0) && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>No activities recorded</p>}
                        </div>
                    </Card>

                    {opp.notes && (
                        <Card padding="md">
                            <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-sm)' }}>Notes</h4>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{opp.notes}</p>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <Card padding="md">
                        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)' }}>Stage Details</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Current Stage</span><StatusBadge status={STAGE_LABELS[opp.stage] || opp.stage} /></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Pipeline</span><span>{opp.pipeline?.name || 'Default'}</span></div>
                            {opp.customer && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Customer</span><Link href="/crm/customers" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{opp.customer.name}</Link></div>}
                            {opp.lead && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Lead Source</span><Link href={`/crm/leads/${opp.lead.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{opp.lead.firstName} {opp.lead.lastName}</Link></div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Created</span><span>{new Date(opp.createdAt).toLocaleDateString()}</span></div>
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card padding="md">
                        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)' }}>Quick Actions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {opp.stage === 'NEGOTIATION' && <Button variant="primary" size="sm" onClick={() => handleStageChange('CLOSED_WON')}><CheckCircle size={14} /> Close Won</Button>}
                            {opp.stage !== 'CLOSED_WON' && opp.stage !== 'CLOSED_LOST' && <Button variant="danger" size="sm" onClick={() => handleStageChange('CLOSED_LOST')}>Close Lost</Button>}
                        </div>
                    </Card>
                </div>
            </div>}
        </div>
    );
}