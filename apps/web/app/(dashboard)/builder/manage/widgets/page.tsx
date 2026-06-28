'use client';

import React, { useState } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Cpu, Plus, Code2, Trash2 } from 'lucide-react';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

export default function CustomWidgetsPage() {
  const { data: widgets, createItem, deleteItem } = useBuilderData<any>("widgets", []);
  const [selectedWidget, setSelectedWidget] = useState<any>(null);

  const columns = [
    { key: 'name', header: 'Widget Name' },
    { key: 'tag', header: 'HTML Element Tag' },
    { key: 'source', header: 'SDK Binding Type' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="frappe-btn"
            onClick={() => setSelectedWidget(row)}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            Inspect Manifest
          </button>
          <button 
            className="frappe-btn"
            onClick={() => deleteItem(row.id)}
            style={{ fontSize: '11px', padding: '4px 10px', color: '#dc2626' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )
    }
  ];

  const handleRegister = async () => {
    const name = window.prompt('Enter widget name:');
    if (!name) return;
    const tag = window.prompt('Enter HTML tag (e.g. custom-map):');
    if (!tag) return;
    const source = window.prompt('Enter binding type (e.g. plugin-sdk or iframe/external):', 'plugin-sdk');
    if (!source) return;

    await createItem({
      name,
      tag,
      source,
      manifest: {
        properties: [
          { name: 'width', type: 'string', default: '100%' },
          { name: 'height', type: 'string', default: '400px' }
        ]
      }
    });
  };

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Custom Widget SDK & Extensibility"
        description="Register custom layout elements, configure widget manifest properties, and setup secure iframe embeds."
        actions={
          <button className="frappe-btn frappe-btn-primary" onClick={handleRegister}>
            <Plus size={14} /> Register Widget
          </button>
        }
      />

      <div className="frappe-card">
        <DataTable columns={columns} data={widgets} />
      </div>

      {selectedWidget && (
        <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h4 style={{ margin: 0, fontWeight: 600 }}>Manifest JSON: {selectedWidget.name}</h4>
            <button className="frappe-btn" onClick={() => setSelectedWidget(null)}>Close</button>
          </div>
          <pre style={{ margin: 0, padding: 'var(--space-3)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' }}>
            {JSON.stringify(selectedWidget.manifest || {}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

