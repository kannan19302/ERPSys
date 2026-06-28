'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Smartphone, Download, Languages, Play, Clock, AlertCircle } from 'lucide-react';

export default function NativeExportPage() {
  const [version, setVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState('android');
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logView, setLogView] = useState<any>(null);

  const fetchBuilds = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/native-builds', { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) {
        const data = await res.json();
        setBuilds(data || []);
      }
    } catch (err) {
      console.error('Failed to load native builds:', err);
    }
  };

  useEffect(() => {
    fetchBuilds();
    const interval = setInterval(fetchBuilds, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBuildTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/native-builds/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ version, platform })
      });
      if (res.ok) {
        fetchBuilds();
      }
    } catch (err) {
      console.error('Failed to trigger build:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'version', header: 'Version' },
    { key: 'platform', header: 'Platform' },
    { 
      key: 'status', 
      header: 'Build Status',
      render: (row: any) => (
        <span className={`frappe-badge ${row.status === 'COMPLETED' ? 'frappe-badge-success' : 'frappe-badge-warning'}`}>
          {row.status}
        </span>
      )
    },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (row: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="frappe-btn" 
            onClick={() => setLogView(row)}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            Logs
          </button>
          {row.status === 'COMPLETED' && row.downloadUrl && (
            <a 
              className="frappe-btn frappe-btn-primary" 
              href={row.downloadUrl}
              style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Download size={12} /> Download Binaries
            </a>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Mobile Export & App Build Studio"
        description="Configure native mobile compilation parameters, trigger cloud builds, and track Capacitor platform logs."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
        {/* Compilation triggers */}
        <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Smartphone size={16} /> Native Compilation Build
          </h3>
          <form onSubmit={handleBuildTrigger} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="frappe-form-group">
              <label className="frappe-label">Build Version</label>
              <input 
                className="frappe-input" 
                value={version} 
                onChange={e => setVersion(e.target.value)} 
                placeholder="1.0.0"
                required
              />
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Target Platform</label>
              <select 
                className="frappe-input" 
                value={platform} 
                onChange={e => setPlatform(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="android">Android (APK / AAB)</option>
                <option value="ios">iOS (IPA / Xcode Project)</option>
              </select>
            </div>
            <button className="frappe-btn frappe-btn-primary" type="submit" disabled={loading}>
              <Download size={12} /> {loading ? 'Compiling mobile shell...' : 'Trigger Build'}
            </button>
          </form>
        </div>

        {/* Build History table */}
        <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} /> Compilation Pipeline History
          </h3>
          <DataTable columns={columns} data={builds} />
        </div>
      </div>

      {logView && (
        <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h4 style={{ margin: 0, fontWeight: 600 }}>Compilation Log Summary (v{logView.version})</h4>
            <button className="frappe-btn" onClick={() => setLogView(null)}>Close Logs</button>
          </div>
          <pre style={{ margin: 0, padding: 'var(--space-3)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {logView.logSummary || 'Queued in build execution pipeline...'}
          </pre>
        </div>
      )}
    </div>
  );
}

