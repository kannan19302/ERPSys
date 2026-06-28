'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Store, Download, Star } from 'lucide-react';

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMarketplace = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/governance/marketplace', {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

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
          className="frappe-btn frappe-btn-primary" 
          onClick={() => alert(`"${row.name}" has been enqueued for installation check. Custom schemas and dashboards will be injected.`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', padding: '4px 10px' }}
        >
          <Download size={12} /> Install
        </button>
      )
    }
  ];

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="App Store & Template Marketplace" 
        description="Browse community plugins, site layouts, templates, and integration extensions."
      />

      <div style={{ maxWidth: 360 }}>
        <input 
          className="frappe-input" 
          placeholder="Search templates & plugins..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="frappe-card">
        {loading && items.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading extensions catalogue...</div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </div>
  );
}

