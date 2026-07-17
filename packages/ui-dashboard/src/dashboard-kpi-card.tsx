'use client';

import React, { useState } from 'react';
import { DrillDownModal, type DrillDownColumn } from './drill-down-modal';

// ─────────────────────────────────────────────────
// Dashboard KPI Card — enhanced metric card with drill-down
// ─────────────────────────────────────────────────

export interface DashboardKPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
  /** Progress toward a goal (0-100) */
  progress?: number;
  progressLabel?: string;
  /** Sparkline data points */
  trend?: number[];
  /** Drill-down configuration */
  drillDown?: {
    modalTitle: string;
    columns: DrillDownColumn[];
    rows: Record<string, unknown>[];
    loading?: boolean;
  };
  onClick?: () => void;
}

const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;
  const width = 80;
  const height = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block', marginTop: 'var(--space-1)' }}>
      <path d={fillD} fill={color} opacity={0.1} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const DashboardKPICard: React.FC<DashboardKPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = '#4f46e5',
  loading = false,
  progress,
  progressLabel,
  trend,
  drillDown,
  onClick,
}) => {
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const isClickable = !!drillDown || !!onClick;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (drillDown) {
      setIsDrillDownOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={isClickable ? handleCardClick : undefined}
        style={{
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
          boxShadow: 'var(--elevation-1)',
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'box-shadow var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (isClickable) {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.boxShadow = 'var(--elevation-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.boxShadow = 'var(--elevation-1)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{
            margin: 0,
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            {title}
          </p>
          {icon && (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-lg)',
              background: `linear-gradient(155deg, ${color}22, ${color}0d)`,
              boxShadow: `inset 0 0 0 1px ${color}26`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
            }}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        {loading ? (
          <div style={{
            height: 32,
            width: 80,
            marginTop: 'var(--space-1)',
            background: 'var(--color-bg-sunken)',
            borderRadius: 'var(--radius-sm)',
            animation: 'shimmer 1.5s infinite',
          }} />
        ) : (
          <p style={{
            margin: 0,
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text)',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}>
            {value}
          </p>
        )}

        {/* Change badge */}
        {change !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              color: change >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
            {changeLabel && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                {changeLabel}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {progress !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: 'var(--space-1)' }}>
            {progressLabel && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: 'var(--color-text-secondary)',
              }}>
                <span>{progressLabel}</span>
                <span style={{
                  fontWeight: 'var(--weight-semibold)',
                  color: progress >= 100 ? 'var(--color-success)' : 'var(--color-text)',
                }}>
                  {progress}%
                </span>
              </div>
            )}
            <div style={{
              height: 5,
              background: 'var(--color-bg-sunken)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(progress, 100)}%`,
                height: '100%',
                background: progress >= 100 ? 'var(--color-success)' : color,
                borderRadius: 'var(--radius-full)',
                transition: 'width var(--duration-base)',
              }} />
            </div>
          </div>
        )}

        {/* Sparkline */}
        {trend && trend.length > 1 && (
          <MiniSparkline data={trend} color={color} />
        )}

        {/* Click hint */}
        {isClickable && (
          <div style={{
            position: 'absolute',
            bottom: 'var(--space-2)',
            right: 'var(--space-3)',
            fontSize: '9px',
            color: 'var(--color-text-tertiary)',
            opacity: 0.6,
          }}>
            Click to drill down →
          </div>
        )}
      </div>

      {/* Drill-down modal */}
      {drillDown && (
        <DrillDownModal
          isOpen={isDrillDownOpen}
          onClose={() => setIsDrillDownOpen(false)}
          title={drillDown.modalTitle}
          icon={icon}
          columns={drillDown.columns}
          rows={drillDown.rows}
          loading={drillDown.loading}
        />
      )}
    </>
  );
};
