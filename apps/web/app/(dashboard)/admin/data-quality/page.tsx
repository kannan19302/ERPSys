'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SearchCheck, Loader2, ChevronDown, ChevronRight, Filter, Merge, X, CheckCircle, AlertTriangle } from 'lucide-react';

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

const API_BASE = '/api/v1/admin/data-quality';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const ENTITY_TYPES = ['Customer', 'Vendor', 'Product', 'Employee'] as const;

export default function DataQualityPage() {
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
      const res = await apiFetch<{ data: DuplicateSet[]; stats: Stats }>(`/duplicates?${params}`);
      setDuplicates(res.data);
      setStats(res.stats);
    } catch (e) {
      console.error('Error fetching duplicates', e);
    } finally {
      setLoading(false);
    }
  }, [filterEntity, filterStatus]);

  useEffect(() => { fetchDuplicates(); }, [fetchDuplicates]);

  const handleScan = async (entityType: string) => {
    setScanning(s => ({ ...s, [entityType]: true }));
    try {
      await apiFetch(`/scan/${entityType.toLowerCase()}`, { method: 'POST' });
      await fetchDuplicates();
    } catch (e) {
      console.error('Scan error', e);
    } finally {
      setScanning(s => ({ ...s, [entityType]: false }));
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await apiFetch(`/${id}/dismiss`, { method: 'POST' });
      await fetchDuplicates();
    } catch (e) {
      console.error('Dismiss error', e);
    }
  };

  const handleMerge = async () => {
    if (!mergeModal || !selectedMaster) return;
    try {
      await apiFetch('/merge', { method: 'POST', body: JSON.stringify({ setId: mergeModal.id, masterId: selectedMaster }) });
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
    <div style={{ padding: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <SearchCheck size={28} style={{ color: 'var(--color-primary)' }} />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
          Data Quality &amp; Duplicate Detection
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Pending', value: stats.pending, icon: <AlertTriangle size={18} />, color: '#f59e0b' },
          { label: 'Merged', value: stats.merged, icon: <Merge size={18} />, color: '#10b981' },
          { label: 'Dismissed', value: stats.dismissed, icon: <X size={18} />, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Entity Scan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {ENTITY_TYPES.map(type => (
          <div key={type} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>{type}</div>
            <button
              onClick={() => handleScan(type)}
              disabled={scanning[type]}
              style={{
                background: scanning[type] ? 'var(--color-bg-tertiary)' : 'var(--color-primary)',
                color: scanning[type] ? 'var(--color-text-secondary)' : '#fff',
                border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)',
                cursor: scanning[type] ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              }}
            >
              {scanning[type] && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {scanning[type] ? 'Scanning...' : 'Scan for Duplicates'}
            </button>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
        <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <select
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
        >
          <option value="PENDING">Pending</option>
          <option value="MERGED">Merged</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="">All Statuses</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 'var(--space-2)' }} />
          <div>Loading duplicates...</div>
        </div>
      ) : duplicates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
          <CheckCircle size={32} style={{ marginBottom: 'var(--space-2)' }} />
          <div>No duplicate sets found.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {duplicates.map(set => (
            <div key={set.id} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div
                style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}
                onClick={() => toggleExpand(set.id)}
              >
                {expandedSets.has(set.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span style={{ background: badgeColor(set.entityType), color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  {set.entityType}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                  {set.matchScore}% match
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Fields: {set.matchedFields.join(', ')}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                  {set.records.length} records
                </span>
                {set.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setMergeModal(set); setSelectedMaster(set.records[0]?.id || ''); }}
                      style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 'var(--weight-medium)' }}
                    >
                      Merge
                    </button>
                    <button
                      onClick={() => handleDismiss(set.id)}
                      style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 'var(--weight-medium)' }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
              {expandedSets.has(set.id) && (
                <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-4)', background: 'var(--color-bg-primary)' }}>
                  <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 'var(--space-2)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', borderBottom: '1px solid var(--color-border)' }}>Record ID</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-2)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', borderBottom: '1px solid var(--color-border)' }}>Label</th>
                      </tr>
                    </thead>
                    <tbody>
                      {set.records.map(r => (
                        <tr key={r.id}>
                          <td style={{ padding: 'var(--space-2)', color: 'var(--color-text-primary)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{r.id}</td>
                          <td style={{ padding: 'var(--space-2)', color: 'var(--color-text-primary)' }}>{r.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Merge Modal */}
      {mergeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', width: 480, maxHeight: '80vh', overflow: 'auto', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>Select Master Record</h2>
              <button onClick={() => setMergeModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Choose the record to keep. Other records will be merged into it.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {mergeModal.records.map(r => (
                <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: selectedMaster === r.id ? 'var(--color-bg-tertiary)' : 'transparent' }}>
                  <input type="radio" name="master" value={r.id} checked={selectedMaster === r.id} onChange={() => setSelectedMaster(r.id)} />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)' }}>{r.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{r.id}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button onClick={() => setMergeModal(null)} style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
              <button onClick={handleMerge} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Merge Records</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
