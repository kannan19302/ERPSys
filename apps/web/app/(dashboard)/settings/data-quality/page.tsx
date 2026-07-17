'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { SearchCheck, Loader2, ChevronDown, ChevronRight, Filter, Merge, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface DuplicateRecord {
  id: string;
  label: string;
  fields: Record<string, string>;
}

interface DuplicateSet {
  id: string;
  entityType: string;
  matchScore: number;
  matchedFields: string[];
  status: 'PENDING' | 'MERGED' | 'DISMISSED';
  records: DuplicateRecord[];
  createdAt: string;
}

interface Stats {
  pending: number;
  merged: number;
  dismissed: number;
}

const ENTITY_TYPES = ['Customer', 'Vendor', 'Product', 'Employee'] as const;

export default function DataQualityPage() {
  const client = useApiClient();
  const [duplicates, setDuplicates] = useState<DuplicateSet[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, merged: 0, dismissed: 0 });
  const [filterEntity, setFilterEntity] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [scanning, setScanning] = useState<Record<string, boolean>>({});
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  const [mergeModal, setMergeModal] = useState<DuplicateSet | null>(null);
  const [selectedMaster, setSelectedMaster] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterEntity) params.set('entityType', filterEntity);
      if (filterStatus) params.set('status', filterStatus);
      const res = await client.get<{ data: DuplicateSet[]; stats: Stats }>(`/admin/data-quality/duplicates?${params}`);
      setDuplicates(res.data);
      setStats(res.stats);
    } catch (e) {
      console.error('Error fetching duplicates', e);
    } finally {
      setLoading(false);
    }
  }, [filterEntity, filterStatus, client]);

  useEffect(() => { void fetchDuplicates(); }, [fetchDuplicates]);

  const handleScan = async (entityType: string) => {
    setScanning(s => ({ ...s, [entityType]: true }));
    try {
      await client.post(`/admin/data-quality/scan/${entityType.toLowerCase()}`);
      await fetchDuplicates();
    } catch (e) {
      console.error('Scan error', e);
    } finally {
      setScanning(s => ({ ...s, [entityType]: false }));
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await client.post(`/admin/data-quality/${id}/dismiss`);
      await fetchDuplicates();
    } catch (e) {
      console.error('Dismiss error', e);
    }
  };

  const handleMerge = async () => {
    if (!mergeModal || !selectedMaster) return;
    try {
      await client.post('/admin/data-quality/merge', { setId: mergeModal.id, masterId: selectedMaster });
      setMergeModal(null);
      setSelectedMaster('');
      await fetchDuplicates();
    } catch (e) {
      console.error('Merge error', e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const badgeColor = (type: string) => {
    const colors: Record<string, string> = { Customer: '#3b82f6', Vendor: '#8b5cf6', Product: '#f59e0b', Employee: '#10b981' };
    return colors[type] || 'var(--color-text-secondary)';
  };

  return (
    <RouteGuard permission="settings.data-quality.read">
    <div className={styles.s1}>
      {/* Header */}
      <div className={styles.s2}>
        <SearchCheck size={28} className="ui-text-primary" />
        <h1 className={styles.s3}>
          Data Quality &amp; Duplicate Detection
        </h1>
      </div>

      {/* Stats */}
      <div className={styles.s4}>
        {[
          { label: 'Pending', value: stats.pending, icon: <AlertTriangle size={18} />, color: '#f59e0b' },
          { label: 'Merged', value: stats.merged, icon: <Merge size={18} />, color: '#10b981' },
          { label: 'Dismissed', value: stats.dismissed, icon: <X size={18} />, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} className={styles.s5}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div className={styles.s6}>{s.value}</div>
              <div className="ui-text-sm-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Entity Scan Cards */}
      <div className={styles.s7}>
        {ENTITY_TYPES.map(type => (
          <div key={type} className={styles.s8}>
            <div className={styles.s9}>{type}</div>
            <button
              onClick={() => handleScan(type)}
              disabled={scanning[type]}
              style={{ background: scanning[type] ? 'var(--color-bg-tertiary)' : 'var(--color-primary)', color: scanning[type] ? 'var(--color-text-secondary)' : '#fff', cursor: scanning[type] ? 'not-allowed' : 'pointer' }} className={styles.s10}
            >
              {scanning[type] && <Loader2 size={14} className={styles.s34} />}
              {scanning[type] ? 'Scanning...' : 'Scan for Duplicates'}
            </button>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.s11}>
        <Filter size={16} className="ui-text-muted" />
        <select
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
          className={styles.s12}
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className={styles.s12}
        >
          <option value="PENDING">Pending</option>
          <option value="MERGED">Merged</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="">All Statuses</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className={styles.s13}>
          <Loader2 size={24} className={styles.s35} />
          <div>Loading duplicates...</div>
        </div>
      ) : duplicates.length === 0 ? (
        <div className={styles.s13}>
          <CheckCircle size={32} className={styles.s36} />
          <div>No duplicate sets found.</div>
        </div>
      ) : (
        <div className="ui-stack-3">
          {duplicates.map(set => (
            <div key={set.id} className={styles.s14}>
              <div
                className={styles.s15}
                onClick={() => toggleExpand(set.id)}
              >
                {expandedSets.has(set.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span style={{ background: badgeColor(set.entityType) }} className={styles.s16}>
                  {set.entityType}
                </span>
                <span className={styles.s17}>
                  {set.matchScore}% match
                </span>
                <span className="ui-text-xs-muted">
                  Fields: {set.matchedFields.join(', ')}
                </span>
                <span className={styles.s18}>
                  {set.records.length} records
                </span>
                {set.status === 'PENDING' && (
                  <div className="ui-flex ui-gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setMergeModal(set); setSelectedMaster(set.records[0]?.id || ''); }}
                      className={styles.s19}
                    >
                      Merge
                    </button>
                    <button
                      onClick={() => handleDismiss(set.id)}
                      className={styles.s20}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
              {expandedSets.has(set.id) && (
                <div className={styles.s21}>
                  <ListPageTemplate
                    columns={[
                      { key: 'id', header: 'Record ID', render: (v) => <span className={styles.s22}>{String(v)}</span> },
                      { key: 'label', header: 'Label' },
                    ] as ListColumn[]}
                    data={set.records as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No records"
                    emptyDescription=""
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Merge Modal */}
      {mergeModal && (
        <div className={styles.s23}>
          <div className={styles.s24}>
            <div className="ui-flex-between mb-4">
              <h2 className={styles.s25}>Select Master Record</h2>
              <button onClick={() => setMergeModal(null)} className="ui-btn-icon ui-text-muted"><X size={20} /></button>
            </div>
            <p className={styles.s26}>
              Choose the record to keep. Other records will be merged into it.
            </p>
            <div className={styles.s27}>
              {mergeModal.records.map(r => (
                <label key={r.id} style={{ background: selectedMaster === r.id ? 'var(--color-bg-tertiary)' : 'transparent' }} className={styles.s28}>
                  <input type="radio" name="master" value={r.id} checked={selectedMaster === r.id} onChange={() => setSelectedMaster(r.id)} />
                  <div>
                    <div className={styles.s29}>{r.label}</div>
                    <div className={styles.s30}>{r.id}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className={styles.s31}>
              <button onClick={() => setMergeModal(null)} className={styles.s32}>Cancel</button>
              <button onClick={handleMerge} className={styles.s33}>Merge Records</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
    </RouteGuard>
  );
}
