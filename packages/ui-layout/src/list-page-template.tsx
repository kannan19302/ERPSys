'use client';

import React, { useState, type ReactNode, type ChangeEvent } from 'react';
import { PageHeader } from './page-header';

export interface ListColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
  width?: string;
}

export interface ListPageFilter {
  key: string;
  label: string;
  options: Array<{ label: string; value: string }>;
}

export interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export interface ListPageTemplateProps<T = Record<string, unknown>> {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  columns: ListColumn<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: ListPageFilter[];
  pagination?: ListPaginationProps;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Extra content between header and table (charts, tabs, etc.) */
  above?: ReactNode;
}

function Th({ children, width }: { children: ReactNode; width?: string }) {
  return (
    <th
      style={{
        padding: 'var(--space-3) var(--space-4)',
        textAlign: 'left',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--color-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-sunken)',
        width,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td
      style={{
        padding: 'var(--space-3) var(--space-4)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text)',
        borderBottom: '1px solid var(--color-border)',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  );
}

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <Td key={i}>
        <div
          style={{
            height: 14,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(90deg, var(--color-bg-sunken) 25%, var(--color-border) 37%, var(--color-bg-sunken) 63%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s ease-in-out infinite',
            width: i === 0 ? '60%' : '80%',
          }}
        />
      </Td>
    ))}
  </tr>
);

export function ListPageTemplate<T = Record<string, unknown>>({
  title,
  subtitle,
  actions,
  columns,
  data,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search…',
  filters,
  pagination,
  onRowClick,
  emptyTitle = 'No results',
  emptyDescription = 'Try adjusting your search or filters.',
  above,
}: ListPageTemplateProps<T>) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const filtered = data.filter((row) => {
    if (search) {
      const haystack = Object.values(row as Record<string, unknown>).join(' ').toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    for (const [key, val] of Object.entries(filterValues)) {
      if (val && String((row as Record<string, unknown>)[key]) !== val) return false;
    }
    return true;
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {title && <PageHeader title={title} description={subtitle} actions={actions} />}

      {above}

      {/* Toolbar */}
      {(searchable || filters?.length) && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {searchable && (
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-tertiary)',
                  pointerEvents: 'none',
                  fontSize: 14,
                }}
              >
                🔍
              </span>
              <input
                type="search"
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: '100%',
                  paddingLeft: 'var(--space-8)',
                  paddingRight: 'var(--space-3)',
                  height: 36,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}
          {filters?.map((f) => (
            <select
              key={f.key}
              value={filterValues[f.key] ?? ''}
              onChange={(e) => handleFilterChange(f.key, e.target.value)}
              aria-label={f.label}
              style={{
                height: 36,
                padding: '0 var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}
            >
              <option value="">{f.label}: All</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <Th key={col.key} width={col.width}>
                    {col.header}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={columns.length} />
                  ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        padding: 'var(--space-12) var(--space-8)',
                        textAlign: 'center',
                        color: 'var(--color-text-tertiary)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1)' }}>
                        {emptyTitle}
                      </div>
                      <div>{emptyDescription}</div>
                    </td>
                  </tr>
                )
                : filtered.map((row, ri) => (
                  <tr
                    key={ri}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    style={{
                      cursor: onRowClick ? 'pointer' : undefined,
                      transition: 'background var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = '';
                    }}
                  >
                    {columns.map((col) => {
                      const raw = (row as Record<string, unknown>)[col.key];
                      return (
                        <Td key={col.key}>
                          {col.render ? col.render(raw, row) : String(raw ?? '')}
                        </Td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)',
              borderTop: '1px solid var(--color-border)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <span>
              {pagination.total === 0
                ? 'No results'
                : `Showing ${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} of ${pagination.total}`}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{
                  padding: '4px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text)',
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page <= 1 ? 0.4 : 1,
                  fontSize: 'var(--text-sm)',
                }}
              >
                ← Prev
              </button>
              <span style={{ color: 'var(--color-text)' }}>
                {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
              </span>
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                style={{
                  padding: '4px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text)',
                  cursor: pagination.page >= Math.ceil(pagination.total / pagination.pageSize) ? 'not-allowed' : 'pointer',
                  opacity: pagination.page >= Math.ceil(pagination.total / pagination.pageSize) ? 0.4 : 1,
                  fontSize: 'var(--text-sm)',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
