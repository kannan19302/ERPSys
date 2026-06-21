'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, RefreshCw, XCircle, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

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

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sessions`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      } else {
        setError(`Failed to fetch sessions: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Error fetching sessions', e);
      setError('Connection error fetching sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/sessions/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        setSuccess('Active session revoked successfully');
        setTimeout(() => setSuccess(null), 3000);
        fetchSessions();
      } else {
        setError(`Failed to revoke session: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to revoke session', e);
      setError('Connection error revoking session');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Monitor style={{ color: 'var(--color-primary)' }} />
          Session Management
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Monitor and manage active device login sessions for users. Revoke credentials for compromised or stale sessions instantly.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-error-light)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Active Web/App Sessions ({sessions.length})</h3>
          <button 
            onClick={fetchSessions} 
            disabled={loading}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-6)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            No active database sessions tracked.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {sessions.map(s => {
              const email = s.user?.email || 'N/A';
              const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown User';
              return (
                <div 
                  key={s.id} 
                  style={{
                    background: 'var(--color-bg)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', 
                    padding: 'var(--space-4)',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '280px' }}>
                    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                      <Monitor size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                        {s.device || 'Unknown Device'} &bull; {s.browser || 'Unknown Browser'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {name} (<span style={{ fontFamily: 'monospace' }}>{email}</span>)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                        IP: {s.ipAddress || '—'} &bull; Location: {s.location || '—'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)', minWidth: '200px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                      <div>Started: {new Date(s.startedAt).toLocaleString()}</div>
                      <div style={{ marginTop: '2px' }}>Activity: {new Date(s.lastActivityAt).toLocaleTimeString()}</div>
                    </div>
                    <button 
                      onClick={() => revokeSession(s.id)} 
                      style={{ 
                        background: 'none', 
                        border: '1px solid var(--color-error)', 
                        padding: 'var(--space-1.5) var(--space-3)', 
                        borderRadius: 'var(--radius-md)', 
                        cursor: 'pointer', 
                        fontSize: '11px', 
                        color: 'var(--color-error)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontWeight: 'var(--weight-semibold)',
                        transition: 'background 0.2s, color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-error-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                      }}
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
