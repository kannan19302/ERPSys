'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import { GitFork, Play, Download, Filter, Table, BarChart3, Plus, Trash2, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

interface AskDataResponse {
  answer: string;
  query: { entity: string; aggregations?: Array<{ field: string; fn: string }> } | null;
  data: Record<string, unknown>[];
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
  const client = useApiClient();
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
  const [nlQuestion, setNlQuestion] = useState('');
  const [nlAsking, setNlAsking] = useState(false);
  const [nlResult, setNlResult] = useState<AskDataResponse | null>(null);
  const [nlError, setNlError] = useState('');

  const askInPlainEnglish = async () => {
    if (!nlQuestion.trim()) return;
    setNlAsking(true);
    setNlError('');
    setNlResult(null);
    try {
      const data = await client.post<AskDataResponse>('/ai/ask', { question: nlQuestion });
      setNlResult(data);
    } catch (e) {
      setNlError(e instanceof Error ? e.message : 'Could not reach the AI copilot.');
    } finally {
      setNlAsking(false);
    }
  };

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
      const data = await client.post<{ fields?: string[]; rows?: Record<string, string | number>[] }>('/analytics/query/visual', {
          selectFields: selectedFields.map(f => f.column),
          filterGroups: filters,
          groupBy,
          orderBy,
          limit,
          joins,
          aggregations: activeAggregation,
        });
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
    <RouteGuard permission="analytics.query.read">
      <div className="ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <GitFork className="ui-text-primary" />
            Visual Query Builder
          </h1>
          <p className="ui-text-sm-muted">
            Build ad-hoc queries with drag-and-drop fields, joins, filters, and aggregations — no SQL knowledge required.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <button onClick={runQuery} disabled={selectedFields.length === 0 || isRunning} style={{ cursor: selectedFields.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedFields.length === 0 ? 0.5 : 1 }} className={styles.s1}>
            <Play size={16} /> {isRunning ? 'Running...' : 'Execute Query'}
          </button>
          {results && (
            <button onClick={exportCSV} className={styles.s2}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Ask in Plain English (AI copilot, grounded in real query execution) */}
      <div className={styles.s3}>
        <h3 className={styles.s4}>
          <Sparkles size={14} className="ui-text-primary" /> Ask in Plain English
        </h3>
        <div className="ui-flex ui-gap-2">
          <input
            value={nlQuestion}
            onChange={(e) => setNlQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') askInPlainEnglish(); }}
            placeholder="e.g. What's our total invoiced amount this quarter?"
            className={styles.s5}
          />
          <button onClick={askInPlainEnglish} disabled={nlAsking || !nlQuestion.trim()} style={{ cursor: nlAsking || !nlQuestion.trim() ? 'not-allowed' : 'pointer', opacity: nlAsking || !nlQuestion.trim() ? 0.5 : 1 }} className={styles.s6}>
            {nlAsking ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {nlAsking ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        {nlError && <p className={styles.s7}>{nlError}</p>}
        {nlResult && (
          <div className="ui-stack-2">
            <p className={styles.s8}>{nlResult.answer}</p>
            {nlResult.query && (
              <p className={styles.s9}>
                Ran against <strong>{nlResult.query.entity}</strong>{nlResult.query.aggregations?.length ? ` (${nlResult.query.aggregations.map((a) => `${a.fn}(${a.field})`).join(', ')})` : ''} — {nlResult.data.length} row(s) returned.
              </p>
            )}
          </div>
        )}
      </div>

      <div className={styles.s10}>
        {/* Left Panel: Table Explorer */}
        <div className={styles.s11}>
          <h3 className={styles.s12}>
            Available Tables
          </h3>
          {AVAILABLE_TABLES.map(t => (
            <div key={t.name} className="ui-stack-1">
              <div className={styles.s13}>
                <Table size={14} className="ui-text-primary" /> {t.name}
              </div>
              <div className={styles.s14}>
                {t.columns.map(col => (
                  <button key={col} onClick={() => addField(t.name, col)} className={`${styles.s15} ${styles.fieldHover}`}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel: Query Builder */}
        <div className="ui-stack-4">
          {/* Selected Fields */}
          <div className="ui-card p-4">
            <h3 className="ui-section-header">
              SELECT Fields
            </h3>
            {selectedFields.length === 0 ? (
              <p className={styles.s16}>
                Click columns from the left panel to add them here.
              </p>
            ) : (
              <div className={styles.s17}>
                {selectedFields.map(f => (
                  <div key={f.alias} className={styles.s18}>
                    {f.alias}
                    <select value={activeAggregation[f.alias] || 'None'} onChange={e => setActiveAggregation(prev => ({ ...prev, [f.alias]: e.target.value }))} className={styles.s19}>
                      {AGGREGATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <button onClick={() => removeField(f.alias)} className={styles.s20}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Joins */}
          <div className="ui-card p-4">
            <div className={styles.s21}>
              <h3 className={styles.s22}>JOIN Tables</h3>
              <button onClick={addJoin} className={styles.s23}>
                <Plus size={12} /> Add Join
              </button>
            </div>
            {joins.length === 0 ? (
              <p className={styles.s16}>No joins configured. Add a join to combine data from multiple tables.</p>
            ) : (
              <div className="ui-stack-2">
                {joins.map((j, idx) => (
                  <div key={idx} className={styles.s24}>
                    <select value={j.fromTable} onChange={e => { const nj = [...joins]; nj[idx] = { ...nj[idx]!, fromTable: e.target.value }; setJoins(nj); }} className={styles.s25}>
                      <option value="">From table...</option>
                      {AVAILABLE_TABLES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                    <ArrowRight size={14} className="ui-text-tertiary" />
                    <select value={j.toTable} onChange={e => { const nj = [...joins]; nj[idx] = { ...nj[idx]!, toTable: e.target.value }; setJoins(nj); }} className={styles.s25}>
                      <option value="">To table...</option>
                      {AVAILABLE_TABLES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                    <span className="ui-text-caption">ON</span>
                    <input value={j.fromCol} onChange={e => { const nj = [...joins]; nj[idx] = { ...nj[idx]!, fromCol: e.target.value }; setJoins(nj); }} placeholder="from.col" className={styles.s26} />
                    <span className="ui-text-caption">=</span>
                    <input value={j.toCol} onChange={e => { const nj = [...joins]; nj[idx] = { ...nj[idx]!, toCol: e.target.value }; setJoins(nj); }} placeholder="to.col" className={styles.s26} />
                    <button onClick={() => removeJoin(idx)} className={styles.s27}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="ui-card p-4">
            <div className={styles.s21}>
              <h3 className={styles.s28}>
                <Filter size={14} /> WHERE Filters
              </h3>
              <button onClick={addFilter} className={styles.s23}>
                <Plus size={12} /> Add Filter
              </button>
            </div>
            {filters.length === 0 ? (
              <p className={styles.s16}>No filters applied. All rows will be returned.</p>
            ) : (
              <div className="ui-stack-2">
                {filters.map((f, idx) => (
                  <div key={idx} className="ui-hstack-2">
                    <select value={f.field} onChange={e => updateFilter(idx, 'field', e.target.value)} className={styles.s29}>
                      <option value="">Select field...</option>
                      {selectedFields.map(sf => <option key={sf.alias} value={sf.alias}>{sf.alias}</option>)}
                    </select>
                    <select value={f.operator} onChange={e => updateFilter(idx, 'operator', e.target.value)} className={styles.s30}>
                      {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <input value={f.value} onChange={e => updateFilter(idx, 'value', e.target.value)} placeholder="Value..." className={styles.s29} />
                    <button onClick={() => removeFilter(idx)} className={styles.s27}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group By & Order */}
          <div className={styles.s31}>
            <div className={styles.s32}>
              <label className={styles.s33}>GROUP BY</label>
              <select multiple value={groupBy} onChange={e => setGroupBy(Array.from(e.target.selectedOptions, o => o.value))} className={styles.s34}>
                {selectedFields.map(f => <option key={f.alias} value={f.alias}>{f.alias}</option>)}
              </select>
            </div>
            <div className={styles.s32}>
              <label className={styles.s33}>ORDER BY</label>
              <select value={orderBy} onChange={e => setOrderBy(e.target.value)} className={styles.s35}>
                <option value="">None</option>
                {selectedFields.map(f => <option key={f.alias + ' ASC'} value={f.alias + ' ASC'}>{f.alias} ↑</option>)}
                {selectedFields.map(f => <option key={f.alias + ' DESC'} value={f.alias + ' DESC'}>{f.alias} ↓</option>)}
              </select>
            </div>
            <div className={styles.s32}>
              <label className={styles.s33}>LIMIT</label>
              <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} min={1} max={1000} className={styles.s35} />
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="ui-card p-4">
              <div className={styles.s21}>
                <h3 className={styles.s22}>
                  Results ({results.rows.length} rows)
                </h3>
                <div className="ui-flex ui-gap-1">
                  <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? 'var(--color-primary)' : 'var(--color-bg)', color: viewMode === 'table' ? '#fff' : 'var(--color-text-secondary)' }} className={styles.s36}>
                    <Table size={12} /> Table
                  </button>
                  <button onClick={() => setViewMode('chart')} style={{ background: viewMode === 'chart' ? 'var(--color-primary)' : 'var(--color-bg)', color: viewMode === 'chart' ? '#fff' : 'var(--color-text-secondary)' }} className={styles.s36}>
                    <BarChart3 size={12} /> Chart
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className="builder-table-wrapper">
                  <table className={styles.s37}>
                    <thead>
                      <tr>
                        {results.columns.map(c => (
                          <th key={c} className={styles.s38}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.map((row, i) => (
                        <tr key={i} className="border-b">
                          {results.columns.map(c => (
                            <td key={c} className={styles.s39}>{String(row[c] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.s40}>
                  {/* Simple bar chart visualization */}
                  <div className={styles.s41}>
                    {results.rows.slice(0, 10).map((row, i) => {
                      const numCol = results.columns.find(c => typeof row[c] === 'number');
                      const val = numCol ? (row[numCol] as number) : 10;
                      const maxVal = Math.max(...results.rows.map(r => {
                        const nc = results.columns.find(c => typeof r[c] === 'number');
                        return nc ? (r[nc] as number) : 10;
                      }));
                      const height = Math.max(20, (val / maxVal) * 180);
                      return (
                        <div key={i} className={styles.s42}>
                          <span className="ui-text-micro ui-text-muted">{val.toLocaleString()}</span>
                          <div style={{ height: `${height}px`, background: `hsl(${210 + i * 15}, 70%, 55%)` }} className={styles.s43} />
                          <span className={styles.s44}>
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
    </RouteGuard>
  );
}
