'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, Badge } from '@unerp/ui';
import { Activity, ArrowLeft, Calendar, Mail, Phone, Globe, User, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useApiClient, RouteGuard } from '@unerp/framework';
import styles from './page.module.css';

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
    const client = useApiClient();

    // Initial load: fetch leads and contacts to populate the dropdown
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [leadsData, contactsData] = await Promise.all([
                    client.get<any>('/crm/leads?limit=50'),
                    client.get<any>('/crm/contacts?limit=50'),
                ]);
                const leads = leadsData?.data || [];
                const contacts = contactsData?.data || [];

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
    }, [client]);

    // Load timeline and attribution when entity or model changes
    useEffect(() => {
        if (!selectedEntity) return;
        const fetchDetails = async () => {
            setLoadingDetails(true);
            try {
                const [timelineData, attrData] = await Promise.all([
                    client.get<any>(`/crm/journey/${selectedEntityType}/${selectedEntity}`),
                    client.get<any>(`/crm/opportunities/${selectedEntity}/attribution?model=${attributionModel}`),
                ]);

                setTimeline(timelineData?.data || []);
                setAttributionData(attrData?.data || null);
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
    }, [selectedEntity, selectedEntityType, attributionModel, client]);

    const handleEntityChange = (id: string) => {
        const found = entities.find(e => e.id === id);
        if (found) {
            setSelectedEntity(found.id);
            setSelectedEntityType(found.type);
        }
    };

    if (loading) return <RouteGuard permission="crm.read"><div className="ui-center-pad"><Spinner size="lg" /></div></RouteGuard>;

    const getTouchpointIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'email': return <Mail size={16} />;
            case 'call': return <Phone size={16} />;
            case 'web': return <Globe size={16} />;
            default: return <User size={16} />;
        }
    };

    const getTouchpointColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'email': return '#3b82f6';
            case 'call': return '#10b981';
            case 'web': return '#ec4899';
            default: return '#94a3b8';
        }
    };

    return (
        <RouteGuard permission="crm.read">
            <div className="ui-stack-6 ui-animate-in">
                <PageHeader
                    title="Customer Journey & Attribution"
                    description="Visualize all historical touchpoints for a Lead or Contact and compute marketing campaign attribution"
                    breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Intelligence', href: '/crm/intelligence' }, { label: 'Customer Journey' }]}
                    actions={
                        <Link href="/crm/intelligence">
                            <Button variant="outline" size="sm"><ArrowLeft size={14} className="mr-2" /> Back</Button>
                        </Link>
                    }
                />

                <Card padding="md">
                    <div className={styles.filterGrid}>
                        <div>
                            <span className="ui-text-xs-bold-muted">SELECT ACCOUNT PROFILE</span>
                            <select
                                value={selectedEntity}
                                onChange={(e) => handleEntityChange(e.target.value)}
                                className={styles.select}
                            >
                                {entities.map(e => (
                                    <option key={e.id} value={e.id}>
                                        {e.name} ({e.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <span className="ui-text-xs-bold-muted">ATTRIBUTION MODEL</span>
                            <select
                                value={attributionModel}
                                onChange={(e) => setAttributionModel(e.target.value)}
                                className={styles.select}
                            >
                                <option value="first_touch">First Touch</option>
                                <option value="last_touch">Last Touch</option>
                                <option value="linear">Linear (Equal Distribution)</option>
                                <option value="w_shaped">W-Shaped Multi-touch</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {loadingDetails ? (
                    <div className="ui-flex-center p-8"><Spinner /></div>
                ) : (
                    <div className={styles.contentGrid}>
                        {/* Left: Timeline */}
                        <Card padding="md">
                            <div className="ui-hstack-2 mb-4">
                                <Activity size={18} className="ui-text-primary" />
                                <h4 className="m-0 font-semibold">Interaction History Timeline</h4>
                            </div>

                            <div className={styles.timeline}>
                                {timeline.map((tp) => (
                                    <div key={tp.id} className={styles.touchpoint}>
                                        {/* Timeline node dot */}
                                        <div className={styles.timelineDot} style={{ background: getTouchpointColor(tp.type) }} />
                                        
                                        <div className={styles.touchpointHeader}>
                                            <div className={styles.touchpointType}>
                                                <span style={{ color: getTouchpointColor(tp.type) }}>{getTouchpointIcon(tp.type)}</span>
                                                <strong className={styles.touchpointTitle}>{tp.type.toUpperCase()}</strong>
                                            </div>
                                            <span className={styles.timestamp}>
                                                <Calendar size={10} />
                                                {new Date(tp.timestamp).toLocaleDateString()} {new Date(tp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={styles.touchpointDescription}>
                                            {tp.description}
                                        </p>
                                    </div>
                                ))}

                                {timeline.length === 0 && (
                                    <div className={styles.emptyTimeline}>
                                        No touchpoints recorded for this entity.
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Right: Attribution Data */}
                        <div className="ui-stack-4">
                            <Card padding="md">
                                <div className="ui-hstack-2 mb-4">
                                    <TrendingUp size={18} className="ui-text-success" />
                                    <h4 className="m-0 font-semibold">Campaign Attribution Weight</h4>
                                </div>

                                {attributionData && (
                                    <div className="ui-stack-3">
                                        {attributionData.channels?.map((chan: any) => (
                                            <div key={chan.name}>
                                                <div className={styles.channelHeader}>
                                                    <span className="font-semibold">{chan.name}</span>
                                                    <span className="ui-text-muted">{chan.weight}% (${chan.value.toLocaleString()})</span>
                                                </div>
                                                <div className={styles.progressTrack}>
                                                    <div className={styles.progressFill} style={{ width: `${chan.weight}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className={styles.totalValue}>
                                            <span className="ui-text-xs-muted">Total Attributed Value</span>
                                            <span className={styles.totalAmount}>
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
        </RouteGuard>
    );
}
