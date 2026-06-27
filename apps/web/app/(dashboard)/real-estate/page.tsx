'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  RefreshCw, 
  FileText, 
  Sparkles,
  Search,
  Key,
  DollarSign
} from 'lucide-react';
import { Card, PageHeader, Button, Spinner, DashboardKPICard, DashboardChart, ViewSwitcher, type ViewMode } from '@unerp/ui';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'leases'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('chart');

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

  // Computations
  const totalProperties = properties.length;
  const activeLeases = useMemo(() => leases.filter(l => l.status === 'ACTIVE').length, [leases]);
  const monthlyRentRoll = useMemo(() => leases.reduce((sum, l) => sum + Number(l.rentAmount), 0), [leases]);
  const occupancyRate = useMemo(() => {
    if (totalProperties === 0) return 0;
    // count properties that have an active lease
    const leasedPropertyNames = new Set(leases.filter(l => l.status === 'ACTIVE').map(l => l.property.name));
    let activeLeasedCount = 0;
    properties.forEach(p => {
      if (leasedPropertyNames.has(p.name) || p.status === 'OCCUPIED') {
        activeLeasedCount++;
      }
    });
    return Math.round((activeLeasedCount / totalProperties) * 100);
  }, [properties, leases]);

  // Chart data
  const propertyStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [properties]);

  const portfolioDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(p => {
      counts[p.portfolio] = (counts[p.portfolio] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [properties]);

  const leaseRentData = useMemo(() => {
    return leases.slice(0, 8).map(l => ({
      name: l.tenantName.substring(0, 12),
      Rent: Number(l.rentAmount)
    }));
  }, [leases]);

  const filteredProperties = properties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.portfolio.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <Spinner size="lg" />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Property Registry...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Header */}
      <PageHeader
        title="Real Estate & Leasing Workspace"
        description="Track property portfolio registries, manage tenant lease lifecycle agreements, and monitor maintenance work orders."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Real Estate' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button onClick={handleCreateLease} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FileText size={16} /> Register Lease
            </Button>
            <Button onClick={handleCreateProperty} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Building2 size={16} /> Add Property
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <DashboardKPICard
          title="Total Properties"
          value={String(totalProperties)}
          icon={<Building2 size={18} />}
          color="var(--color-primary)"
          drillDown={{
            modalTitle: 'Properties Catalog',
            columns: [
              { key: 'name', label: 'Property Name' },
              { key: 'portfolio', label: 'Portfolio' },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status' }
            ],
            rows: properties.map(p => ({ ...p }))
          }}
        />
        <DashboardKPICard
          title="Active Leases"
          value={String(activeLeases)}
          icon={<Key size={18} />}
          color="var(--color-success)"
          drillDown={{
            modalTitle: 'Active Lease Contracts',
            columns: [
              { key: 'tenantName', label: 'Tenant Name' },
              { key: 'rentAmount', label: 'Rent', render: (v) => `$${Number(v).toLocaleString()}/mo` },
              { key: 'status', label: 'Status' }
            ],
            rows: leases.filter(l => l.status === 'ACTIVE').map(l => ({ ...l }))
          }}
        />
        <DashboardKPICard
          title="Monthly Rent Roll"
          value={`$${monthlyRentRoll.toLocaleString()}`}
          icon={<DollarSign size={18} />}
          color="var(--color-info-text)"
          drillDown={{
            modalTitle: 'Lease Rent Roll Details',
            columns: [
              { key: 'tenantName', label: 'Tenant Name' },
              { key: 'propertyName', label: 'Property Unit' },
              { key: 'rentAmount', label: 'Monthly Rent', render: (v) => `$${Number(v).toLocaleString()}` }
            ],
            rows: leases.filter(l => l.status === 'ACTIVE').map(l => {
              const matchedProp = properties.find((p: any) => p.id === l.propertyId);
              return {
                ...l,
                propertyName: matchedProp ? matchedProp.name : '—'
              };
            })
          }}
        />
        <DashboardKPICard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          icon={<Building2 size={18} />}
          color="var(--color-warning-text)"
          progress={occupancyRate}
          drillDown={{
            modalTitle: 'Unit Occupancy Status',
            columns: [
              { key: 'name', label: 'Property Name' },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status' }
            ],
            rows: properties.map(p => ({ ...p }))
          }}
        />
      </div>

      {/* Chart View */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart
            title="Property Occupancy Status"
            subtitle="Properties grouped by occupancy status"
            data={propertyStatusData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Properties' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut"
            allowedChartTypes={['donut', 'pie', 'bar']}
            height={280}
          />
          <DashboardChart
            title="Portfolio Properties Share"
            subtitle="Number of units by investment portfolio"
            data={portfolioDistributionData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Units', color: '#8b5cf6' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'donut', 'pie']}
            height={280}
          />
          <DashboardChart
            title="Leases Rent Breakdown"
            subtitle="Monthly rent revenue by tenant contract"
            data={leaseRentData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'Rent', name: 'Monthly Rent', color: '#10b981' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'line', 'area']}
            height={280}
          />
        </div>
      )}

      {/* Standard List/Details Views */}
      {activeView === 'list' && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
                borderBottom: activeTab === 'dashboard' ? '2px solid var(--color-primary)' : 'none',
                color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}
            >
              Dashboard View
            </button>
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
              {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    Welcome to the Real Estate Workspace. Select a tab above to manage property listings or tenant lease rosters.
                  </p>
                </div>
              )}

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
                      className="frappe-input"
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
        </>
      )}
    </div>
  );
}
