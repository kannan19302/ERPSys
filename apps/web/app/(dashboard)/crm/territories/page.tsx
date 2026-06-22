'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast } from '@unerp/ui';
import {
  Plus, X, MapPin, Users, DollarSign, TrendingUp,
  ChevronRight, AlertCircle, Award, Layers
} from 'lucide-react';

interface Territory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  managerId: string | null;
  parent?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
  children?: { id: string; name: string }[];
  _count?: { members: number; children: number };
  createdAt: string;
}

interface TerritoryPerformance {
  territoryId: string;
  territoryName: string;
  memberCount: number;
  dealCount: number;
  revenue: number;
}

export default function TerritoriesPage() {
  const [loading, setLoading] = useState(true);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [performance, setPerformance] = useState<TerritoryPerformance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [managerId, setManagerId] = useState('');

  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const [terrRes, perfRes] = await Promise.all([
        fetch('/api/v1/crm/territories', { headers }),
        fetch('/api/v1/crm/analytics/territory-performance', { headers }),
      ]);
      if (!terrRes.ok) throw new Error(`Request failed (${terrRes.status})`);
      const d = await terrRes.json();
      setTerritories(Array.isArray(d) ? d : (d?.data || []));
      if (perfRes.ok) {
        const p = await perfRes.json();
        setPerformance(Array.isArray(p) ? p : (p?.data || []));
      }
    } catch (err) {
      setError('Could not load territories. Please try again.');
      toast.error('Could not load territories', err instanceof Error ? err.message : undefined);
      setTerritories([]);
      setPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const payload = { name, description: description || undefined, parentId: parentId || undefined, managerId: managerId || undefined };

    try {
      const res = await fetch('/api/v1/crm/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setModalSuccess(true);
      toast.success('Territory created', `"${name}" has been added.`);
      setTimeout(() => { setIsModalOpen(false); resetForm(); loadData(); }, 1200);
    } catch (err) {
      toast.error('Could not create territory', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => { setName(''); setDescription(''); setParentId(''); setManagerId(''); setModalSuccess(false); };

  const totalMembers = territories.reduce((a, t) => a + (t._count?.members || 0), 0);
  const sortedPerf = [...performance].sort((a, b) => b.revenue - a.revenue);
  const topTerritory = sortedPerf[0];

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' };
  const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' };
  const thStyle: React.CSSProperties = { textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' };
  const tdStyle: React.CSSProperties = { padding: 'var(--space-3.5) var(--space-4)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Territories"
        description="Manage sales territories, assign members, and track regional performance."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Territories' }]}
        actions={
          <Button onClick={() => setIsModalOpen(true)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} />
            <span>New Territory</span>
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-warning-text)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { icon: <MapPin size={20} />, label: 'Total Territories', value: territories.length, color: 'var(--color-primary)' },
          { icon: <Users size={20} />, label: 'Total Members', value: totalMembers, color: 'var(--color-info)' },
          { icon: <DollarSign size={20} />, label: 'Top Revenue Territory', value: topTerritory ? topTerritory.territoryName : 'N/A', sub: topTerritory ? `$${topTerritory.revenue.toLocaleString()}` : '', color: 'var(--color-success)' },
        ].map((kpi, i) => (
          <Card key={i}>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: kpi.color, opacity: 0.12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', color: kpi.color }}>{kpi.icon}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>{kpi.label}</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>{kpi.value}</div>
                {kpi.sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success-text)', fontWeight: 'var(--weight-semibold)' }}>{kpi.sub}</div>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Territory Cards */}
      <Card>
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Territory Hierarchy</h3>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
        ) : territories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <MapPin size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Territories Found</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Create a territory to organize your sales regions.</div>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {territories.map(t => (
              <div key={t.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)' }}>{t.name}</div>
                  <Badge variant="default">{t._count?.members || 0} members</Badge>
                </div>
                {t.description && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>{t.description}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1.5)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {t.parent && <div><span style={{ fontWeight: 'var(--weight-semibold)' }}>Parent:</span> {t.parent.name}</div>}
                  {t.manager && <div><span style={{ fontWeight: 'var(--weight-semibold)' }}>Manager:</span> {t.manager.name}</div>}
                  <div><span style={{ fontWeight: 'var(--weight-semibold)' }}>Sub-territories:</span> {t._count?.children || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Performance Table */}
      {sortedPerf.length > 0 && (
        <Card>
          <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Territory Performance</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={thStyle}>Territory</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Members</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Deals</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedPerf.map(p => (
                  <tr key={p.territoryId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 'var(--weight-semibold)' }}>{p.territoryName}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{p.memberCount}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{p.dealCount}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'var(--weight-bold)', color: 'var(--color-success-text)' }}>${p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '500px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Create Territory</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            {modalSuccess ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <Award size={48} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-4) auto' }} />
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Territory Created Successfully</div>
              </div>
            ) : (
              <form onSubmit={handleCreate} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Territory Name</label>
                  <input type="text" required placeholder="e.g. US West Coast" value={name} onChange={e => setName(e.target.value)} className="frappe-input" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea placeholder="Describe this territory..." value={description} onChange={e => setDescription(e.target.value)} className="frappe-input" style={{ ...inputStyle, height: '70px', padding: 'var(--space-2) var(--space-3)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={labelStyle}>Parent Territory</label>
                    <select value={parentId} onChange={e => setParentId(e.target.value)} className="frappe-input" style={inputStyle}>
                      <option value="">None (Root)</option>
                      {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Manager ID</label>
                    <input type="text" placeholder="User ID" value={managerId} onChange={e => setManagerId(e.target.value)} className="frappe-input" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Territory'}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
