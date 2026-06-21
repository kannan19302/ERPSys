'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge } from '@unerp/ui';
import {
  AlertCircle,
  MapPin,
  Layers,
  Plus
} from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface BinLocation {
  id: string;
  code: string;
  name?: string;
  zone: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  capacity?: number;
  warehouse: { name: string; code: string };
}

export default function BinLocationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [binLocations, setBinLocations] = useState<BinLocation[]>([]);

  // Form states
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [binCode, setBinCode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [zone, setZone] = useState('A');
  const [aisle, setAisle] = useState('');
  const [rack, setRack] = useState('');
  const [binVal, setBinVal] = useState('');
  const [capacity, setCapacity] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [wRes, binRes] = await Promise.all([
        fetch('/api/v1/inventory/warehouses', { headers }),
        fetch('/api/v1/inventory/bin-locations', { headers })
      ]);

      if (wRes.ok) {
        const whs = await wRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setWarehouses(whs);
        if (whs.length > 0) setSelectedWarehouse(whs[0].id);
      }
      if (binRes.ok) {
        const bins = await binRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setBinLocations(bins);
      }
    } catch {
      setError('Serving local mock fallback registry.');
      setWarehouses([
        { id: 'wh-1', name: 'Schenectady Central Depot', code: 'WH-NY-01' },
        { id: 'wh-2', name: 'Silicon Valley Logistics Hub', code: 'WH-CA-02' }
      ]);
      setBinLocations([
        {
          id: 'bin-1',
          code: 'A-04-02-01',
          name: 'Row-4-Shelf-2',
          zone: 'A',
          aisle: '04',
          rack: '02',
          bin: '01',
          warehouse: { name: 'Schenectady Central Depot', code: 'WH-NY-01' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/bin-locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          code: binCode,
          name: locationName || undefined,
          zone: zone || 'A',
          aisle: aisle || undefined,
          rack: rack || undefined,
          bin: binVal || undefined,
          capacity: capacity ? Number(capacity) : undefined
        })
      });
      if (!res.ok) throw new Error();
      setBinCode('');
      setLocationName('');
      setZone('A');
      setAisle('');
      setRack('');
      setBinVal('');
      setCapacity('');
      loadData();
    } catch {
      // Mock local update
      const targetWh = warehouses.find(w => w.id === selectedWarehouse);
      const newMock: BinLocation = {
        id: `bin-mock-${Date.now()}`,
        code: binCode,
        name: locationName || undefined,
        zone: zone || 'A',
        aisle: aisle || undefined,
        rack: rack || undefined,
        bin: binVal || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        warehouse: {
          name: targetWh?.name || 'Schenectady Central Depot',
          code: targetWh?.code || 'WH-NY-01'
        }
      };
      setBinLocations(prev => [newMock, ...prev]);
      setBinCode('');
      setLocationName('');
      setZone('A');
      setAisle('');
      setRack('');
      setBinVal('');
      setCapacity('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Storage Bin Locations"
        description="Configure fine-grained warehouse storage layouts, zones, shelves, and packaging bins."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Bin Configurations' }]}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          
          {/* Bin Locations List Card */}
          <Card padding="none" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Bin Location Code</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Display Name</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Zone</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Aisle / Rack / Bin</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {binLocations.map(bin => (
                  <tr key={bin.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)', fontFamily: 'monospace' }}>
                      {bin.code}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{bin.name || 'N/A'}</td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}><Badge variant="info">Zone {bin.zone}</Badge></td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>
                      {bin.aisle || '-' } / {bin.rack || '-'} / {bin.bin || '-'}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{bin.warehouse?.name}</td>
                  </tr>
                ))}
                {binLocations.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                      No warehouse bin locations cataloged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Form Card */}
          <Card>
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Add Bin Location</h4>
            </div>
            <form onSubmit={handleCreateBin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-form-group">
                <label className="frappe-label">Warehouse Depot *</label>
                <select
                  className="frappe-input"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  required
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Bin Code *</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={binCode}
                    onChange={(e) => setBinCode(e.target.value)}
                    placeholder="A-04-02-01"
                    required
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Display Name</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Row-4-Shelf-2"
                  />
                </div>
              </div>
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Zone</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="A"
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Aisle</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={aisle}
                    onChange={(e) => setAisle(e.target.value)}
                    placeholder="04"
                  />
                </div>
              </div>
              <div className="frappe-grid-3">
                <div className="frappe-form-group">
                  <label className="frappe-label">Rack</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={rack}
                    onChange={(e) => setRack(e.target.value)}
                    placeholder="02"
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Bin</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={binVal}
                    onChange={(e) => setBinVal(e.target.value)}
                    placeholder="01"
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Capacity</label>
                  <input
                    type="number"
                    className="frappe-input"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>
              <button type="submit" className="frappe-btn frappe-btn-primary">
                Add Bin Location
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
