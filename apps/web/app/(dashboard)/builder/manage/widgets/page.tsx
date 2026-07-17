'use client';
import styles from './page.module.css';
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
        <div className={styles.s1}>
          <button 
            className={`ui-btn ${styles.s2}`}
            onClick={() => setSelectedWidget(row)}
            
          >
            Inspect Manifest
          </button>
          <button 
            className={`ui-btn ${styles.s3}`}
            onClick={() => deleteItem(row.id)}
            
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
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Custom Widget SDK & Extensibility"
        description="Register custom layout elements, configure widget manifest properties, and setup secure iframe embeds."
        actions={
          <button className="ui-btn ui-btn-primary" onClick={handleRegister}>
            <Plus size={14} /> Register Widget
          </button>
        }
      />

      <div className="ui-card">
        <DataTable columns={columns} data={widgets} />
      </div>

      {selectedWidget && (
        <div className="ui-card p-5">
          <div className="ui-flex-between mb-4">
            <h4 className={styles.s4}>Manifest JSON: {selectedWidget.name}</h4>
            <button className="ui-btn" onClick={() => setSelectedWidget(null)}>Close</button>
          </div>
          <pre className={styles.s5}>
            {JSON.stringify(selectedWidget.manifest || {}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

