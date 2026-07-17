'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { Database, Plus, Trash2 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function ConnectorCatalogPage() {
  const client = useApiClient();
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    setLoading(true);
    try {
      setConnectors(await client.get('/builder/governance/connectors'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const handleAddConnector = async () => {
    const name = window.prompt('Enter connector name:');
    if (!name) return;
    const type = window.prompt('Enter provider type (e.g. REST or GraphQL):', 'REST');
    if (!type) return;
    const url = window.prompt('Enter base API connection URL:');
    if (!url) return;

    try {
      await client.post('/builder/governance/connectors', {
          name,
          type,
          config: { url }
      });
      fetchConnectors();
    } catch (e) {
      console.error(e);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await client.delete(`/builder/governance/connectors/${id}`);
      fetchConnectors();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { key: 'name', header: 'Connector Name' },
    { key: 'type', header: 'Provider Type' },
    { 
      key: 'config', 
      header: 'Connection URL',
      render: (row: any) => row.config?.url || '—'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <button 
          className={`ui-btn ${styles.s1}`} 
          
          onClick={() => setDeleteTarget(row.id)}
        >
          <Trash2 size={12} />
        </button>
      )
    }
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader 
        title="Connector & Data Catalog" 
        description="Configure reusable third-party API integration connectors and databases."
        actions={
          <button className="ui-btn ui-btn-primary" onClick={handleAddConnector}>
            <Plus size={14} /> Add Connector
          </button>
        }
      />

      <div className="ui-card">
        {loading && connectors.length === 0 ? (
          <div className={styles.s2}>Loading connectors...</div>
        ) : (
          <DataTable columns={columns} data={connectors} />
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            executeDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Delete Connection"
        message="Are you sure you want to terminate this third-party API connection integration?"
        confirmLabel="Revoke Connector"
        variant="danger"
      />
    </div>
  );
}

