'use client';

import { useMemo, useRef, useState, type ReactNode, type UIEvent } from 'react';
import { Skeleton } from '@unerp/ui-components';
import { EmptyState } from '@unerp/ui-components';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
  /** Plain value used for CSV export; defaults to the raw row property */
  exportValue?: (row: T) => string | number | boolean | null | undefined;
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
  /** Controlled row selection: shows a checkbox column when both props are set */
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Rendered in a toolbar above the table while rows are selected */
  bulkActions?: (selectedKeys: string[]) => ReactNode;
  /** Window rows inside a fixed-height scroll container (large datasets) */
  virtualized?: boolean;
  /** Fixed row height in px used for windowing math (default 44) */
  rowHeight?: number;
  /** Scroll container height in px when virtualized (default 480) */
  maxHeight?: number;
}

const cellPad = 'var(--space-3) var(--space-4)';
const OVERSCAN = 8;

/**
 * Consistent data table with built-in loading skeletons and empty state —
 * so every module stops hand-rolling tables (Jakob's Law: one familiar pattern).
 * Sort headers follow a single global convention (.dt-sort-th / .dt-sort-arrow, see globals.css)
 * so every module's tables look/behave identically instead of hand-rolled sort UIs.
 * Optionally supports controlled multi-select with a bulk-action bar, and windowed
 * rendering for large client-side datasets.
 */
export function DataTable<T>({
  columns, data, loading, rowKey, onRowClick,
  emptyTitle = 'Nothing here yet', emptyMessage = 'No records to display.', emptyIcon, skeletonRows = 6,
  sortBy, sortOrder = 'asc', onSortChange,
  selectedKeys, onSelectionChange, bulkActions,
  virtualized, rowHeight = 44, maxHeight = 480,
}: DataTableProps<T>) {
  const get = (row: T, key: string) => (row as Record<string, unknown>)[key] as ReactNode;
  const keyOf = (row: T, i: number) => (rowKey ? rowKey(row, i) : String(i));

  const selectable = !!selectedKeys && !!onSelectionChange;
  const selected = useMemo(() => new Set(selectedKeys ?? []), [selectedKeys]);
  const allKeys = useMemo(() => data.map((row, i) => keyOf(row, i)), [data, rowKey]);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someSelected = allKeys.some((k) => selected.has(k));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : allKeys);
  };
  const toggleOne = (key: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange([...next]);
  };

  const handleSort = (c: Column<T>) => {
    if (!c.sortable || !onSortChange) return;
    if (sortBy === c.key) onSortChange(c.key, sortOrder === 'asc' ? 'desc' : 'asc');
    else onSortChange(c.key, 'asc');
  };

  // ── Windowing (only when virtualized and worth it) ──
  const windowing = !!virtualized && !loading && data.length * rowHeight > maxHeight;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onScroll = windowing ? (e: UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop) : undefined;
  const startIndex = windowing ? Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN) : 0;
  const endIndex = windowing
    ? Math.min(data.length, Math.ceil((scrollTop + maxHeight) / rowHeight) + OVERSCAN)
    : data.length;
  const topSpacer = startIndex * rowHeight;
  const bottomSpacer = (data.length - endIndex) * rowHeight;
  const visibleRows = windowing ? data.slice(startIndex, endIndex) : data;
  const colSpan = columns.length + (selectable ? 1 : 0);

  const renderRow = (row: T, i: number) => {
    const key = keyOf(row, i);
    return (
      <tr
        key={key}
        aria-selected={selectable ? selected.has(key) : undefined}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        style={{ borderBottom: '1px solid var(--color-border)', cursor: onRowClick ? 'pointer' : undefined, height: windowing ? rowHeight : undefined, background: selectable && selected.has(key) ? 'var(--color-bg-sunken)' : undefined, transition: 'background var(--duration-fast) var(--ease-default)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = selectable && selected.has(key) ? 'var(--color-bg-sunken)' : 'transparent'; }}
      >
        {selectable && (
          <td style={{ padding: cellPad, width: 36 }} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              aria-label="Select row"
              checked={selected.has(key)}
              onChange={() => toggleOne(key)}
            />
          </td>
        )}
        {columns.map((c) => (
          <td key={c.key} style={{ padding: cellPad, textAlign: c.align || 'left', color: 'var(--color-text)' }}>
            {c.render ? c.render(row, i) : get(row, c.key)}
          </td>
        ))}
      </tr>
    );
  };

  const table = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)' }}>
          {selectable && (
            <th style={{ padding: cellPad, width: 36 }}>
              <input
                type="checkbox"
                aria-label="Select all rows"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                onChange={toggleAll}
              />
            </th>
          )}
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
              {selectable && <td style={{ padding: cellPad }} />}
              {columns.map((c) => (
                <td key={c.key} style={{ padding: cellPad }}><Skeleton height={12} width={c.align === 'right' ? '50%' : '80%'} style={{ marginLeft: c.align === 'right' ? 'auto' : undefined }} /></td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={colSpan} style={{ padding: 0 }}>
              <EmptyState title={emptyTitle} description={emptyMessage} icon={emptyIcon} />
            </td>
          </tr>
        ) : (
          <>
            {windowing && topSpacer > 0 && <tr aria-hidden="true"><td colSpan={colSpan} style={{ padding: 0, height: topSpacer }} /></tr>}
            {visibleRows.map((row, i) => renderRow(row, startIndex + i))}
            {windowing && bottomSpacer > 0 && <tr aria-hidden="true"><td colSpan={colSpan} style={{ padding: 0, height: bottomSpacer }} /></tr>}
          </>
        )}
      </tbody>
    </table>
  );

  return (
    <div>
      {selectable && bulkActions && selected.size > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4)', marginBottom: 'var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-sunken)', fontSize: 'var(--text-sm)' }}
        >
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
            {selected.size} selected
          </span>
          {bulkActions([...selected])}
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{ overflowX: 'auto', overflowY: windowing ? 'auto' : undefined, maxHeight: windowing ? maxHeight : undefined, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}
      >
        {table}
      </div>
    </div>
  );
}
