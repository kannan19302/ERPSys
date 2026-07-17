'use client';
import styles from './DynamicRoutingTab.module.css';
import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';

export default function DynamicRoutingTab() {
  return (
    <div className="ui-stack-4">
      <div className="ui-card p-5">
        <h3 className="ui-section-header">Rules Engine Directory</h3>
        <p className={styles.p1}>
          Configure conditional routing logic below. Active rules will dynamically assign assignees on trigger.
        </p>
        {[
          { condition: 'Purchase Order Amount > $10,000', route: 'CFO', fallback: 'VP Finance', active: true },
          { condition: 'Leave Duration > 5 days', route: 'HR Director', fallback: 'Department Head', active: true },
          { condition: 'Invoice Vendor = "Preferred"', route: 'Auto-Approve', fallback: 'AP Manager', active: true },
          { condition: 'Travel Expense Region = "International"', route: 'Global Travel Manager', fallback: 'VP Operations', active: false },
          { condition: 'Budget Transfer > 20% of Department Budget', route: 'CEO', fallback: 'CFO', active: true },
        ].map((rule, i) => (
          <div key={i} style={{ opacity: rule.active ? 1 : 0.6 }} className={styles.s1}
          >
            <div className={styles.p2}>
              <Zap size={16} style={{ color: rule.active ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} className={styles.s4} />
              <div className="flex-1">
                <div className="ui-heading-sm">IF {rule.condition}</div>
                <div className={styles.p3}>
                  <ArrowRight size={10} /> Route to: <strong>{rule.route}</strong>
                  <span className="ui-text-tertiary">• Fallback: {rule.fallback}</span>
                </div>
              </div>
            </div>
            <div style={{ background: rule.active ? 'var(--color-primary)' : 'var(--color-border)' }} className={styles.s2}>
              <div style={{ left: rule.active ? '20px' : '2px' }} className={styles.s3} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
