'use client';

import React from 'react';
import Link from 'next/link';
import { Card, PageHeader } from '@unerp/ui';
import { Users, TrendingUp, BarChart3, Activity, Mail, PieChart, FileText, ClipboardList, ChevronRight, Building } from 'lucide-react';

const groups = [
    {
        title: 'Account Management',
        icon: <Users size={20} />,
        description: 'Manage customers, vendors, and contacts in your CRM',
        modules: [
            { href: '/crm/customers', label: 'Customers', icon: <Users size={18} />, desc: 'Customer directory with credit limits and payment terms' },
            { href: '/crm/vendors', label: 'Vendors', icon: <Building size={18} />, desc: 'Vendor and supplier management' },
            { href: '/crm/contacts', label: 'Contacts', icon: <Users size={18} />, desc: 'Contact persons linked to customer accounts' },
        ]
    },
    {
        title: 'Sales Pipeline',
        icon: <TrendingUp size={20} />,
        description: 'Track leads through the sales funnel',
        modules: [
            { href: '/crm/leads', label: 'Leads', icon: <TrendingUp size={18} />, desc: 'Kanban board and list view for lead management' },
            { href: '/crm/opportunities', label: 'Opportunities', icon: <BarChart3 size={18} />, desc: 'Pipeline Kanban with stage tracking and deal amounts' },
            { href: '/crm/quotations', label: 'Quotations', icon: <FileText size={18} />, desc: 'Customer quotes and proposals' },
            { href: '/crm/sales-orders', label: 'Sales Orders', icon: <ClipboardList size={18} />, desc: 'Order fulfillment tracking' },
        ]
    },
    {
        title: 'Activities & Analytics',
        icon: <Activity size={20} />,
        description: 'Track communications and analyze performance',
        modules: [
            { href: '/crm/activities', label: 'Activities', icon: <Activity size={18} />, desc: 'Call, email, meeting, and task logging' },
            { href: '/crm/email-templates', label: 'Email Templates', icon: <Mail size={18} />, desc: 'Reusable templates with variable insertion' },
            { href: '/crm/reports', label: 'CRM Reports', icon: <PieChart size={18} />, desc: 'Pipeline funnel, win rate, and lead source analytics' },
        ]
    }
];

export default function CrmAdvancedPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
            <PageHeader
                title="Advanced CRM"
                description="Customer relationship management, sales pipeline, and analytics tools"
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Advanced' }]}
            />

            {groups.map((group) => (
                <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) 0' }}>
                        <div style={{ color: 'var(--color-primary)' }}>{group.icon}</div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{group.title}</h2>
                            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{group.description}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {group.modules.map((mod) => (
                            <Link key={mod.href} href={mod.href} className="no-underline">
                                <Card padding="md" className="hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-primary/30 h-full">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-primary/5 text-primary flex-shrink-0">{mod.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-sm font-semibold m-0 truncate">{mod.label}</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 m-0">{mod.desc}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}