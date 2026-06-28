'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { Database, Plus, Trash2 } from 'lucide-react';

export default function ConnectorCatalogPage() {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/governance/connectors', {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setConnectors(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/governance/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          name,
          type,
          config: { url }
        })
      });
      if (res.ok) {
        fetchConnectors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/governance/connectors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        fetchConnectors();
      }
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
          className="frappe-btn" 
          style={{ padding: '4px var(--space-2)', color: 'var(--color-danger)', background: 'transparent', border: '1px solid var(--color-border)' }}
          onClick={() => setDeleteTarget(row.id)}
        >
          <Trash2 size={12} />
        </button>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Connector & Data Catalog" 
        description="Configure reusable third-party API integration connectors and databases."
        actions={
          <button className="frappe-btn frappe-btn-primary" onClick={handleAddConnector}>
            <Plus size={14} /> Add Connector
          </button>
        }
      />

      <div className="frappe-card">
        {loading && connectors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading connectors...</div>
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

