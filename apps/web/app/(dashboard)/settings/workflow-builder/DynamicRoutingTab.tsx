'use client';

import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';

export default function DynamicRoutingTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Rules Engine Directory</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Configure conditional routing logic below. Active rules will dynamically assign assignees on trigger.
        </p>
        {[
          { condition: 'Purchase Order Amount > $10,000', route: 'CFO', fallback: 'VP Finance', active: true },
          { condition: 'Leave Duration > 5 days', route: 'HR Director', fallback: 'Department Head', active: true },
          { condition: 'Invoice Vendor = "Preferred"', route: 'Auto-Approve', fallback: 'AP Manager', active: true },
          { condition: 'Travel Expense Region = "International"', route: 'Global Travel Manager', fallback: 'VP Operations', active: false },
          { condition: 'Budget Transfer > 20% of Department Budget', route: 'CEO', fallback: 'CFO', active: true },
        ].map((rule, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)',
            opacity: rule.active ? 1 : 0.6,
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
              <Zap size={16} style={{ color: rule.active ? 'var(--color-primary)' : 'var(--color-text-tertiary)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>IF {rule.condition}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
                  <ArrowRight size={10} /> Route to: <strong>{rule.route}</strong>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>• Fallback: {rule.fallback}</span>
                </div>
              </div>
            </div>
            <div style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: rule.active ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: rule.active ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
