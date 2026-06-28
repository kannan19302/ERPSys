'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { History, ArrowLeftRight, RotateCcw, AlertTriangle, Cpu } from 'lucide-react';

export default function ReleasesPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [diffData, setDiffData] = useState<any>(null);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('');
  const [rollbackConfirm, setRollbackConfirm] = useState<any>(null);
  const [rollingBack, setRollingBack] = useState<boolean>(false);

  const fetchApps = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/modules', {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        setApps(list);
        if (list.length > 0) {
          setSelectedAppId(list[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchReleases = useCallback(async (appId: string) => {
    if (!appId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/modules/${appId}/releases`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setReleases(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    if (selectedAppId) {
      fetchReleases(selectedAppId);
      setDiffData(null);
      setSelectedReleaseId('');
    }
  }, [selectedAppId, fetchReleases]);

  const loadDiff = async (releaseId: string) => {
    setSelectedReleaseId(releaseId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/modules/${selectedAppId}/releases/${releaseId}/diff`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setDiffData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRollback = async (releaseId: string) => {
    setRollingBack(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/modules/${selectedAppId}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ releaseId })
      });
      if (res.ok) {
        fetchReleases(selectedAppId);
        setDiffData(null);
        setSelectedReleaseId('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRollingBack(false);
    }
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="App Releases & Version Diff"
        description="Browse versioned release snapshots of your apps, compare changes, and roll back to any prior version."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select App:</span>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              className="frappe-input"
              style={{ minWidth: 200 }}
            >
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.version})</option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading release logs...</div>
      ) : releases.length === 0 ? (
        <div className="frappe-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <History size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
          <h3 style={{ margin: '0 0 var(--space-2)' }}>No Releases Found</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>This custom application has not been published yet. Go to App Studio and cut a new release.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
          {/* Release History List */}
          <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-3) 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Release Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {releases.map((r: any) => {
                const isCurrent = selectedApp?.currentReleaseId === r.id;
                const isSelected = selectedReleaseId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => loadDiff(r.id)}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-lg)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isCurrent ? 'var(--color-primary-bg)' : 'var(--color-bg)',
                      cursor: 'pointer',
                      transition: 'all var(--duration-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'monospace' }}>v{r.version}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isCurrent && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', background: '#dcfce7', color: '#16a34a', borderRadius: 'var(--radius-full)' }}>ACTIVE</span>}
                        {r.status === 'ROLLED_BACK' && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', background: '#f3f4f6', color: '#6b7280', borderRadius: 'var(--radius-full)' }}>SUPERSEDED</span>}
                      </div>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-2) 0' }}>{r.changelog || 'No changelog provided.'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                      <span>By: {r.publishedBy || 'System'} · {new Date(r.publishedAt).toLocaleString()}</span>
                      {!isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRollbackConfirm(r);
                          }}
                          className="frappe-btn"
                          style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <RotateCcw size={10} /> Rollback
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Snapshot Diff Panel */}
          <div className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-3) 0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeftRight size={14} /> Compare with Live Draft
            </h3>
            {diffData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1 }}>
                <div style={{ background: 'var(--color-bg-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Summary Structure Metric</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                    <div style={{ background: 'white', padding: 8, borderRadius: 4, border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Components</div>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)' }}>{diffData.snapshot.componentsCount} vs {diffData.live.componentsCount}</div>
                    </div>
                    <div style={{ background: 'white', padding: 8, borderRadius: 4, border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Pages</div>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)' }}>{diffData.snapshot.pagesCount} vs {diffData.live.pagesCount}</div>
                    </div>
                    <div style={{ background: 'white', padding: 8, borderRadius: 4, border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Data Models</div>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)' }}>{diffData.snapshot.dataModelsCount} vs {diffData.live.dataModelsCount}</div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Snapshot JSON Payload</span>
                  <pre style={{
                    flex: 1,
                    background: 'var(--color-bg-sunken)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: '380px',
                    margin: 0
                  }}>
                    {JSON.stringify(diffData.snapshotDetails, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 'var(--space-12)', color: 'var(--color-text-tertiary)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <ArrowLeftRight size={32} style={{ marginBottom: 12 }} />
                <span style={{ fontSize: 'var(--text-sm)' }}>Select a release on the left to view structural diff against live app definition.</span>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!rollbackConfirm}
        onClose={() => setRollbackConfirm(null)}
        onConfirm={() => {
          if (rollbackConfirm) {
            handleRollback(rollbackConfirm.id);
            setRollbackConfirm(null);
          }
        }}
        title="Rollback Release"
        message={rollbackConfirm ? `Are you sure you want to restore and rollback to version v${rollbackConfirm.version}? Current active draft changes will be superseded.` : ''}
        confirmLabel="Restore Version"
        variant="danger"
      />
    </div>
  );
}
