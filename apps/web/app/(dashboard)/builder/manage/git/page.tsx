'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { GitPullRequest, GitCommit, Settings, Save, AlertCircle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function GitIntegrationPage() {
  const client = useApiClient();
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
      const [config, diff] = await Promise.all([
        client.get<any>('/builder/git/config'), client.get<any[]>('/builder/git/diff')
      ]);
      setRepoUrl(config.repoUrl || '');
      setBranch(config.branch || 'main');
      setStatus(config.status || 'DISCONNECTED');
      setDiffFiles(diff || []);
    } catch (err) {
      console.error('Failed to load git details:', err);
    }
  };

  useEffect(() => {
    fetchConfigAndDiff();
  }, [client]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await client.post('/builder/git/config', { repoUrl, branch });
      setMessage('Git configuration updated successfully!');
      fetchConfigAndDiff();
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
      await client.post('/builder/git/commit', { message: commitMessage });
      setMessage('Changes pushed to remote repository!');
      setCommitMessage('');
      fetchConfigAndDiff();
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
        <span className="ui-badge ui-badge-warning">{row.status}</span>
      )
    },
    { key: 'additions', header: 'Lines Added' },
    { key: 'deletions', header: 'Lines Deleted' }
  ];

  return (
    <div className={styles.s1}>
      <PageHeader
        title="Git Source Control & Synchronization"
        description="Synchronize customizations, workflows, and database models to Git, and inspect staged differences."
      />

      {message && (
        <div className={`ui-card ${styles.s2}`} >
          <AlertCircle size={16} />
          <span className="text-sm">{message}</span>
        </div>
      )}

      <div className="ui-grid-2 ui-gap-6">
        {/* Config Form */}
        <div className="ui-card p-5">
          <h3 className={styles.s3}>
            <Settings size={16} /> Repository Connection Setup
          </h3>
          <form onSubmit={handleSaveConfig} className="ui-stack-4">
            <div className="ui-form-group">
              <label className="ui-label">Repository URL</label>
              <input 
                className="ui-input" 
                value={repoUrl} 
                onChange={e => setRepoUrl(e.target.value)} 
                placeholder="e.g. https://github.com/unerp/workspace.git"
                required
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Deployment Branch</label>
              <input 
                className="ui-input" 
                value={branch} 
                onChange={e => setBranch(e.target.value)} 
                placeholder="main"
                required
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Connection Status</label>
              <div>
                <span className={`ui-badge ${status === 'CONNECTED' ? 'ui-badge-success' : 'ui-badge-danger'}`}>
                  {status}
                </span>
              </div>
            </div>
            <button className="ui-btn ui-btn-primary" type="submit" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        </div>

        {/* Diff & Commit Form */}
        <div className={styles.s4}>
          <div className="ui-card p-5">
            <h3 className={styles.s3}>
              <GitPullRequest size={16} /> Workspace Differences
            </h3>
            {diffFiles.length > 0 ? (
              <DataTable columns={diffColumns} data={diffFiles} />
            ) : (
              <p className={styles.s5}>No differences detected in the workspace.</p>
            )}
          </div>

          <div className="ui-card p-5">
            <h3 className={styles.s3}>
              <GitCommit size={16} /> Deploy & Commit Changes
            </h3>
            <div className="ui-stack-4">
              <div className="ui-form-group">
                <label className="ui-label">Commit Message</label>
                <input 
                  className="ui-input" 
                  value={commitMessage} 
                  onChange={e => setCommitMessage(e.target.value)} 
                  placeholder="e.g. feat: add custom fields to finance invoice form"
                />
              </div>
              <button 
                className="ui-btn ui-btn-primary" 
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

