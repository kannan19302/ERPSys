'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { GitPullRequest, GitCommit, Settings, Save, AlertCircle } from 'lucide-react';

export default function GitIntegrationPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [status, setStatus] = useState('DISCONNECTED');
  const [diffFiles, setDiffFiles] = useState<any[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchConfigAndDiff = async () => {
    try {
      const token = localStorage.getItem('token');
      const [configRes, diffRes] = await Promise.all([
        fetch('/api/v1/builder/git/config', { headers: { Authorization: `Bearer ${token || ''}` } }),
        fetch('/api/v1/builder/git/diff', { headers: { Authorization: `Bearer ${token || ''}` } })
      ]);
      
      if (configRes.ok) {
        const config = await configRes.json();
        setRepoUrl(config.repoUrl || '');
        setBranch(config.branch || 'main');
        setStatus(config.status || 'DISCONNECTED');
      }
      
      if (diffRes.ok) {
        const diff = await diffRes.json();
        setDiffFiles(diff || []);
      }
    } catch (err) {
      console.error('Failed to load git details:', err);
    }
  };

  useEffect(() => {
    fetchConfigAndDiff();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/git/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ repoUrl, branch })
      });
      if (res.ok) {
        setMessage('Git configuration updated successfully!');
        fetchConfigAndDiff();
      }
    } catch {
      setMessage('Failed to save Git configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      alert('Please enter a commit message.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/git/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ message: commitMessage })
      });
      if (res.ok) {
        setMessage('Changes pushed to remote repository!');
        setCommitMessage('');
        fetchConfigAndDiff();
      }
    } catch {
      setMessage('Failed to push changes.');
    } finally {
      setLoading(false);
    }
  };

  const diffColumns = [
    { key: 'file', header: 'File Path' },
    { 
      key: 'status', 
      header: 'Change Status',
      render: (row: any) => (
        <span className="frappe-badge frappe-badge-warning">{row.status}</span>
      )
    },
    { key: 'additions', header: 'Lines Added' },
    { key: 'deletions', header: 'Lines Deleted' }
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Git Source Control & Synchronization"
        description="Synchronize customizations, workflows, and database models to Git, and inspect staged differences."
      />

      {message && (
        <div className="frappe-card" style={{ padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 'var(--text-sm)' }}>{message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Config Form */}
        <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Settings size={16} /> Repository Connection Setup
          </h3>
          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="frappe-form-group">
              <label className="frappe-label">Repository URL</label>
              <input 
                className="frappe-input" 
                value={repoUrl} 
                onChange={e => setRepoUrl(e.target.value)} 
                placeholder="e.g. https://github.com/unerp/workspace.git"
                required
              />
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Deployment Branch</label>
              <input 
                className="frappe-input" 
                value={branch} 
                onChange={e => setBranch(e.target.value)} 
                placeholder="main"
                required
              />
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Connection Status</label>
              <div>
                <span className={`frappe-badge ${status === 'CONNECTED' ? 'frappe-badge-success' : 'frappe-badge-danger'}`}>
                  {status}
                </span>
              </div>
            </div>
            <button className="frappe-btn frappe-btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        </div>

        {/* Diff & Commit Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GitPullRequest size={16} /> Workspace Differences
            </h3>
            {diffFiles.length > 0 ? (
              <DataTable columns={diffColumns} data={diffFiles} />
            ) : (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>No differences detected in the workspace.</p>
            )}
          </div>

          <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GitCommit size={16} /> Deploy & Commit Changes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-form-group">
                <label className="frappe-label">Commit Message</label>
                <input 
                  className="frappe-input" 
                  value={commitMessage} 
                  onChange={e => setCommitMessage(e.target.value)} 
                  placeholder="e.g. feat: add custom fields to finance invoice form"
                />
              </div>
              <button 
                className="frappe-btn frappe-btn-primary" 
                onClick={handleCommit} 
                disabled={loading || diffFiles.length === 0}
              >
                {loading ? 'Pushing Commit...' : 'Commit & Push'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

