'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge, DashboardKPICard } from '@unerp/ui';
import { Brain, TrendingUp, Users, Target, Heart, DollarSign, BarChart3, Activity, ArrowRight, Zap, Shield, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useApiClient, RouteGuard } from '@unerp/framework';
import styles from './page.module.css';

export default function CrmIntelligencePage() {
    const [loading, setLoading] = useState(true);
    const [dealVelocity, setDealVelocity] = useState<any>(null);
    const [atRiskCount, setAtRiskCount] = useState(0);
    const [mlModels, setMlModels] = useState<any[]>([]);
    const client = useApiClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [velData, riskData, mlData] = await Promise.all([
                    client.get<any>('/crm/analytics/deal-velocity'),
                    client.get<any>('/crm/customers/at-risk?threshold=60'),
                    client.get<any>('/crm/ml-models'),
                ]);
                setDealVelocity(velData?.data ?? velData);
                setAtRiskCount(Array.isArray(riskData?.data ?? riskData) ? (riskData?.data ?? riskData).length : 0);
                setMlModels(Array.isArray(mlData?.data ?? mlData) ? (mlData?.data ?? mlData) : []);
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        fetchData();
    }, [client]);

    if (loading) return <RouteGuard permission="crm.read"><div className="ui-page"><Spinner /></div></RouteGuard>;

    const stagnatingCount = dealVelocity?.stagnatingDeals?.length || 0;
    const modelCount = mlModels.length;

    const cards = [
        { title: 'ML Models', value: modelCount, icon: Brain, color: '#8b5cf6', href: '/crm/intelligence/lead-scoring', desc: 'Trained lead scoring models' },
        { title: 'At-Risk Customers', value: atRiskCount, icon: Heart, color: '#ef4444', href: '/crm/intelligence/health', desc: 'Customers needing attention' },
        { title: 'Stagnating Deals', value: stagnatingCount, icon: Activity, color: '#f59e0b', href: '/crm/intelligence/deal-velocity', desc: 'Deals exceeding avg stage duration' },
        { title: 'Partners', value: 'View', icon: Users, color: '#10b981', href: '/crm/intelligence/partners', desc: 'Partner performance dashboard' },
    ];

    const features = [
        { name: 'Predictive Lead Scoring', desc: 'ML-powered lead scoring with explainability', icon: Zap, href: '/crm/intelligence/lead-scoring', color: '#8b5cf6' },
        { name: 'Customer Journey', desc: 'Multi-touch attribution & timeline', icon: Activity, href: '/crm/intelligence/journey', color: '#3b82f6' },
        { name: 'Sentiment Analysis', desc: 'Conversation intelligence & deal health', icon: MessageSquare, href: '/crm/intelligence/sentiment', color: '#06b6d4' },
        { name: 'Customer Health', desc: 'Churn prediction & at-risk alerts', icon: Heart, href: '/crm/intelligence/health', color: '#ef4444' },
        { name: 'Deal Velocity', desc: 'Stage duration analysis & bottlenecks', icon: TrendingUp, href: '/crm/intelligence/deal-velocity', color: '#f59e0b' },
        { name: 'CLV Analytics', desc: 'Customer lifetime value & tiering', icon: DollarSign, href: '/crm/intelligence/clv', color: '#10b981' },
        { name: 'Partner Management', desc: 'Partner performance & MDF tracking', icon: Users, href: '/crm/intelligence/partners', color: '#6366f1' },
        { name: 'Campaign Intelligence', desc: 'Email analytics & A/B testing', icon: BarChart3, href: '/crm/intelligence/campaigns', color: '#ec4899' },
    ];

    return (
        <RouteGuard permission="crm.read">
            <div className="ui-page">
                <PageHeader title="CRM Intelligence" description="AI-powered insights and analytics" />

                <div className={`ui-grid-4 ${styles.kpiGrid}`}>
                    {cards.map((card) => (
                        <Link key={card.title} href={card.href} className={styles.featureLink}>
                            <DashboardKPICard
                                title={card.title}
                                value={typeof card.value === 'number' ? card.value.toString() : card.value}
                                icon={<card.icon size={18} />}
                                color={card.color}
                            />
                        </Link>
                    ))}
                </div>

                <Card>
                    <div className="ui-card-header">
                        <h3 className="ui-card-title">Intelligence Features</h3>
                    </div>
                    <div className="ui-card-body">
                        <div className="ui-grid-4">
                            {features.map((f) => (
                                <Link key={f.name} href={f.href} className={styles.featureLink}>
                                    <div className={`ui-card ${styles.featureCard}`}>
                                        <div className={styles.featureHeader}>
                                            <div className={styles.featureIcon} style={{ '--feature-color': f.color } as React.CSSProperties}>
                                                <f.icon size={20} color={f.color} />
                                            </div>
                                            <h4 className={styles.featureTitle}>{f.name}</h4>
                                        </div>
                                        <p className="ui-text-xs-muted m-0">{f.desc}</p>
                                        <div className={styles.featureAction}>
                                            Open <ArrowRight size={12} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </RouteGuard>
    );
}
