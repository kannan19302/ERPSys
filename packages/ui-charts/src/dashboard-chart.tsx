'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
  FunnelChart, Funnel, LabelList,
  ComposedChart,
} from 'recharts';
import { ChartTypePicker, type ChartType } from './chart-type-picker';

// ─────────────────────────────────────────────────
// Dashboard Chart — universal Recharts wrapper
// ─────────────────────────────────────────────────

// Theme-aware categorical palette (tokens defined in @unerp/ui-tokens charts.css)
const FALLBACK_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)',
  'var(--chart-9)', 'var(--chart-10)',
];

export interface ChartSeries {
  dataKey: string;
  name: string;
  color?: string;
  type?: 'bar' | 'line' | 'area';
}

export interface DashboardChartConfig {
  xAxisKey?: string;
  series: ChartSeries[];
  /** For pie/donut: the key containing the value */
  valueKey?: string;
  /** For pie/donut: the key containing the label */
  nameKey?: string;
}

export interface DashboardChartProps {
  title: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  config: DashboardChartConfig;
  defaultChartType?: ChartType;
  allowedChartTypes?: ChartType[];
  height?: number;
  loading?: boolean;
  actions?: React.ReactNode;
}

const LoadingSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <div style={{
    height,
    background: 'var(--color-bg-sunken)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-tertiary)',
    fontSize: 'var(--text-sm)',
    animation: 'shimmer 1.5s infinite',
  }}>
    Loading chart…
  </div>
);

const NoDataPlaceholder: React.FC<{ height: number }> = ({ height }) => (
  <div style={{
    height,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    color: 'var(--color-text-tertiary)',
    background: 'var(--color-bg-sunken)',
    border: '1px dashed var(--color-border-strong)',
    borderRadius: 'var(--radius-md)',
  }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>No data available</span>
  </div>
);

const CustomTooltip: React.FC<{ active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-2) var(--space-3)',
      boxShadow: 'var(--shadow-md)',
      fontSize: 'var(--text-xs)',
    }}>
      {label && <p style={{ margin: '0 0 4px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', margin: '2px 0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{entry.name}:</span>
          <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const DashboardChart: React.FC<DashboardChartProps> = ({
  title,
  subtitle,
  data,
  config,
  defaultChartType = 'bar',
  allowedChartTypes,
  height = 300,
  loading = false,
  actions,
}) => {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const { xAxisKey = 'name', series, valueKey = 'value', nameKey = 'name' } = config;

  const renderChart = () => {
    if (loading) return <LoadingSkeleton height={height} />;
    if (!data || data.length === 0) return <NoDataPlaceholder height={height} />;

    const commonAxisProps = {
      fontSize: 11,
      stroke: 'var(--color-text-tertiary)',
      tickLine: false,
      axisLine: false,
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey={xAxisKey} {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              {series.length > 1 && <Legend />}
              {series.map((s, i) => (
                <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'stacked-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey={xAxisKey} {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {series.map((s, i) => (
                <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} stackId="a" fill={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey={xAxisKey} {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              {series.length > 1 && <Legend />}
              {series.map((s, i) => (
                <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} strokeWidth={2} dot={{ fill: s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length], r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey={xAxisKey} {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              {series.length > 1 && <Legend />}
              {series.map((s, i) => {
                const color = s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                return (
                  <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={height * 0.35}
                innerRadius={chartType === 'donut' ? height * 0.2 : 0}
                paddingAngle={2}
                label={(props: { name?: string; percent?: number }) => {
                  const name = props?.name ?? '';
                  const percent = props?.percent ? ` ${(props.percent * 100).toFixed(0)}%` : '';
                  return `${name}${percent}`;
                }}
                labelLine={{ strokeWidth: 1 }}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={data} cx="50%" cy="50%" outerRadius={height * 0.3}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey={nameKey || xAxisKey} fontSize={11} />
              <PolarRadiusAxis fontSize={10} />
              {series.map((s, i) => (
                <Radar key={s.dataKey} name={s.name} dataKey={s.dataKey} stroke={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} fill={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} fillOpacity={0.2} strokeWidth={2} />
              ))}
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'funnel':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey={valueKey} nameKey={nameKey} data={data} isAnimationActive>
                {data.map((_, i) => (
                  <Cell key={i} fill={FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                ))}
                <LabelList position="center" fill="var(--chart-contrast)" fontSize={12} fontWeight={600} />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey={xAxisKey} {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {series.map((s, i) => {
                const color = s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const seriesType = s.type || (i === 0 ? 'bar' : 'line');
                if (seriesType === 'bar') return <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={color} radius={[4, 4, 0, 0]} />;
                if (seriesType === 'area') return <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={color} fill={color} fillOpacity={0.15} />;
                return <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={color} strokeWidth={2} dot={{ r: 3 }} />;
              })}
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return <NoDataPlaceholder height={height} />;
    }
  };

  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}>
      {/* Card Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
      }}>
        <div>
          <h3 style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text)',
            margin: 0,
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-tertiary)',
              margin: 'var(--space-1) 0 0',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {actions}
          <ChartTypePicker
            value={chartType}
            onChange={setChartType}
            options={
              allowedChartTypes
                ? allowedChartTypes.map(t => ({
                    type: t,
                    label: t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    icon: { bar: '📊', line: '📈', area: '📉', pie: '🥧', donut: '🍩', 'stacked-bar': '📶', radar: '🎯', funnel: '🔻', composed: '📊' }[t] || '📊',
                  }))
                : undefined
            }
          />
        </div>
      </div>

      {/* Chart Area */}
      {renderChart()}
    </div>
  );
};
