'use client';

import React from 'react';
import styles from './page.module.css';
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
        <div className="ui-stack-6 ui-animate-in">
            <PageHeader
                title="Advanced CRM"
                description="Customer relationship management, sales pipeline, and analytics tools"
                breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Advanced' }]}
            />

            {groups.map((group) => (
                <div key={group.title} className="ui-stack-3">
                    <div className={styles.p20}>
                        <div className="ui-text-primary">{group.icon}</div>
                        <div>
                            <h2 className={styles.p21}>{group.title}</h2>
                            <p className="ui-text-xs-muted m-0">{group.description}</p>
                        </div>
                    </div>

                    <div className={styles.p22}>
                        {group.modules.map((mod) => (
                            <Link key={mod.href} href={mod.href} className={styles.p23}>
                                <Card padding="md" className={`hover:shadow-md transition-all hover:border-primary/30 ${styles.p24}`}>
                                    <div className={styles.p25}>
                                        <div className={styles.p26}>{mod.icon}</div>
                                        <div className={styles.p27}>
                                            <div className={styles.p28}>
                                                <h3 className={styles.p29}>{mod.label}</h3>
                                            </div>
                                            <p className={styles.p210}>{mod.desc}</p>
                                        </div>
                                        <ChevronRight size={16} className={styles.p211} />
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