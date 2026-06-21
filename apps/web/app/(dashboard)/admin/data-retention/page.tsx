'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, RefreshCw, Database, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DataRetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  action: string;
  isActive: boolean;
}

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function DataRetentionPage() {
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
      const res = await fetch(`${API_BASE}/data-retention`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRetentionPolicies(data);
      } else {
        setError(`Failed to fetch retention policies: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to load retention policies', e);
      setError('Connection error loading policies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRetentionPolicies();
  }, [fetchRetentionPolicies]);

  const saveRetentionPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/data-retention`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ entityType: retentionEntity, retentionDays, action: retentionAction }),
      });
      if (res.ok) {
        setSuccess(`Policy configured successfully for ${retentionEntity}`);
        setTimeout(() => setSuccess(null), 3000);
        fetchRetentionPolicies();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || `Failed to save policy: ${res.statusText}`);
      }
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
      const res = await fetch(`${API_BASE}/data-retention/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        setSuccess('Retention policy removed');
        setTimeout(() => setSuccess(null), 3000);
        fetchRetentionPolicies();
      } else {
        setError(`Failed to delete policy: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to delete policy', e);
      setError('Connection error deleting policy');
    }
  };

  const getEntityLabel = (type: string) => {
    const map: Record<string, string> = {
      AuditLog: 'Audit Logs',
      UserSession: 'User Sessions',
      Invoice: 'Invoices & Finance Records',
      Activity: 'CRM Activity Logs',
    };
    return map[type] || type;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Database style={{ color: 'var(--color-primary)' }} />
          Data Retention Policies
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Establish storage limitations and archival triggers for transaction tables, login histories, audit trails, and system log records.
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
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
          Create or Update Retention Window
        </h3>
        
        <form onSubmit={saveRetentionPolicy} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
              Data/Entity Type
            </label>
            <select 
              value={retentionEntity} 
              onChange={e => setRetentionEntity(e.target.value)} 
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}
            >
              <option value="AuditLog">Audit Logs</option>
              <option value="UserSession">User Sessions</option>
              <option value="Invoice">Invoices & Finance Records</option>
              <option value="Activity">CRM Activity Logs</option>
            </select>
          </div>
          
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
              Retention (Days)
            </label>
            <input 
              type="number" 
              value={retentionDays} 
              onChange={e => setRetentionDays(parseInt(e.target.value) || 180)} 
              min={1}
              required
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', textAlign: 'center' }} 
            />
          </div>

          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
              End-of-Life Action
            </label>
            <select 
              value={retentionAction} 
              onChange={e => setRetentionAction(e.target.value)} 
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}
            >
              <option value="archive">Archive to Cloud Storage (Drive/S3)</option>
              <option value="delete">Hard Delete Permanently</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              type="submit" 
              disabled={saving} 
              style={{ 
                background: 'var(--color-primary)', 
                color: '#fff', 
                border: 'none', 
                padding: 'var(--space-2) var(--space-4)', 
                borderRadius: 'var(--radius-md)', 
                cursor: 'pointer', 
                fontSize: 'var(--text-sm)', 
                fontWeight: 'var(--weight-semibold)',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}
            >
              <Plus size={16} />
              {saving ? 'Saving...' : 'Set Policy'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Configured Retention Policies ({retentionPolicies.length})</h3>
          <button 
            onClick={fetchRetentionPolicies} 
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
        ) : retentionPolicies.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-6)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            No custom data retention policies configured. Default system-wide logs retention rules apply.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {retentionPolicies.map(policy => (
              <div 
                key={policy.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 'var(--space-3) var(--space-4)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Clock size={20} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                      {getEntityLabel(policy.entityType)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      Retain for <strong style={{ color: 'var(--color-text)' }}>{policy.retentionDays} days</strong>, then automatically{' '}
                      <span style={{ 
                        textTransform: 'uppercase', 
                        fontWeight: 'var(--weight-bold)',
                        color: policy.action === 'delete' ? 'var(--color-error)' : 'var(--color-primary)'
                      }}>
                        {policy.action}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteRetentionPolicy(policy.id)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}
                  title="Delete Policy"
                >
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
