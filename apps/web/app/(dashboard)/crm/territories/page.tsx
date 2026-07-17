'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, type Column, type SortOrder } from '@unerp/ui';
import {
  Plus, X, MapPin, Users, DollarSign, TrendingUp,
  ChevronRight, AlertCircle, Award, Layers, Trash2
} from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';

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
  const client = useApiClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [terrRes, perfRes] = await Promise.all([
        client.get<any>('/crm/territories'),
        client.get<any>('/crm/analytics/territory-performance'),
      ]);
      setTerritories(Array.isArray(terrRes) ? terrRes : (terrRes?.data || []));
      setPerformance(Array.isArray(perfRes) ? perfRes : (perfRes?.data || []));
    } catch (err) {
      setError('Could not load territories. Please try again.');
      toast.error('Could not load territories', err instanceof Error ? err.message : undefined);
      setTerritories([]);
      setPerformance([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { name, description: description || undefined, parentId: parentId || undefined, managerId: managerId || undefined };

    try {
      await client.post('/crm/territories', payload);
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

  const handleDeleteTerritory = async (t: Territory) => {
    if (!window.confirm(`Delete territory "${t.name}"? This cannot be undone.`)) return;
    try {
      await client.delete(`/crm/territories/${t.id}`);
      toast.success('Territory deleted.');
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete territory.');
    }
  };

  const [perfSortBy, setPerfSortBy] = useState<string>('revenue');
  const [perfSortOrder, setPerfSortOrder] = useState<SortOrder>('desc');
  const handlePerfSortChange = (key: string, order: SortOrder) => {
    setPerfSortBy(key);
    setPerfSortOrder(order);
  };

  const totalMembers = territories.reduce((a, t) => a + (t._count?.members || 0), 0);
  const sortedPerf = [...performance].sort((a, b) => {
    const key = perfSortBy as keyof TerritoryPerformance;
    const av = a[key], bv = b[key];
    let cmp = 0;
    if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    return perfSortOrder === 'desc' ? -cmp : cmp;
  });
  const topTerritory = [...performance].sort((a, b) => b.revenue - a.revenue)[0];

  const perfColumns: Column<TerritoryPerformance>[] = [
    { key: 'territoryName', header: 'Territory', sortable: true, render: (p) => <span className="font-semibold">{p.territoryName}</span> },
    { key: 'memberCount', header: 'Members', align: 'right', sortable: true },
    { key: 'dealCount', header: 'Deals', align: 'right', sortable: true },
    { key: 'revenue', header: 'Revenue', align: 'right', sortable: true, render: (p) => <span className={styles.style0}>${p.revenue.toLocaleString()}</span> },
  ];

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' };
  const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' };
  const thStyle: React.CSSProperties = { textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' };
  const tdStyle: React.CSSProperties = { padding: 'var(--space-3.5) var(--space-4)' };

  return (
    <RouteGuard permission="crm.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Territories"
          description="Manage sales territories, assign members, and track regional performance."
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Territories' }]}
          actions={
            <Button onClick={() => setIsModalOpen(true)} variant="primary" className="ui-hstack-2">
              <Plus size={16} />
              <span>New Territory</span>
            </Button>
          }
        />

        {error && (
          <div className={styles.style1}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* KPIs */}
        <div className={styles.style2}>
          {[
            { icon: <MapPin size={20} />, label: 'Total Territories', value: territories.length, color: 'var(--color-primary)' },
            { icon: <Users size={20} />, label: 'Total Members', value: totalMembers, color: 'var(--color-info)' },
            { icon: <DollarSign size={20} />, label: 'Top Revenue Territory', value: topTerritory ? topTerritory.territoryName : 'N/A', sub: topTerritory ? `$${topTerritory.revenue.toLocaleString()}` : '', color: 'var(--color-success)' },
          ].map((kpi, i) => (
            <Card key={i}>
              <div className="p-5 ui-hstack-4">
                <div style={{ background: kpi.color }} className={styles.s1}>
                  <div style={{ color: kpi.color }} className={styles.s2}>{kpi.icon}</div>
                </div>
                <div>
                  <div className={styles.style3}>{kpi.label}</div>
                  <div className={styles.style4}>{kpi.value}</div>
                  {kpi.sub && <div className={styles.style5}>{kpi.sub}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Territory Cards */}
        <Card>
          <div className={styles.style6}>
            <h3 className="ui-heading-base">Territory Hierarchy</h3>
          </div>
          {loading ? (
            <div className="ui-center-pad"><Spinner size="lg" /></div>
          ) : territories.length === 0 ? (
            <div className="ui-empty-state">
              <MapPin size={48} className="ui-hr-faded" />
              <div className="font-semibold">No Territories Found</div>
              <div className="text-sm">Create a territory to organize your sales regions.</div>
            </div>
          ) : (
            <div className={styles.style7}>
              {territories.map(t => (
                <div key={t.id} className={styles.style8}>
                  <div className={styles.style9}>
                    <div className={styles.style10}>{t.name}</div>
                    <div className="ui-hstack-2">
                      <Badge variant="default">{t._count?.members || 0} members</Badge>
                      <button title="Delete" onClick={() => handleDeleteTerritory(t)} className={styles.style11}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {t.description && <div className={styles.style12}>{t.description}</div>}
                  <div className={styles.style13}>
                    {t.parent && <div><span className="font-semibold">Parent:</span> {t.parent.name}</div>}
                    {t.manager && <div><span className="font-semibold">Manager:</span> {t.manager.name}</div>}
                    <div><span className="font-semibold">Sub-territories:</span> {t._count?.children || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Performance Table */}
        {sortedPerf.length > 0 && (
          <Card>
            <div className={styles.style14}>
              <h3 className="ui-heading-base">Territory Performance</h3>
            </div>
            <DataTable<TerritoryPerformance>
              columns={perfColumns}
              data={sortedPerf}
              rowKey={(p) => p.territoryId}
              sortBy={perfSortBy}
              sortOrder={perfSortOrder}
              onSortChange={handlePerfSortChange}
            />
          </Card>
        )}

        {/* Create Modal */}
        {isModalOpen && (
          <div className={styles.style15}>
            <div className={styles.style16}>
              <div className={styles.style17}>
                <h3 className="ui-heading-base">Create Territory</h3>
                <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
              </div>
              {modalSuccess ? (
                <div className={styles.style18}>
                  <Award size={48} className={styles.style19} />
                  <div className="ui-heading-base">Territory Created Successfully</div>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="p-6 ui-stack-4">
                  <div>
                    <label style={labelStyle}>Territory Name</label>
                    <input type="text" required placeholder="e.g. US West Coast" value={name} onChange={e => setName(e.target.value)} className="ui-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea placeholder="Describe this territory..." value={description} onChange={e => setDescription(e.target.value)} className={`ui-input ${styles.s3}`} style={{ ...inputStyle }} />
                  </div>
                  <div className="ui-grid-2">
                    <div>
                      <label style={labelStyle}>Parent Territory</label>
                      <select value={parentId} onChange={e => setParentId(e.target.value)} className="ui-input" style={inputStyle}>
                        <option value="">None (Root)</option>
                        {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Manager ID</label>
                      <input type="text" placeholder="User ID" value={managerId} onChange={e => setManagerId(e.target.value)} className="ui-input" style={inputStyle} />
                    </div>
                  </div>
                  <div className={styles.style20}>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Territory'}</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
