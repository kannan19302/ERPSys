'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Smartphone, Download, Languages, Play, Clock, AlertCircle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function NativeExportPage() {
  const client = useApiClient();
  const [version, setVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState('android');
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logView, setLogView] = useState<any>(null);

  const fetchBuilds = async () => {
    try {
      setBuilds((await client.get<any[]>('/builder/native-builds')) || []);
    } catch (err) {
      console.error('Failed to load native builds:', err);
    }
  };

  useEffect(() => {
    fetchBuilds();
    const interval = setInterval(fetchBuilds, 3000);
    return () => clearInterval(interval);
  }, [client]);

  const handleBuildTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/builder/native-builds/trigger', { version, platform });
      fetchBuilds();
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
        <span className={`ui-badge ${row.status === 'COMPLETED' ? 'ui-badge-success' : 'ui-badge-warning'}`}>
          {row.status}
        </span>
      )
    },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (row: any) => (
        <div className={styles.s1}>
          <button 
            className={`ui-btn ${styles.s2}`} 
            onClick={() => setLogView(row)}
            
          >
            Logs
          </button>
          {row.status === 'COMPLETED' && row.downloadUrl && (
            <a 
              className={`ui-btn ui-btn-primary ${styles.s3}`} 
              href={row.downloadUrl}
              
            >
              <Download size={12} /> Download Binaries
            </a>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Mobile Export & App Build Studio"
        description="Configure native mobile compilation parameters, trigger cloud builds, and track Capacitor platform logs."
      />

      <div className={styles.s4}>
        {/* Compilation triggers */}
        <div className="ui-card p-5">
          <h3 className={styles.s5}>
            <Smartphone size={16} /> Native Compilation Build
          </h3>
          <form onSubmit={handleBuildTrigger} className="ui-stack-4">
            <div className="ui-form-group">
              <label className="ui-label">Build Version</label>
              <input 
                className="ui-input" 
                value={version} 
                onChange={e => setVersion(e.target.value)} 
                placeholder="1.0.0"
                required
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Target Platform</label>
              <select 
                className="ui-input w-full" 
                value={platform} 
                onChange={e => setPlatform(e.target.value)}
              >
                <option value="android">Android (APK / AAB)</option>
                <option value="ios">iOS (IPA / Xcode Project)</option>
              </select>
            </div>
            <button className="ui-btn ui-btn-primary" type="submit" disabled={loading}>
              <Download size={12} /> {loading ? 'Compiling mobile shell...' : 'Trigger Build'}
            </button>
          </form>
        </div>

        {/* Build History table */}
        <div className="ui-card p-5">
          <h3 className={styles.s5}>
            <Clock size={16} /> Compilation Pipeline History
          </h3>
          <DataTable columns={columns} data={builds} />
        </div>
      </div>

      {logView && (
        <div className="ui-card p-5">
          <div className="ui-flex-between mb-4">
            <h4 className={styles.s6}>Compilation Log Summary (v{logView.version})</h4>
            <button className="ui-btn" onClick={() => setLogView(null)}>Close Logs</button>
          </div>
          <pre className={styles.s7}>
            {logView.logSummary || 'Queued in build execution pipeline...'}
          </pre>
        </div>
      )}
    </div>
  );
}

