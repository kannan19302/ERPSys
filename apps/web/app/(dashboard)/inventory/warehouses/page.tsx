'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import {
  Search,
  AlertCircle,
  Warehouse,
  MapPin,
  Building,
  Plus
} from 'lucide-react';

interface WarehouseData {
  id: string;
  code: string;
  name: string;
  address: string | null;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/inventory/warehouses', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWarehouses(Array.isArray(data) ? data : (data?.data || []));
    } catch {
      setError('Serving local mock fallback registry.');
      setWarehouses([
        {
          id: 'wh-1',
          code: 'WH-NY-01',
          name: 'Schenectady Central Depot',
          address: '404 Industrial Blvd, Schenectady, NY'
        },
        {
          id: 'wh-2',
          code: 'WH-CA-02',
          name: 'Silicon Valley Logistics Hub',
          address: '101 Innovation Way, San Jose, CA'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = warehouses.filter(w =>
    w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.address && w.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Warehouse Directory"
        description="View and manage corporate storage units, physical depots, and transit distribution zones."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Warehouse Directory' }]}
        actions={
          <Button variant="primary" onClick={() => window.location.href = '/inventory/advanced?tab=bins'} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={14} />
            Configure Bins
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Total Depots</span>
            <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }}>
              <Warehouse size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {warehouses.length}
          </h4>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Active Regions</span>
            <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '4px', borderRadius: '4px' }}>
              <MapPin size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {new Set(warehouses.map(w => w.address?.split(',').slice(-1)[0]?.trim() || 'General')).size}
          </h4>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Fulfilled Locations</span>
            <div style={{ background: 'var(--color-info-light)', color: 'var(--color-info)', padding: '4px', borderRadius: '4px' }}>
              <Building size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {warehouses.filter(w => w.address).length}
          </h4>
        </Card>
      </div>

      {/* Search Input Box */}
      <Card padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="frappe-input"
            placeholder="Search warehouses by code, name, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 'var(--space-9)' }}
          />
        </div>
      </Card>

      {/* Warehouse Directory Table */}
      <Card padding="none" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner size="lg" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <Warehouse size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
            <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>No Depots Found</h4>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No warehouses recorded in the system catalog.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Code</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Depot Name</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Logistics Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)' }}>{w.code}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>{w.name}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{w.address || 'Central Address'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
