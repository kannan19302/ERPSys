'use client';

import React from 'react';
import { Skeleton } from '@unerp/ui-components';

export interface StatCardItem {
  label: string;
  value: string | number;
  /** Signed number, e.g. 12.5 → "+12.5%", -3 → "-3%" */
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  /** CSS color token or value for the accent, e.g. 'var(--color-primary)' */
  color?: string;
  loading?: boolean;
}

export interface StatCardRowProps {
  stats: StatCardItem[];
  columns?: 2 | 3 | 4 | 5;
}

const StatCard: React.FC<StatCardItem> = ({
  label,
  value,
  change,
  changeLabel,
  icon,
  color = 'var(--color-primary)',
  loading = false,
}) => {
  const isPositive = typeof change === 'number' && change >= 0;
  const changeColor = isPositive ? 'var(--color-success-text)' : 'var(--color-danger-text)';

  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in srgb, ${color} 12%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton height={28} width="60%" />
      ) : (
        <div
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text)',
            lineHeight: 1.1,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      )}

      {typeof change === 'number' && (
        <div style={{ fontSize: 'var(--text-xs)', color: changeColor, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span>
            {Math.abs(change).toFixed(1)}%{changeLabel ? ` ${changeLabel}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export const StatCardRow: React.FC<StatCardRowProps> = ({ stats, columns }) => {
  const cols = columns ?? Math.min(stats.length, 4) as 2 | 3 | 4 | 5;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 'var(--space-4)',
      }}
    >
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
};
