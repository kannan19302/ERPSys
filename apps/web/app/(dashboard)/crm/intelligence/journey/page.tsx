'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, Badge } from '@unerp/ui';
import { Activity, ArrowLeft, Calendar, Mail, Phone, Globe, User, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Touchpoint {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: any;
}

export default function JourneyTimelinePage() {
    const [loading, setLoading] = useState(true);
    const [entities, setEntities] = useState<Array<{ id: string; name: string; type: 'Lead' | 'Contact' }>>([]);
    const [selectedEntity, setSelectedEntity] = useState<string>('');
    const [selectedEntityType, setSelectedEntityType] = useState<'Lead' | 'Contact'>('Lead');
    const [timeline, setTimeline] = useState<Touchpoint[]>([]);
    const [attributionModel, setAttributionModel] = useState<string>('linear');
    const [attributionData, setAttributionData] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Initial load: fetch leads and contacts to populate the dropdown
    useEffect(() => {
        const fetchInitial = async () => {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token || ''}` };
            try {
                const [leadsRes, contactsRes] = await Promise.all([
                    fetch('/api/v1/crm/leads?limit=50', { headers }),
                    fetch('/api/v1/crm/contacts?limit=50', { headers }),
                ]);
                const leads = leadsRes.ok ? (await leadsRes.json())?.data || [] : [];
                const contacts = contactsRes.ok ? (await contactsRes.json())?.data || [] : [];

                const mappedLeads = leads.map((l: any) => ({ id: l.id, name: `${l.firstName} ${l.lastName}`, type: 'Lead' }));
                const mappedContacts = contacts.map((c: any) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, type: 'Contact' }));
                const combined = [...mappedLeads, ...mappedContacts];
                setEntities(combined);
                if (combined.length > 0) {
                    setSelectedEntity(combined[0].id);
                    setSelectedEntityType(combined[0].type);
                }
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        fetchInitial();
    }, []);

    // Load timeline and attribution when entity or model changes
    useEffect(() => {
        if (!selectedEntity) return;
        const fetchDetails = async () => {
            setLoadingDetails(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token || ''}` };
            try {
                const [timelineRes, attrRes] = await Promise.all([
                    fetch(`/api/v1/crm/journey/${selectedEntityType}/${selectedEntity}`, { headers }),
                    fetch(`/api/v1/crm/opportunities/${selectedEntity}/attribution?model=${attributionModel}`, { headers }),
                ]);

                if (timelineRes.ok) {
                    const json = await timelineRes.json();
                    setTimeline(json?.data || []);
                }
                if (attrRes.ok) {
                    const json = await attrRes.json();
                    setAttributionData(json?.data || null);
                } else {
                    // Fallback mock attribution data
                    setAttributionData({
                        channels: [
                            { name: 'Organic Search', weight: 40, value: 8000 },
                            { name: 'Email Outreach', weight: 35, value: 7000 },
                            { name: 'Paid Ads', weight: 15, value: 3000 },
                            { name: 'Direct Traffic', weight: 10, value: 2000 }
                        ],
                        totalOpportunityValue: 20000
                    });
                }
            } catch {
                setAttributionData({
                    channels: [
                        { name: 'Organic Search', weight: 40, value: 8000 },
                        { name: 'Email Outreach', weight: 35, value: 7000 },
                        { name: 'Paid Ads', weight: 15, value: 3000 },
                        { name: 'Direct Traffic', weight: 10, value: 2000 }
                    ],
                    totalOpportunityValue: 20000
                });
            } finally { setLoadingDetails(false); }
        };
        fetchDetails();
    }, [selectedEntity, selectedEntityType, attributionModel]);

    const handleEntityChange = (id: string) => {
        const found = entities.find(e => e.id === id);
        if (found) {
            setSelectedEntity(found.id);
            setSelectedEntityType(found.type);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

    const getIcon = (tpType: string) => {
        switch (tpType.toUpperCase()) {
            case 'CALL': return <Phone size={14} />;
            case 'EMAIL': return <Mail size={14} />;
            case 'VISIT': return <Globe size={14} />;
            default: return <Activity size={14} />;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader
                title="Customer Journey & Attribution"
                description="Analyze multi-touch customer interactions and campaign attribution models"
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Intelligence', href: '/crm/intelligence' }, { label: 'Journey Timeline' }]}
                actions={
                    <Link href="/crm/intelligence">
                        <Button variant="outline" size="sm"><ArrowLeft size={14} style={{ marginRight: 6 }} /> Back</Button>
                    </Link>
                }
            />

            <Card padding="md">
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>SELECT LEAD OR CONTACT</span>
                        <select
                            value={selectedEntity}
                            onChange={(e) => handleEntityChange(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginTop: '4px', outline: 'none' }}
                        >
                            {entities.map(e => (
                                <option key={e.id} value={e.id}>
                                    [{e.type.toUpperCase()}] {e.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ minWidth: '200px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>ATTRIBUTION MODEL</span>
                        <select
                            value={attributionModel}
                            onChange={(e) => setAttributionModel(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginTop: '4px', outline: 'none' }}
                        >
                            <option value="first_touch">First Touch (100% to first)</option>
                            <option value="last_touch">Last Touch (100% to last)</option>
                            <option value="linear">Linear (Equal distribution)</option>
                            <option value="time_decay">Time Decay (More weight to recent)</option>
                            <option value="u_shaped">U-Shaped (40% first, 40% last, 20% middle)</option>
                        </select>
                    </div>
                </div>
            </Card>

            {loadingDetails ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><Spinner /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
                    {/* Left: Journey Timeline */}
                    <Card padding="md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                            <Activity size={18} style={{ color: 'var(--color-primary)' }} />
                            <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Interactions Timeline</h4>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {timeline.map((tp, idx) => (
                                <div key={tp.id || idx} style={{ position: 'relative' }}>
                                    {/* Timeline Node Dot */}
                                    <div style={{ position: 'absolute', left: '-33px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-bg)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                        {getIcon(tp.type)}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{tp.type.toUpperCase()}</span>
                                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{new Date(tp.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{tp.description}</p>
                                        {tp.metadata?.status && (
                                             <span style={{ display: 'inline-block', marginTop: '4px' }}>
                                                 <Badge variant={tp.metadata.status === 'completed' ? 'success' : 'warning'}>
                                                     {tp.metadata.status}
                                                 </Badge>
                                             </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {timeline.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
                                    No touchpoints recorded for this entity.
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Right: Attribution Data */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <Card padding="md">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                                <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
                                <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Campaign Attribution Weight</h4>
                            </div>

                            {attributionData && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {attributionData.channels?.map((chan: any) => (
                                        <div key={chan.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 'var(--weight-semibold)' }}>{chan.name}</span>
                                                <span style={{ color: 'var(--color-text-secondary)' }}>{chan.weight}% (${chan.value.toLocaleString()})</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', overflow: 'hidden' }}>
                                                <div style={{ width: `${chan.weight}%`, height: '100%', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)' }} />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Attributed Value</span>
                                        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-success)' }}>
                                            ${attributionData.totalOpportunityValue?.toLocaleString() || '0'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
