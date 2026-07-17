'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Database, Play, Plus, Save, Terminal } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function VisualQueryBuilderPage() {
  const client = useApiClient();
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
      const data = await client.post<any>('/builder/governance/query/run', { query: selectedQuery.query });
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
    <RouteGuard permission="builder.query.read">
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Visual Query Builder & Security Console"
        description="Write custom SQL queries, verify execution plans, and check safe column data binding filters."
      />

      <div className="ui-grid-2 ui-gap-6">
        <div className="ui-stack-4">
          <div className="ui-card p-4">
            <h3 className={styles.s1}>
              <Database size={16} /> Saved Queries
            </h3>
            <DataTable 
              columns={columns} 
              data={queries} 
              onRowClick={(row) => setSelectedQuery(row)}
            />
            <button 
              className={`ui-btn ${styles.s2}`} 
              
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

        <div className={styles.s3}>
          {selectedQuery && (
            <div className="ui-card p-5">
              <h3 className={styles.s1}>
                <Terminal size={16} /> Query Console: {selectedQuery.name}
              </h3>
              <div className="ui-form-group">
                <textarea 
                  className={`ui-input ${styles.s4}`} 
                  value={selectedQuery.query} 
                  onChange={e => {
                    const updated = queries.map(q => q.id === selectedQuery.id ? { ...q, query: e.target.value } : q);
                    setQueries(updated);
                    setSelectedQuery({ ...selectedQuery, query: e.target.value });
                  }}
                  
                />
              </div>
              <button 
                className="ui-btn ui-btn-primary" 
                onClick={handleTestRun}
                disabled={running}
              >
                <Play size={14} /> {running ? 'Executing check...' : 'Test Run SQL'}
              </button>
            </div>
          )}

          {consoleOutput && (
            <div className="ui-card p-4">
              <h4 className={styles.s5}>Console Output</h4>
              <pre className={styles.s6}>
                {consoleOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
    </RouteGuard>
  );
}

