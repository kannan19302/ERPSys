'use client';

import React, { useState, useEffect } from 'react';
import { Database, Plus, RefreshCw, CheckCircle, Download, Trash2, ShieldAlert } from 'lucide-react';

interface BackupRecord {
  id: string;
  filename: string;
  sizeBytes: number;
  createdBy: string;
  createdAt: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/operations/backups', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/operations/backups/create', {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        setFeedback('SQL database backup archive generated successfully.');
        setTimeout(() => setFeedback(null), 4000);
        fetchBackups();
      }
    } catch (e) {
      console.error(e);
      setFeedback('Failed to create backup.');
    } finally {
      setCreating(false);
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Database style={{ color: 'var(--color-primary)' }} />
            Backup & Restore Manager
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Perform cold database backups, download snapshot archives, and trigger point-in-time state recovery.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button onClick={handleCreateBackup} disabled={creating} style={{
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
            cursor: creating ? 'wait' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            <Plus size={16} />
            {creating ? 'Backing Up...' : 'Generate New SQL Backup'}
          </button>
          <button onClick={fetchBackups} disabled={loading} style={{
            background: 'transparent', border: '1px solid var(--color-border)',
            padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          background: 'rgba(var(--color-success-rgb), 0.1)', border: '1px solid var(--color-success)',
          color: 'var(--color-success)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      {/* Disasters Alert banner */}
      <div style={{
        background: 'rgba(var(--color-warning-rgb), 0.05)', border: '1px solid var(--color-warning)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)',
        alignItems: 'flex-start'
      }}>
        <ShieldAlert style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Disaster Recovery Protocols</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginTop: '2px' }}>
            Backups are stored securely in internal private cloud object buckets. Running a manual state restoration replaces current operational tables immediately. Ensure you notify all tenant users prior to initiating a rollback.
          </p>
        </div>
      </div>

      {/* Backups List */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Backup Filename</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>File Size</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Triggered By</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Created Timestamp</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)', margin: '0 auto' }} />
                </td>
              </tr>
            ) : backups.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', fontFamily: 'monospace' }}>{b.filename}</td>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>{formatSize(b.sizeBytes)}</td>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{b.createdBy}</td>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(b.createdAt).toLocaleString()}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                    <button style={{
                      background: 'transparent', border: '1px solid var(--color-border)', padding: '4px 8px',
                      borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Download size={12} /> Download
                    </button>
                    <button style={{
                      background: 'transparent', border: '1px solid var(--color-border)', padding: '4px 8px',
                      borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer',
                      color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {backups.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  No backup records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
