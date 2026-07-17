'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, RefreshCw, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './SessionsTab.module.css';

interface ActiveSession {
  id: string;
  userId: string;
  device: string | null;
  browser: string | null;
  ipAddress: string | null;
  location: string | null;
  startedAt: string;
  lastActivityAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function SessionsTab() {
  const client = useApiClient();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await client.get<ActiveSession[]>('/admin/security/sessions'));
    } catch (error) {
      setError(error instanceof Error ? `Failed to fetch sessions: ${error.message}` : 'Connection error fetching sessions');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const revokeSession = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await client.delete(`/admin/security/sessions/${id}`);
      setSuccess('Active session revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
      await fetchSessions();
    } catch (error) {
      setError(error instanceof Error ? `Failed to revoke session: ${error.message}` : 'Connection error revoking session');
    }
  };

  return (
    <div className={styles.s1}>
      {error && (
        <div className={styles.s2}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={styles.s3}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="ui-card p-5">
        <div className="ui-flex-between mb-4">
          <h3 className={styles.s4}>Active Web/App Sessions ({sessions.length})</h3>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className={styles.s5}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : sessions.length === 0 ? (
          <div className={styles.s6}>
            No active database sessions tracked.
          </div>
        ) : (
          <div className="ui-stack-3">
            {sessions.map((s) => {
              const email = s.user?.email || 'N/A';
              const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown User';
              return (
                <div
                  key={s.id}
                  className={styles.s7}
                >
                  <div className={styles.s8}>
                    <div className={styles.s9}>
                      <Monitor size={24} />
                    </div>
                    <div>
                      <div className={styles.s10}>
                        {s.device || 'Unknown Device'} &bull; {s.browser || 'Unknown Browser'}
                      </div>
                      <div className={styles.s11}>
                        {name} (<span className="font-mono">{email}</span>)
                      </div>
                      <div className={styles.s12}>
                        IP: {s.ipAddress || '—'} &bull; Location: {s.location || '—'}
                      </div>
                    </div>
                  </div>

                  <div className={styles.s13}>
                    <div className={styles.s14}>
                      <div>Started: {new Date(s.startedAt).toLocaleString()}</div>
                      <div className={styles.s15}>Activity: {new Date(s.lastActivityAt).toLocaleTimeString()}</div>
                    </div>
                    <button
                      onClick={() => revokeSession(s.id)}
                      className={styles.s16}
                    >
                      <XCircle size={12} />
                      Revoke Credentials
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
