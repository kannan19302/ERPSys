'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Badge, Button, DataTable, EmptyState, Input, Pagination, type Column } from '@unerp/ui';
import { useResourceList } from '../data';
import { Guarded } from '../permissions';
import { formatCellValue } from './format';
import type { FieldValues, ListParams, ResourceSchema, SortDirection } from '../types';

// ─────────────────────────────────────────────────
// ListView — schema-driven list page: server-side
// pagination/sort/search, status badges, custom cell
// renderers, permission-gated create action.
// ─────────────────────────────────────────────────

export interface ListViewProps {
  resource: ResourceSchema;
  onRowClick?: (row: FieldValues) => void;
  onCreate?: () => void;
  /** Extra server-side filters merged into every request */
  filters?: Record<string, string | number | boolean | undefined>;
  /** Extra toolbar content (filter dropdowns, export buttons, …) */
  toolbar?: ReactNode;
}

export function ListView({ resource, onRowClick, onCreate, filters, toolbar }: ListViewProps) {
  const listConfig = resource.list ?? {};
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(listConfig.defaultSort ?? null);

  const pageSize = listConfig.pageSize ?? 20;
  const params: ListParams = {
    page,
    pageSize,
    search: search || undefined,
    sortField: sort?.field,
    sortDirection: sort?.direction,
    filters,
  };
  const { data: result, isLoading, isError, error, refetch } = useResourceList(resource, params);

  const columnNames = listConfig.columns ?? resource.fields.slice(0, 5).map((f) => f.name);
  const columns = useMemo<Column<FieldValues>[]>(
    () =>
      columnNames.map((name) => {
        const field = resource.fields.find((f) => f.name === name);
        const custom = listConfig.render?.[name];
        const isStatus = resource.status?.field === name;
        const align = field && ['number', 'currency', 'percent'].includes(field.type) ? 'right' : 'left';
        // Virtual columns (no field def) are render-only and not sortable
        const header = field ? (
          <span
            role="button"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() =>
              setSort((prev) => {
                const direction: SortDirection = prev?.field === name && prev.direction === 'asc' ? 'desc' : 'asc';
                return { field: name, direction };
              })
            }
          >
            {field.label}
            {sort?.field === name ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
          </span>
        ) : (
          name.replace(/^\w/, (c) => c.toUpperCase())
        );
        return {
          key: name,
          align,
          header,
          render: (row: FieldValues) => {
            if (custom) return custom(row);
            const value = row[name];
            if (isStatus && resource.status) {
              const tone = resource.status.tones[String(value)] ?? 'neutral';
              return <Badge variant={tone === 'neutral' ? 'default' : tone}>{String(value ?? '')}</Badge>;
            }
            return formatCellValue(field, value);
          },
        };
      }),
    [resource, sort, columnNames.join('|')],
  );

  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const primaryKey = resource.primaryKey ?? 'id';

  if (isError) {
    return (
      <EmptyState
        title={`Couldn't load ${resource.labelPlural.toLowerCase()}`}
        description={error instanceof Error ? error.message : 'An unexpected error occurred.'}
        action={<Button onClick={() => void refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        {listConfig.searchable !== false && (
          <Input
            placeholder={`Search ${resource.labelPlural.toLowerCase()}…`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: 320 }}
          />
        )}
        {toolbar}
        <div style={{ flex: 1 }} />
        {onCreate && (
          <Guarded permission={resource.permissions?.create}>
            <Button onClick={onCreate}>New {resource.labelSingular}</Button>
          </Guarded>
        )}
      </div>

      <DataTable<FieldValues>
        columns={columns}
        data={result?.data ?? []}
        loading={isLoading}
        rowKey={(row, i) => String(row[primaryKey] ?? i)}
        onRowClick={onRowClick}
        emptyTitle={`No ${resource.labelPlural.toLowerCase()} yet`}
        emptyMessage={`Create your first ${resource.labelSingular.toLowerCase()} to get started.`}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {total} {total === 1 ? resource.labelSingular.toLowerCase() : resource.labelPlural.toLowerCase()}
        </span>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
