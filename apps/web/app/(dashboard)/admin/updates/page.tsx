'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle, RefreshCw, AlertCircle, ArrowUpCircle } from 'lucide-react';

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
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/platform/updates', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleCheckUpdates = async () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      fetchUpdates();
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Cpu style={{ color: 'var(--color-primary)' }} />
            System Updates Manager
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Check for core software version upgrades, view release logs, and manage automated upgrade triggers.
          </p>
        </div>
        <button onClick={handleCheckUpdates} disabled={checking || loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: (checking || loading) ? 'wait' : 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <RefreshCw size={12} className={checking || loading ? 'spin' : ''} />
          Check for updates
        </button>
      </div>

      {loading && !status ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : status && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Main Status Panel */}
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              {status.updateAvailable ? (
                <ArrowUpCircle size={36} style={{ color: 'var(--color-primary)' }} />
              ) : (
                <CheckCircle size={36} style={{ color: 'var(--color-success)' }} />
              )}
              <div>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)' }}>
                  {status.updateAvailable ? 'Software Upgrade Available' : 'System Up To Date'}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                  Current Version: <strong>{status.currentVersion}</strong> • Latest Version: <strong>{status.latestVersion}</strong>
                </p>
              </div>
            </div>
            {status.updateAvailable && (
              <button style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
              }}>
                Apply Upgrade
              </button>
            )}
          </div>

          {/* Release Notes Changelog */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              Release Logs & Changelogs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {status.releaseNotes.map((note, idx) => (
                <div key={idx} style={{ paddingBottom: 'var(--space-4)', borderBottom: idx < status.releaseNotes.length - 1 ? '1px dashed var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>{note.version}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Released on {note.date}</span>
                  </div>
                  <ul style={{ paddingLeft: 'var(--space-4)', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {note.fixes.map((fix, fIdx) => (
                      <li key={fIdx} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
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
  );
}
