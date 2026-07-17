'use client';

import styles from './page.module.css';

import React from 'react';
import { Percent, Plus, Clock, ShoppingBag } from 'lucide-react';

export default function POSPromotionsPage() {
    return (
        <div className="ui-stack-6">
            <div>
                <h1 className="text-2xl ui-hstack-2">
                    <Percent className="ui-text-primary" />
                    Promotions Engine
                </h1>
                <p className="ui-text-sm-muted">Create and manage promotional rules, bundle deals, and time-based offers.</p>
            </div>

            <div className="ui-flex-between">
                <div className="ui-flex ui-gap-2">
                    <span className="ui-text-sm-muted">Active promotions are automatically applied at checkout when conditions are met.</span>
                </div>
                <button className={styles.p1}>
                    <Plus size={14} /> Create Promotion
                </button>
            </div>

            <div className="ui-card p-5">
                <h3 className="ui-section-header">Promotion Types</h3>
                <div className={styles.p2}>
                    {[
                        { name: 'Buy X Get Y (BOGO)', desc: 'Buy a specific product and get another free or discounted', type: 'BOGO' },
                        { name: 'Bundle Discount', desc: 'Discount when purchasing a set of products together', type: 'BUNDLE' },
                        { name: 'Percentage Off', desc: 'Percentage discount on order, item, or category', type: 'PERCENTAGE' },
                        { name: 'Fixed Amount Off', desc: 'Fixed dollar amount discount on qualifying purchases', type: 'FIXED' },
                    ].map((p, i) => (
                        <div key={i} className={styles.p3}>
                            <div className={styles.p4}>{p.name}</div>
                            <div className="ui-text-caption">{p.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}