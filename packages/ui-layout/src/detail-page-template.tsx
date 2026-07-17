'use client';

import React, { useState, type ReactNode } from 'react';
import { PageHeader } from './page-header';

export interface DetailTab {
  key: string;
  label: string;
  content: ReactNode;
  /** Badge count shown on the tab label */
  count?: number;
}

export interface DetailPageTemplateProps {
  title: string;
  subtitle?: string;
  /** Back navigation — typically a router.back() call or href */
  onBack?: () => void;
  backLabel?: string;
  /** Action buttons for the page header */
  actions?: ReactNode;
  /** Status badge or meta pills shown next to the title */
  meta?: ReactNode;
  tabs: DetailTab[];
  defaultTab?: string;
  /** Content shown above the tabs (e.g. a summary card row) */
  above?: ReactNode;
  loading?: boolean;
}

export const DetailPageTemplate: React.FC<DetailPageTemplateProps> = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  actions,
  meta,
  tabs,
  defaultTab,
  above,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.key ?? '');

  const currentTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Back link */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            padding: 0,
            alignSelf: 'flex-start',
          }}
        >
          ← {backLabel}
        </button>
      )}

      {/* Header */}
      <div>
        <PageHeader
          title={title}
          description={subtitle}
          actions={actions}
        />
        {meta && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
            {meta}
          </div>
        )}
      </div>

      {above}

      {/* Tabs */}
      <div>
        {/* Tab bar */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid var(--color-border)',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  transition: 'color var(--duration-fast)',
                  marginBottom: -1,
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    style={{
                      background: isActive ? 'var(--color-primary-light)' : 'var(--color-bg-sunken)',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 6px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-medium)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab panel */}
        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          style={{ paddingTop: 'var(--space-6)' }}
        >
          {loading ? (
            <div
              style={{
                height: 200,
                background: 'linear-gradient(90deg, var(--color-bg-sunken) 25%, var(--color-border) 37%, var(--color-bg-sunken) 63%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s ease-in-out infinite',
                borderRadius: 'var(--radius-lg)',
              }}
            />
          ) : (
            currentTab?.content
          )}
        </div>
      </div>
    </div>
  );
};
