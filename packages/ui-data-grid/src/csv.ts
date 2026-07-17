import type { Column } from './table';

// CSV export for DataTable/ListView datasets. Values come from
// Column.exportValue when present, otherwise the raw row property.

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(columns: Column<T>[], rows: T[]): string {
  const header = columns.map((c) => csvEscape(typeof c.header === 'string' ? c.header : c.key)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => csvEscape(c.exportValue ? c.exportValue(row) : (row as Record<string, unknown>)[c.key]))
      .join(','),
  );
  return [header, ...lines].join('\r\n');
}

/** Build the CSV and trigger a browser download. */
export function exportToCsv<T>(columns: Column<T>[], rows: T[], filename = 'export.csv'): void {
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(['﻿' + toCsv(columns, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
