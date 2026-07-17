'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { History, ArrowLeftRight, RotateCcw, AlertTriangle, Cpu } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function ReleasesPage() {
  const client = useApiClient();
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
      const data = await client.get<any>('/builder/modules');
      const list = Array.isArray(data) ? data : (data.data || []);
      setApps(list);
      if (list.length > 0) {
        setSelectedAppId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [client]);

  const fetchReleases = useCallback(async (appId: string) => {
    if (!appId) return;
    setLoading(true);
    try {
      setReleases(await client.get(`/builder/modules/${appId}/releases`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [client]);

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
      setDiffData(await client.get(`/builder/modules/${selectedAppId}/releases/${releaseId}/diff`));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRollback = async (releaseId: string) => {
    setRollingBack(true);
    try {
      await client.post(`/builder/modules/${selectedAppId}/rollback`, { releaseId });
      fetchReleases(selectedAppId);
      setDiffData(null);
      setSelectedReleaseId('');
    } catch (e) {
      console.error(e);
    } finally {
      setRollingBack(false);
    }
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="App Releases & Version Diff"
        description="Browse versioned release snapshots of your apps, compare changes, and roll back to any prior version."
        actions={
          <div className="ui-hstack-3">
            <span className={styles.s1}>Select App:</span>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              className={`ui-input ${styles.s2}`}
              
            >
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.version})</option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className={styles.s3}>Loading release logs...</div>
      ) : releases.length === 0 ? (
        <div className={`ui-card ${styles.s4}`} >
          <History size={48} className={styles.s5} />
          <h3 className={styles.s6}>No Releases Found</h3>
          <p className="ui-text-sm-muted">This custom application has not been published yet. Go to App Studio and cut a new release.</p>
        </div>
      ) : (
        <div className={styles.s7}>
          {/* Release History List */}
          <div className="ui-card p-4">
            <h3 className={styles.s8}>Release Timeline</h3>
            <div className="ui-stack-3">
              {releases.map((r: any) => {
                const isCurrent = selectedApp?.currentReleaseId === r.id;
                const isSelected = selectedReleaseId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => loadDiff(r.id)}
                    style={{ border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: isCurrent ? 'var(--color-primary-bg)' : 'var(--color-bg)' }} className={styles.s9}
                  >
                    <div className={styles.s10}>
                      <span className={styles.s11}>v{r.version}</span>
                      <div className={styles.s12}>
                        {isCurrent && <span className={styles.s13}>ACTIVE</span>}
                        {r.status === 'ROLLED_BACK' && <span className={styles.s14}>SUPERSEDED</span>}
                      </div>
                    </div>
                    <p className={styles.s15}>{r.changelog || 'No changelog provided.'}</p>
                    <div className={styles.s16}>
                      <span>By: {r.publishedBy || 'System'} · {new Date(r.publishedAt).toLocaleString()}</span>
                      {!isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRollbackConfirm(r);
                          }}
                          className={`ui-btn ${styles.s17}`}
                          
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
          <div className={`ui-card ${styles.s18}`} >
            <h3 className={styles.s19}>
              <ArrowLeftRight size={14} /> Compare with Live Draft
            </h3>
            {diffData ? (
              <div className={styles.s20}>
                <div className={styles.s21}>
                  <div className={styles.s22}>Summary Structure Metric</div>
                  <div className={styles.s23}>
                    <div className={styles.s24}>
                      <div className="ui-text-xs-soft">Components</div>
                      <div className={styles.s25}>{diffData.snapshot.componentsCount} vs {diffData.live.componentsCount}</div>
                    </div>
                    <div className={styles.s24}>
                      <div className="ui-text-xs-soft">Pages</div>
                      <div className={styles.s25}>{diffData.snapshot.pagesCount} vs {diffData.live.pagesCount}</div>
                    </div>
                    <div className={styles.s24}>
                      <div className="ui-text-xs-soft">Data Models</div>
                      <div className={styles.s25}>{diffData.snapshot.dataModelsCount} vs {diffData.live.dataModelsCount}</div>
                    </div>
                  </div>
                </div>

                <div className={styles.s26}>
                  <span className={styles.s1}>Snapshot JSON Payload</span>
                  <pre className={styles.s27}>
                    {JSON.stringify(diffData.snapshotDetails, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className={styles.s28}>
                <ArrowLeftRight size={32} className={styles.s29} />
                <span className="text-sm">Select a release on the left to view structural diff against live app definition.</span>
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
