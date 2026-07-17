'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Store, Download, Star } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function MarketplacePage() {
  const client = useApiClient();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMarketplace = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await client.get<any[]>('/builder/governance/marketplace'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchMarketplace();
  }, [fetchMarketplace]);

  const columns = [
    { key: 'name', header: 'Extension Name' },
    { key: 'description', header: 'Description' },
    { key: 'author', header: 'Publisher' },
    { 
      key: 'downloads', 
      header: 'Installs',
      render: (row: any) => `${row.downloads} downloads`
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <button 
          className={`ui-btn ui-btn-primary ${styles.s1}`} 
          onClick={() => alert(`"${row.name}" has been enqueued for installation check. Custom schemas and dashboards will be injected.`)}
          
        >
          <Download size={12} /> Install
        </button>
      )
    }
  ];

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <RouteGuard permission="builder.marketplace.read">
    <div className="p-6 ui-stack-5">
      <PageHeader 
        title="App Store & Template Marketplace" 
        description="Browse community plugins, site layouts, templates, and integration extensions."
      />

      <div className={styles.s2}>
        <input 
          className="ui-input" 
          placeholder="Search templates & plugins..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="ui-card">
        {loading && items.length === 0 ? (
          <div className={styles.s3}>Loading extensions catalogue...</div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </div>
    </RouteGuard>
  );
}

