'use client';

import { type ReactNode } from 'react';
import { Skeleton } from './skeleton';
import { EmptyState } from './empty-state';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

export type SortOrder = 'asc' | 'desc';

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  rowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  skeletonRows?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSortChange?: (key: string, order: SortOrder) => void;
}

const cellPad = 'var(--space-3) var(--space-4)';

/**
 * Consistent data table with built-in loading skeletons and empty state —
 * so every module stops hand-rolling tables (Jakob's Law: one familiar pattern).
 * Sort headers follow a single global convention (.dt-sort-th / .dt-sort-arrow, see globals.css)
 * so every module's tables look/behave identically instead of hand-rolled sort UIs.
 */
export function DataTable<T>({
  columns, data, loading, rowKey, onRowClick,
  emptyTitle = 'Nothing here yet', emptyMessage = 'No records to display.', emptyIcon, skeletonRows = 6,
  sortBy, sortOrder = 'asc', onSortChange,
}: DataTableProps<T>) {
  const get = (row: T, key: string) => (row as Record<string, unknown>)[key] as ReactNode;

  const handleSort = (c: Column<T>) => {
    if (!c.sortable || !onSortChange) return;
    if (sortBy === c.key) onSortChange(c.key, sortOrder === 'asc' ? 'desc' : 'asc');
    else onSortChange(c.key, 'asc');
  };

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)' }}>
            {columns.map((c) => {
              const active = c.sortable && sortBy === c.key;
              return (
                <th
                  key={c.key}
                  className={c.sortable ? 'dt-sort-th' : undefined}
                  onClick={c.sortable ? () => handleSort(c) : undefined}
                  aria-sort={active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  style={{ textAlign: c.align || 'left', padding: cellPad, width: c.width, fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', cursor: c.sortable ? 'pointer' : undefined, userSelect: c.sortable ? 'none' : undefined }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start' }}>
                    {c.header}
                    {c.sortable && (
                      <span className="dt-sort-arrow" data-active={active} data-order={active ? sortOrder : undefined} aria-hidden="true">
                        <svg width="10" height="6" viewBox="0 0 10 6" className="dt-sort-arrow-up"><path d="M5 0L10 6H0L5 0Z" fill="currentColor" /></svg>
                        <svg width="10" height="6" viewBox="0 0 10 6" className="dt-sort-arrow-down"><path d="M5 6L0 0H10L5 6Z" fill="currentColor" /></svg>
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, r) => (
              <tr key={r} style={{ borderBottom: '1px solid var(--color-border)' }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: cellPad }}><Skeleton height={12} width={c.align === 'right' ? '50%' : '80%'} style={{ marginLeft: c.align === 'right' ? 'auto' : undefined }} /></td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 0 }}>
                <EmptyState title={emptyTitle} description={emptyMessage} icon={emptyIcon} />
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ borderBottom: '1px solid var(--color-border)', cursor: onRowClick ? 'pointer' : undefined, transition: 'background var(--duration-fast) var(--ease-default)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: cellPad, textAlign: c.align || 'left', color: 'var(--color-text)' }}>
                    {c.render ? c.render(row, i) : get(row, c.key)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
