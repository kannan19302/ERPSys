'use client';

import styles from './page.module.css';

import React from 'react';
import { Calendar, DollarSign, ShoppingBag, Clock } from 'lucide-react';

export default function POSLayawayPage() {
    return (
        <div className="ui-stack-6">
            <div>
                <h1 className="text-2xl ui-hstack-2">
                    <Calendar className="ui-text-primary" />
                    Layaway & Installment Plans
                </h1>
                <p className="ui-text-sm-muted">Create and manage layaway plans with deposit and installment payments.</p>
            </div>

            <div className={styles.p1}>
                {[
                    { label: 'Active Plans', value: '0', color: 'var(--color-primary)' },
                    { label: 'Completed', value: '0', color: 'var(--color-success)' },
                    { label: 'Overdue', value: '0', color: 'var(--color-error)' },
                ].map((stat, i) => (
                    <div key={i} className={styles.p2}>
                        <div style={{ color: stat.color }}>{stat.value}</div>
                        <div className="ui-text-xs-muted">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="ui-card p-5">
                <h3 className="ui-section-header">How Layaway Works</h3>
                <div className={styles.p4}>
                    {[
                        { step: '1', title: 'Create Plan', desc: 'Select items and set a deposit amount to reserve them.' },
                        { step: '2', title: 'Collect Payments', desc: 'Customer makes installment payments over time.' },
                        { step: '3', title: 'Complete', desc: 'Once fully paid, the order is released to the customer.' },
                    ].map((s, i) => (
                        <div key={i} className={styles.p5}>
                            <div className={styles.p6}>{s.step}</div>
                            <div className={styles.p7}>{s.title}</div>
                            <div className="ui-text-caption">{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}