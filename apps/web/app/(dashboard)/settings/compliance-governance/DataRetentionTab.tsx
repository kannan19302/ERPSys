'use client';
import styles from './DataRetentionTab.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface DataRetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  action: string;
  isActive: boolean;
}

export default function DataRetentionTab() {
  const client = useApiClient();
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [retentionEntity, setRetentionEntity] = useState('AuditLog');
  const [retentionDays, setRetentionDays] = useState(180);
  const [retentionAction, setRetentionAction] = useState('archive');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRetentionPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRetentionPolicies(await client.get<DataRetentionPolicy[]>('/admin/security/data-retention'));
    } catch (e) {
      console.error('Failed to load retention policies', e);
      setError('Connection error loading policies');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchRetentionPolicies(); }, [fetchRetentionPolicies]);

  const saveRetentionPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await client.post('/admin/security/data-retention', { entityType: retentionEntity, retentionDays, action: retentionAction });
      setSuccess(`Policy configured successfully for ${retentionEntity}`);
      setTimeout(() => setSuccess(null), 3000);
      void fetchRetentionPolicies();
    } catch (e) {
      console.error('Failed to save retention policy', e);
      setError('Connection error saving policy');
    } finally {
      setSaving(false);
    }
  };

  const deleteRetentionPolicy = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await client.delete(`/admin/security/data-retention/${id}`);
      setSuccess('Retention policy removed');
      setTimeout(() => setSuccess(null), 3000);
      void fetchRetentionPolicies();
    } catch (e) {
      console.error('Failed to delete policy', e);
      setError('Connection error deleting policy');
    }
  };

  const getEntityLabel = (type: string) => {
    const map: Record<string, string> = {
      AuditLog: 'Audit Logs', UserSession: 'User Sessions',
      Invoice: 'Invoices & Finance Records', Activity: 'CRM Activity Logs',
    };
    return map[type] || type;
  };

  return (
    <div className={styles.p1}>
      {error && (
        <div className={styles.p2}>
          <AlertTriangle size={16} /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className={styles.p3}>
          <CheckCircle size={16} /><span>{success}</span>
        </div>
      )}

      <div className="ui-card p-5">
        <h3 className={styles.p4}>
          Create or Update Retention Window
        </h3>
        <form onSubmit={saveRetentionPolicy} className={styles.p5}>
          <div className={styles.p6}>
            <label className={styles.p7}>Data/Entity Type</label>
            <select value={retentionEntity} onChange={(e) => setRetentionEntity(e.target.value)} className={styles.p8}>
              <option value="AuditLog">Audit Logs</option>
              <option value="UserSession">User Sessions</option>
              <option value="Invoice">Invoices & Finance Records</option>
              <option value="Activity">CRM Activity Logs</option>
            </select>
          </div>
          <div className={styles.p9}>
            <label className={styles.p10}>Retention (Days)</label>
            <input type="number" value={retentionDays} onChange={(e) => setRetentionDays(parseInt(e.target.value) || 180)} min={1} required className={styles.p11} />
          </div>
          <div className={styles.p12}>
            <label className={styles.p13}>End-of-Life Action</label>
            <select value={retentionAction} onChange={(e) => setRetentionAction(e.target.value)} className={styles.p14}>
              <option value="archive">Archive to Cloud Storage (Drive/S3)</option>
              <option value="delete">Hard Delete Permanently</option>
            </select>
          </div>
          <div className={styles.p15}>
            <button type="submit" disabled={saving} className={styles.p16}>
              <Plus size={16} />
              {saving ? 'Saving...' : 'Set Policy'}
            </button>
          </div>
        </form>
      </div>

      <div className="ui-card p-5">
        <div className="ui-flex-between mb-4">
          <h3 className={styles.p17}>Configured Retention Policies ({retentionPolicies.length})</h3>
          <button onClick={fetchRetentionPolicies} disabled={loading} className={styles.p18}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : retentionPolicies.length === 0 ? (
          <div className={styles.p19}>
            No custom data retention policies configured. Default system-wide logs retention rules apply.
          </div>
        ) : (
          <div className="ui-stack-3">
            {retentionPolicies.map((policy) => (
              <div key={policy.id} className={styles.p20}>
                <div className="ui-hstack-3">
                  <Clock size={20} className="ui-text-primary" />
                  <div>
                    <div className={styles.p21}>
                      {getEntityLabel(policy.entityType)}
                    </div>
                    <div className={styles.p22}>
                      Retain for <strong className={styles.p23}>{policy.retentionDays} days</strong>, then automatically{' '}
                      <span style={{ color: policy.action === 'delete' ? 'var(--color-error)' : 'var(--color-primary)' }} className={styles.s1}>
                        {policy.action}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteRetentionPolicy(policy.id)} className={styles.p24} title="Delete Policy">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
