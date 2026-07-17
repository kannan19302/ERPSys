'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle, RefreshCw, AlertCircle, ArrowUpCircle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface ReleaseNote {
  version: string;
  date: string;
  fixes: string[];
}

interface UpdateStatus {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseNotes: ReleaseNote[];
}

export default function UpdatesPage() {
  const client = useApiClient();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      setStatus(await client.get<UpdateStatus>('/admin/platform/updates'));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUpdates();
  }, [client]);

  const handleCheckUpdates = async () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      void fetchUpdates();
    }, 1500);
  };

  return (
    <RouteGuard permission="settings.updates.read">
    <div className={styles.page}>
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Cpu className="ui-text-primary" />
            System Updates Manager
          </h1>
          <p className="ui-text-sm-muted">
            Check for core software version upgrades, view release logs, and manage automated upgrade triggers.
          </p>
        </div>
        <button onClick={handleCheckUpdates} disabled={checking || loading} className={styles.checkButton}>
          <RefreshCw size={12} className={checking || loading ? 'spin' : ''} />
          Check for updates
        </button>
      </div>

      {loading && !status ? (
        <div className="ui-flex-center p-8">
          <RefreshCw size={24} className="spin ui-text-muted" />
        </div>
      ) : status && (
        <div className="ui-stack-6">
          
          {/* Main Status Panel */}
          <div className={styles.statusPanel}>
            <div className={styles.statusDetails}>
              {status.updateAvailable ? (
                <ArrowUpCircle size={36} className="ui-text-primary" />
              ) : (
                <CheckCircle size={36} className="ui-text-success" />
              )}
              <div>
                <h2 className={styles.statusTitle}>
                  {status.updateAvailable ? 'Software Upgrade Available' : 'System Up To Date'}
                </h2>
                <p className={styles.statusDescription}>
                  Current Version: <strong>{status.currentVersion}</strong> • Latest Version: <strong>{status.latestVersion}</strong>
                </p>
              </div>
            </div>
            {status.updateAvailable && (
              <button className={styles.applyButton}>
                Apply Upgrade
              </button>
            )}
          </div>

          {/* Release Notes Changelog */}
          <div className="ui-card p-5">
            <h3 className={styles.releaseTitle}>
              Release Logs & Changelogs
            </h3>

            <div className="ui-stack-4">
              {status.releaseNotes.map((note, idx) => (
                <div key={idx} className={idx < status.releaseNotes.length - 1 ? styles.releaseNote : undefined}>
                  <div className={styles.releaseHeader}>
                    <strong className="text-sm">{note.version}</strong>
                    <span className="ui-text-micro ui-text-muted">Released on {note.date}</span>
                  </div>
                  <ul className={styles.releaseList}>
                    {note.fixes.map((fix, fIdx) => (
                      <li key={fIdx} className={styles.releaseItem}>
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
    </RouteGuard>
  );
}
