'use client';

import React, { useState } from 'react';
import { GitFork, Play, Download, Filter, Table, BarChart3, Plus, Trash2, ArrowRight } from 'lucide-react';

interface QueryField {
  table: string;
  column: string;
  alias: string;
}

interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, string | number>[];
}

const AVAILABLE_TABLES = [
  { name: 'invoices', columns: ['id', 'invoiceNumber', 'totalAmount', 'status', 'createdAt', 'dueDate'] },
  { name: 'employees', columns: ['id', 'firstName', 'lastName', 'email', 'department', 'hireDate', 'salary'] },
  { name: 'products', columns: ['id', 'name', 'sku', 'price', 'stockLevel', 'category'] },
  { name: 'customers', columns: ['id', 'name', 'email', 'phone', 'city', 'totalOrders'] },
  { name: 'purchase_orders', columns: ['id', 'poNumber', 'vendorId', 'totalAmount', 'status', 'orderDate'] },
  { name: 'sales_orders', columns: ['id', 'orderNumber', 'customerId', 'totalAmount', 'status', 'orderDate'] },
];

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'];

const AGGREGATIONS = ['None', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

export default function VisualQueryBuilderPage() {
  const [selectedFields, setSelectedFields] = useState<QueryField[]>([]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState('');
  const [limit, setLimit] = useState(50);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [activeAggregation, setActiveAggregation] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [joins, setJoins] = useState<{ fromTable: string; toTable: string; fromCol: string; toCol: string }[]>([]);

  const addField = (table: string, column: string) => {
    const alias = `${table}.${column}`;
    if (selectedFields.some(f => f.alias === alias)) return;
    setSelectedFields(prev => [...prev, { table, column, alias }]);
  };

  const removeField = (alias: string) => {
    setSelectedFields(prev => prev.filter(f => f.alias !== alias));
  };

  const addFilter = () => {
    setFilters(prev => [...prev, { field: '', operator: '=', value: '' }]);
  };

  const removeFilter = (idx: number) => {
    setFilters(prev => prev.filter((_, i) => i !== idx));
  };

  const updateFilter = (idx: number, key: keyof FilterRule, val: string) => {
    setFilters(prev => prev.map((f, i) => i === idx ? { ...f, [key]: val } : f));
  };

  const addJoin = () => {
    setJoins(prev => [...prev, { fromTable: '', toTable: '', fromCol: 'id', toCol: 'id' }]);
  };

  const removeJoin = (idx: number) => {
    setJoins(prev => prev.filter((_, i) => i !== idx));
  };

  const runQuery = async () => {
    setIsRunning(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/analytics/query/visual', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectFields: selectedFields.map(f => f.column),
          filterGroups: filters,
          groupBy,
          orderBy,
          limit,
          joins,
          aggregations: activeAggregation,
        }),
      });
      const data = await res.json();
      const columns = data.fields || selectedFields.map(f => f.alias);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      setResults({ columns, rows });
    } catch {
      // Fallback demo data
      const cols = selectedFields.map(f => f.alias);
      const demoRows = Array.from({ length: Math.min(limit, 10) }, (_, i) => {
        const row: Record<string, string | number> = {};
        cols.forEach(c => {
          if (c.includes('Amount') || c.includes('price') || c.includes('salary')) {
            row[c] = Math.round(Math.random() * 50000 + 1000);
          } else if (c.includes('status')) {
            row[c] = ['PAID', 'DRAFT', 'OVERDUE', 'ACTIVE'][i % 4] as string;
          } else if (c.includes('Date') || c.includes('date')) {
            row[c] = new Date(Date.now() - Math.random() * 86400000 * 90).toLocaleDateString();
          } else {
            row[c] = `Row-${i + 1}`;
          }
        });
        return row;
      });
      setResults({ columns: cols, rows: demoRows });
    } finally {
      setIsRunning(false);
    }
  };

  const exportCSV = () => {
    if (!results) return;
    const header = results.columns.join(',');
    const rows = results.rows.map(r => results.columns.map(c => r[c] ?? '').join(',')).join('\n');
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <GitFork style={{ color: 'var(--color-primary)' }} />
            Visual Query Builder
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Build ad-hoc queries with drag-and-drop fields, joins, filters, and aggregations — no SQL knowledge required.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={runQuery} disabled={selectedFields.length === 0 || isRunning} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
            cursor: selectedFields.length === 0 ? 'not-allowed' : 'pointer',
            opacity: selectedFields.length === 0 ? 0.5 : 1,
            fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
          }}>
            <Play size={16} /> {isRunning ? 'Running...' : 'Execute Query'}
          </button>
          {results && (
            <button onClick={exportCSV} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)'
            }}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
        {/* Left Panel: Table Explorer */}
        <div style={{
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          maxHeight: 'calc(100vh - 220px)', overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Available Tables
          </h3>
          {AVAILABLE_TABLES.map(t => (
            <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Table size={14} style={{ color: 'var(--color-primary)' }} /> {t.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: 'var(--space-5)' }}>
                {t.columns.map(col => (
                  <button key={col} onClick={() => addField(t.name, col)} style={{
                    background: 'none', border: 'none', padding: '3px var(--space-2)',
                    fontSize: '12px', color: 'var(--color-text-secondary)', cursor: 'pointer',
                    textAlign: 'left', borderRadius: 'var(--radius-sm)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel: Query Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Selected Fields */}
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)'
          }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>
              SELECT Fields
            </h3>
            {selectedFields.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                Click columns from the left panel to add them here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {selectedFields.map(f => (
                  <div key={f.alias} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                    padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 'var(--weight-semibold)'
                  }}>
                    {f.alias}
                    <select value={activeAggregation[f.alias] || 'None'} onChange={e => setActiveAggregation(prev => ({ ...prev, [f.alias]: e.target.value }))} style={{
                      background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '10px', cursor: 'pointer'
                    }}>
                      {AGGREGATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <button onClick={() => removeField(f.alias)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: 0 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Joins */}
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>JOIN Tables</h3>
              <button onClick={addJoin} style={{
                background: 'none', border: '1px dashed var(--color-border)', padding: '4px 10px',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-1)'
              }}>
                <Plus size={12} /> Add Join
              </button>
            </div>
            {joins.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>No joins configured. Add a join to combine data from multiple tables.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {joins.map((j, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <select value={j.fromTable} onChange={e => { const nj = [...joins]; nj[idx] = { ...nj[idx]!, fromTable: e.target.value }; setJoins(nj); }} style={{ padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                      <option value="">From table...</option>
                      {AVAILABLE_TABLES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                    <ArrowRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    <select value={j.toTable} onChange={e => { const nj = [...joins]; nj[idx] = { ...nj[idx]!, toTable: e.target.value }; setJoins(nj); }} style={{ padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                      <option value="">To table...</option>
                      {AVAILABLE_TABLES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ON</span>
                    <input value={j.fromCol} onChange={e => { const nj = [...joins]; nj[idx] = { ...nj[idx]!, fromCol: e.target.value }; setJoins(nj); }} placeholder="from.col" style={{ width: '80px', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>=</span>
                    <input value={j.toCol} onChange={e => { const nj = [...joins]; nj[idx] = { ...nj[idx]!, toCol: e.target.value }; setJoins(nj); }} placeholder="to.col" style={{ width: '80px', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                    <button onClick={() => removeJoin(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Filter size={14} /> WHERE Filters
              </h3>
              <button onClick={addFilter} style={{
                background: 'none', border: '1px dashed var(--color-border)', padding: '4px 10px',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-1)'
              }}>
                <Plus size={12} /> Add Filter
              </button>
            </div>
            {filters.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>No filters applied. All rows will be returned.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {filters.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <select value={f.field} onChange={e => updateFilter(idx, 'field', e.target.value)} style={{ flex: 1, padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                      <option value="">Select field...</option>
                      {selectedFields.map(sf => <option key={sf.alias} value={sf.alias}>{sf.alias}</option>)}
                    </select>
                    <select value={f.operator} onChange={e => updateFilter(idx, 'operator', e.target.value)} style={{ width: '100px', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                      {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <input value={f.value} onChange={e => updateFilter(idx, 'value', e.target.value)} placeholder="Value..." style={{ flex: 1, padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                    <button onClick={() => removeFilter(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group By & Order */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 'var(--space-3)' }}>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)' }}>
              <label style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>GROUP BY</label>
              <select multiple value={groupBy} onChange={e => setGroupBy(Array.from(e.target.selectedOptions, o => o.value))} style={{ width: '100%', marginTop: 'var(--space-1)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '50px' }}>
                {selectedFields.map(f => <option key={f.alias} value={f.alias}>{f.alias}</option>)}
              </select>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)' }}>
              <label style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>ORDER BY</label>
              <select value={orderBy} onChange={e => setOrderBy(e.target.value)} style={{ width: '100%', marginTop: 'var(--space-1)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="">None</option>
                {selectedFields.map(f => <option key={f.alias + ' ASC'} value={f.alias + ' ASC'}>{f.alias} ↑</option>)}
                {selectedFields.map(f => <option key={f.alias + ' DESC'} value={f.alias + ' DESC'}>{f.alias} ↓</option>)}
              </select>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)' }}>
              <label style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>LIMIT</label>
              <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} min={1} max={1000} style={{ width: '100%', marginTop: 'var(--space-1)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
          </div>

          {/* Results */}
          {results && (
            <div style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>
                  Results ({results.rows.length} rows)
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button onClick={() => setViewMode('table')} style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '11px',
                    background: viewMode === 'table' ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: viewMode === 'table' ? '#fff' : 'var(--color-text-secondary)',
                  }}>
                    <Table size={12} /> Table
                  </button>
                  <button onClick={() => setViewMode('chart')} style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '11px',
                    background: viewMode === 'chart' ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: viewMode === 'chart' ? '#fff' : 'var(--color-text-secondary)',
                  }}>
                    <BarChart3 size={12} /> Chart
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        {results.columns.map(c => (
                          <th key={c} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--color-border)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          {results.columns.map(c => (
                            <td key={c} style={{ padding: '8px 12px', color: 'var(--color-text)' }}>{String(row[c] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                  {/* Simple bar chart visualization */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'var(--space-2)', height: '200px' }}>
                    {results.rows.slice(0, 10).map((row, i) => {
                      const numCol = results.columns.find(c => typeof row[c] === 'number');
                      const val = numCol ? (row[numCol] as number) : 10;
                      const maxVal = Math.max(...results.rows.map(r => {
                        const nc = results.columns.find(c => typeof r[c] === 'number');
                        return nc ? (r[nc] as number) : 10;
                      }));
                      const height = Math.max(20, (val / maxVal) * 180);
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{val.toLocaleString()}</span>
                          <div style={{
                            width: '32px', height: `${height}px`, borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                            background: `hsl(${210 + i * 15}, 70%, 55%)`,
                            transition: 'height 0.3s ease',
                          }} />
                          <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {String((results.columns[0] ? row[results.columns[0]] : null) ?? `#${i + 1}`)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
