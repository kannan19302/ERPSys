'use client';

import React, { useState, useCallback } from 'react';

// ─────────────────────────────────────────────────
// Drill-Down Modal — standardized source records viewer
// Replicates the BI Dashboard KPI drill-down pattern
// ─────────────────────────────────────────────────

export interface DrillDownColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  columns: DrillDownColumn[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  onExport?: () => void;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  columns,
  rows,
  loading = false,
  onExport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRows = searchQuery
    ? rows.filter((row: Record<string, unknown>) =>
        columns.some((col: DrillDownColumn) => {
          const val = row[col.key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(searchQuery.toLowerCase());
        })
      )
    : rows;

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
      return;
    }
    // Default CSV export
    const header = columns.map((c: DrillDownColumn) => c.label).join(',');
    const csvRows = filteredRows.map((row: Record<string, unknown>) =>
      columns.map((c: DrillDownColumn) => `"${String(row[c.key] ?? '')}"`).join(',')
    );
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_export.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [onExport, columns, filteredRows, title]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeInUp 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          width: 'min(900px, 100%)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-text)',
          }}>
            {icon && <span style={{ color: 'var(--color-primary)' }}>{icon}</span>}
            {title} — Source Records
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-1-5) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
              }}
            >
              ↓ Export CSV
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-lg)',
                padding: 'var(--space-1)',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <input
            type="text"
            className="frappe-input"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-12)',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                width: 20,
                height: 20,
                border: '2px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              Loading records…
            </div>
          ) : filteredRows.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-12)',
              color: 'var(--color-text-secondary)',
            }}>
              {searchQuery ? 'No matching records found.' : 'No records available.'}
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--text-sm)',
            }}>
              <thead>
                <tr>
                  {columns.map((col: DrillDownColumn) => (
                    <th
                      key={col.key}
                      style={{
                        textAlign: 'left',
                        padding: 'var(--space-3) var(--space-4)',
                        borderBottom: '2px solid var(--color-border)',
                        background: 'var(--color-bg-sunken)',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 'var(--weight-semibold)',
                        fontSize: 'var(--text-xs)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row: Record<string, unknown>, i: number) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-sunken)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {columns.map((col: DrillDownColumn) => (
                      <td
                        key={col.key}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
        }}>
          <span>{filteredRows.length} record{filteredRows.length !== 1 ? 's' : ''} found</span>
          <button
            onClick={onClose}
            className="frappe-btn frappe-btn-outline"
            style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1-5) var(--space-4)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
