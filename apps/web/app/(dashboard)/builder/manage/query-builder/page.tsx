'use client';

import React, { useState } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Database, Play, Plus, Save, Terminal } from 'lucide-react';

export default function VisualQueryBuilderPage() {
  const [queries, setQueries] = useState<any[]>([
    { id: 'q1', name: 'Get Active Customers', query: 'SELECT * FROM Customer WHERE status = \'ACTIVE\' LIMIT 100;' },
    { id: 'q2', name: 'High Value Orders', query: 'SELECT * FROM SalesOrder WHERE totalAmount > 5000 LIMIT 50;' },
  ]);

  const [selectedQuery, setSelectedQuery] = useState<any>(queries[0]);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [running, setRunning] = useState(false);

  const handleTestRun = async () => {
    if (!selectedQuery?.query) return;
    setRunning(true);
    setConsoleOutput('Executing SQL dry-run check...\n');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/governance/query/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ query: selectedQuery.query })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConsoleOutput(
            `SUCCESS: Query parsed and validated successfully.\n\n` +
            `EXPLAIN PLAN:\n` +
            `  - Scan Strategy: ${data.explain?.strategy}\n` +
            `  - Target Table: ${data.explain?.targetTable}\n` +
            `  - Cost Estimate: ${data.explain?.costEstimate}\n\n` +
            `RESULTS SAMPLE:\n` +
            JSON.stringify(data.rows, null, 2)
          );
        } else {
          setConsoleOutput(`ERROR: ${data.error}`);
        }
      } else {
        setConsoleOutput('ERROR: Server rejected the SQL query syntax or permissions check failed.');
      }
    } catch {
      setConsoleOutput('ERROR: Failed to connect to query execution gateway.');
    } finally {
      setRunning(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Query Description' },
    { key: 'query', header: 'SQL Expression' }
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Visual Query Builder & Security Console"
        description="Write custom SQL queries, verify execution plans, and check safe column data binding filters."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Database size={16} /> Saved Queries
            </h3>
            <DataTable 
              columns={columns} 
              data={queries} 
              onRowClick={(row) => setSelectedQuery(row)}
            />
            <button 
              className="frappe-btn" 
              style={{ marginTop: 'var(--space-4)' }}
              onClick={() => {
                const name = window.prompt('Enter query description:');
                if (!name) return;
                const query = window.prompt('Enter SQL select query:');
                if (!query) return;
                const nq = { id: Date.now().toString(), name, query };
                setQueries([...queries, nq]);
                setSelectedQuery(nq);
              }}
            >
              <Plus size={14} /> New Query
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {selectedQuery && (
            <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={16} /> Query Console: {selectedQuery.name}
              </h3>
              <div className="frappe-form-group">
                <textarea 
                  className="frappe-input" 
                  value={selectedQuery.query} 
                  onChange={e => {
                    const updated = queries.map(q => q.id === selectedQuery.id ? { ...q, query: e.target.value } : q);
                    setQueries(updated);
                    setSelectedQuery({ ...selectedQuery, query: e.target.value });
                  }}
                  style={{ width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>
              <button 
                className="frappe-btn frappe-btn-primary" 
                onClick={handleTestRun}
                disabled={running}
              >
                <Play size={14} /> {running ? 'Executing check...' : 'Test Run SQL'}
              </button>
            </div>
          )}

          {consoleOutput && (
            <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
              <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Console Output</h4>
              <pre style={{ margin: 0, padding: 'var(--space-3)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto' }}>
                {consoleOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

