'use client';

import React from 'react';

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, change, changeLabel, icon, color = 'var(--color-primary)', loading, onClick }) => (
  <div
    style={{
      padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
      background: 'var(--color-bg-elevated)', cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow var(--duration-fast) var(--ease-default)',
    }}
    onClick={onClick}
    onMouseEnter={(e) => { if (onClick) e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{title}</p>
        {loading ? (
          <div style={{ height: 32, width: 80, marginTop: 'var(--space-2)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-sm)', animation: 'shimmer 1.5s infinite' }} />
        ) : (
          <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{value}</p>
        )}
        {change !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: change >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
            {changeLabel && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{changeLabel}</span>}
          </div>
        )}
      </div>
      {icon && (
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
      )}
    </div>
  </div>
);

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface MiniBarChartProps {
  data: BarChartData[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({ data, height = 120, showLabels = true, showValues = true }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-1)', height }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {showValues && <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{d.value}</span>}
            <div style={{
              width: '100%', maxWidth: 40,
              height: `${(d.value / maxVal) * 100}%`, minHeight: 2,
              background: d.color || 'var(--color-primary)',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              transition: 'height var(--duration-normal) var(--ease-default)',
            }} />
          </div>
        ))}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          {data.map((d, i) => (
            <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface MiniDonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export const MiniDonutChart: React.FC<MiniDonutChartProps> = ({ segments, size = 120, thickness = 20, centerLabel, centerValue }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((seg, i) => {
          const segLength = (seg.value / total) * circumference;
          const offset = cumulativeOffset;
          cumulativeOffset += segLength;
          return (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${segLength} ${circumference - segLength}`}
              strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray var(--duration-normal) var(--ease-default)' }}
            />
          );
        })}
      </svg>
      {(centerLabel || centerValue !== undefined) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {centerValue !== undefined && <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{centerValue}</span>}
          {centerLabel && <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{centerLabel}</span>}
        </div>
      )}
    </div>
  );
};

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, width = 120, height = 32, color = 'var(--color-primary)', fill = true }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = fill ? `${pathD} L ${width} ${height} L 0 ${height} Z` : '';

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={fillD} fill={`${color}`} opacity={0.1} />}
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
