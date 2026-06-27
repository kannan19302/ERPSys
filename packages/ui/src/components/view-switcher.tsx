'use client';

import React from 'react';

// ─────────────────────────────────────────────────
// View Switcher — toggle between List, Chart, Kanban, Grid views
// ─────────────────────────────────────────────────

export type ViewMode = 'list' | 'chart' | 'kanban' | 'grid';

export interface ViewOption {
  mode: ViewMode;
  label: string;
  icon: React.ReactNode;
}

export interface ViewSwitcherProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableViews?: ViewMode[];
}

/* Inline SVG icons to avoid extra dependencies */
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const KanbanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" />
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const VIEW_ICONS: Record<ViewMode, React.ReactNode> = {
  list: <ListIcon />,
  chart: <BarChartIcon />,
  kanban: <KanbanIcon />,
  grid: <GridIcon />,
};

const VIEW_LABELS: Record<ViewMode, string> = {
  list: 'List',
  chart: 'Chart',
  kanban: 'Kanban',
  grid: 'Grid',
};

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  activeView,
  onViewChange,
  availableViews = ['list', 'chart'],
}) => (
  <div style={{
    display: 'inline-flex',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--color-bg-sunken)',
  }}>
    {availableViews.map((mode) => {
      const isActive = mode === activeView;
      return (
        <button
          key={mode}
          type="button"
          onClick={() => onViewChange(mode)}
          title={VIEW_LABELS[mode]}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: 'var(--space-1-5) var(--space-3)',
            border: 'none',
            background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontSize: 'var(--text-xs)',
            fontWeight: isActive ? 'var(--weight-semibold)' : 'normal',
            cursor: 'pointer',
            transition: 'all var(--duration-fast)',
            boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
            borderRadius: isActive ? 'var(--radius-md)' : '0',
          }}
        >
          {VIEW_ICONS[mode]}
          <span>{VIEW_LABELS[mode]}</span>
        </button>
      );
    })}
  </div>
);
