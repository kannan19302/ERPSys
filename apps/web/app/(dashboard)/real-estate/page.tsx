'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  RefreshCw, 
   
  FileText, 
  Sparkles,
  Search
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  type: string;
  portfolio: string;
  status: string;
}

interface Lease {
  id: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: string;
  property: {
    name: string;
  };
}

export default function RealEstatePage() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [activeTab, setActiveTab] = useState<'properties' | 'leases'>('properties');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, lRes] = await Promise.all([
        fetch('/api/v1/real-estate/properties', { headers }),
        fetch('/api/v1/real-estate/leases', { headers }),
      ]);

      const [pData, lData] = await Promise.all([
        pRes.json(), lRes.json()
      ]);

      setProperties(Array.isArray(pData) ? pData : []);
      setLeases(Array.isArray(lData) ? lData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProperty = async () => {
    const name = prompt('Enter Property Name (e.g. Unit 502):');
    if (!name) return;
    const portfolio = prompt('Enter Portfolio (e.g. Horizon Portfolio):');
    if (!portfolio) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/real-estate/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          type: 'COMMERCIAL',
          portfolio,
          address: JSON.stringify({ street: '100 Business Pkwy', city: 'Seattle' })
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to create property.');
      }
    } catch {
      alert('Error creating property.');
    }
  };

  const handleCreateLease = async () => {
    if (properties.length === 0) {
      alert('Must have properties registered to create leases.');
      return;
    }
    const tenantName = prompt('Enter Tenant Legal Name:');
    if (!tenantName) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/real-estate/leases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId: properties[0]?.id,
          tenantName,
          startDate: '2026-07-01',
          endDate: '2027-06-30',
          rentAmount: 2500,
          securityDeposit: 5000,
          billingFrequency: 'MONTHLY'
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to register lease.');
      }
    } catch {
      alert('Error registering lease.');
    }
  };

  const filteredProperties = properties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.portfolio.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Property Registry...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Building2 style={{ color: 'var(--color-primary)' }} />
            Real Estate & Leasing Workspace
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Track property portfolio registries, manage tenant lease lifecycle agreements, and monitor maintenance work orders.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleCreateLease} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <FileText size={16} style={{ color: 'var(--color-primary)' }} /> Register Lease
          </button>
          <button onClick={handleCreateProperty} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: '#ffffff', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            Add Property
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('properties')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'properties' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'properties' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Building2 size={16} /> Properties Catalog
        </button>
        <button 
          onClick={() => setActiveTab('leases')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'leases' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'leases' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <FileText size={16} /> Lease Contracts
        </button>
      </div>

      {/* Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'properties' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-9)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-xs)'
                  }}
                />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Property Name</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Portfolio</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Type</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{p.portfolio}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{p.type}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>
                        <span style={{ fontSize: 'var(--text-xxs)', fontWeight: 'bold', background: p.status === 'AVAILABLE' ? 'var(--color-primary-light)' : 'var(--color-bg)', color: p.status === 'AVAILABLE' ? 'var(--color-primary)' : 'var(--color-text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredProperties.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No properties found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'leases' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {leases.map(l => (
                  <div key={l.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Tenant: {l.tenantName}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Property: {l.property.name}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Period: {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>${Number(l.rentAmount).toLocaleString()}/mo</p>
                      <span style={{ fontSize: 'var(--text-xxs)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{l.status}</span>
                    </div>
                  </div>
                ))}
                {leases.length === 0 && (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No leases registered.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Rules info */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
            Property Portfolios
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            Rental invoices auto-generate monthly, posting dynamic lines to double-entry finance ledgers according to lease terms.
          </p>
        </div>

      </div>
    </div>
  );
}
