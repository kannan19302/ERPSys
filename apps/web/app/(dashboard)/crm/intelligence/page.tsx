'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, StatusBadge, DashboardKPICard } from '@unerp/ui';
import { Brain, TrendingUp, Users, Target, Heart, DollarSign, BarChart3, Activity, ArrowRight, Zap, Shield, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function CrmIntelligencePage() {
    const [loading, setLoading] = useState(true);
    const [dealVelocity, setDealVelocity] = useState<any>(null);
    const [atRiskCount, setAtRiskCount] = useState(0);
    const [mlModels, setMlModels] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token || ''}` };
            try {
                const [velRes, riskRes, mlRes] = await Promise.all([
                    fetch('/api/v1/crm/analytics/deal-velocity', { headers }),
                    fetch('/api/v1/crm/customers/at-risk?threshold=60', { headers }),
                    fetch('/api/v1/crm/ml-models', { headers }),
                ]);
                if (velRes.ok) { const d = await velRes.json(); setDealVelocity(d?.data ?? d); }
                if (riskRes.ok) { const d = await riskRes.json(); const data = d?.data ?? d; setAtRiskCount(Array.isArray(data) ? data.length : 0); }
                if (mlRes.ok) { const d = await mlRes.json(); const data = d?.data ?? d; setMlModels(Array.isArray(data) ? data : []); }
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return <div className="frappe-page"><Spinner /></div>;

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
        <div className="frappe-page">
            <PageHeader title="CRM Intelligence" description="AI-powered insights and analytics" />

            <div className="frappe-grid-4" style={{ marginBottom: 'var(--space-8)' }}>
                {cards.map((card) => (
                    <Link key={card.title} href={card.href} style={{ textDecoration: 'none' }}>
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
                <div className="frappe-card-header">
                    <h3 className="frappe-card-title">Intelligence Features</h3>
                </div>
                <div className="frappe-card-body">
                    <div className="frappe-grid-4">
                        {features.map((f) => (
                            <Link key={f.name} href={f.href} style={{ textDecoration: 'none' }}>
                                <div className="frappe-card" style={{ padding: 'var(--space-5)', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <f.icon size={20} color={f.color} />
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{f.name}</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{f.desc}</p>
                                    <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }}>
                                        Open <ArrowRight size={12} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}