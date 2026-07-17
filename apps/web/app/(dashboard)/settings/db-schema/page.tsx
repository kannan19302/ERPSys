'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { Database, Search, RefreshCw, Layers } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface DbTableMetadata {
  tableName: string;
  rowCount: number;
  status: string;
}

export default function DbSchemaPage() {
  const client = useApiClient();
  const [tables, setTables] = useState<DbTableMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSchema = async () => {
    setLoading(true);
    try {
      setTables(await client.get<DbTableMetadata[]>('/admin/operations/db-schema'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSchema();
  }, [client]);

  const filteredTables = tables.filter(t =>
    t.tableName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RouteGuard permission="settings.db-schema.read">
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Database className="ui-text-primary" />
            Database Schema Inspector
          </h1>
          <p className="ui-text-sm-muted">
            Examine current active PostgreSQL public schema tables, fields, structural models, and row volumes.
          </p>
        </div>
        <button onClick={fetchSchema} disabled={loading} className={styles.s1}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Structure
        </button>
      </div>

      {/* Filter and search controls */}
      <div className={styles.s2}>
        <div className={styles.s3}>
          <Search size={16} className="ui-text-muted" />
          <input type="text" placeholder="Search tables by model name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={styles.s4} />
        </div>
        <div className="ui-text-xs-muted">
          Total Database Tables: <strong>{filteredTables.length}</strong>
        </div>
      </div>

      {/* Tables schema info */}
      <ListPageTemplate
        columns={[
          { key: 'tableName', header: 'Postgres Table Name', render: (v) => <span className={styles.s5}>{String(v)}</span> },
          { key: 'rowCount', header: 'Row Count Estimate', render: (v) => `${Number(v).toLocaleString()} rows` },
          { key: 'status', header: 'Status', render: (v) => <span className={styles.s6}><Layers size={10} />{String(v)}</span> },
          { key: 'tableName', header: 'Actions', render: () => <div className="text-right"><button className={styles.s7}>Inspect Columns</button></div> },
        ] as ListColumn[]}
        data={filteredTables as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No schema tables match"
        emptyDescription="No tables match the current search filter."
      />
    </div>
    </RouteGuard>
  );
}
